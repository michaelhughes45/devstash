# Auth Security Review

**Last audit:** 2026-10-02
**Scope:** `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts`, `src/actions/auth.ts`, `src/actions/profile.ts`, `src/lib/{tokens,email-verification,password-reset,password,account,session,safe-callback-url}.ts`, `src/lib/validations/auth.ts`, `src/lib/db/users.ts`, `src/app/api/auth/{register,verify-email}`, `src/app/(auth)/**`, `src/app/profile/page.tsx`, profile components, `prisma/schema.prisma`

## Summary

| Severity | Count |
| --- | --- |
| Critical | 0 |
| High | 0 |
| Medium | 4 |
| Low | 2 |

The core flows (hashing, token generation and storage, single-use consumption, authorization of server actions) are solid. The gaps are missing rate limiting, user enumeration, unvalidated request origin in emailed links, and JWT sessions that are never revoked.

## Findings

### [MEDIUM] No rate limiting on any auth endpoint

- **Location:** `src/auth.ts:24` (credentials authorize), `src/app/api/auth/register/route.ts:30`, `src/actions/auth.ts:100` (forgot password), `src/actions/auth.ts:134` (reset), `src/actions/profile.ts:18` (change password)
- **Issue:** Nothing throttles sign-in, register, forgot-password, reset-password or change-password (no limiter in code, proxy matcher covers only `/dashboard` and `/profile`).
- **Attack scenario:** (1) An attacker runs unlimited password guesses against `/sign-in` for a known email. (2) Posting the forgot-password form repeatedly for a victim's address sends a reset email each time (`sendPasswordResetEmail`), enabling email bombing and burning Resend quota. (3) Concurrent registers or sign-ins each trigger a 12-round bcrypt, which makes CPU exhaustion cheap.
- **Fix:** Add a limiter (for example Upstash `@upstash/ratelimit`, already anticipated in the project overview) keyed by IP and by normalised email, applied in `authorize`, the register route and the server actions:
  ```ts
  const { success } = await ratelimit.limit(`signin:${ip}:${email}`);
  if (!success) return null; // or return a "too many attempts" state
  ```
- **Reference:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

### [MEDIUM] Email links are built from request-controlled origin

- **Location:** `src/actions/auth.ts:92-98` (`requestOrigin` uses the `Origin`, `x-forwarded-proto` and `Host` headers), `src/app/api/auth/register/route.ts:71` and `src/auth.ts:39` (`new URL(request.url).origin`)
- **Issue:** The reset and verification links are built from headers/URL of the incoming request rather than a configured base URL. The reset link is emailed to the victim, not the requester.
- **Attack scenario:** On a deployment that doesn't pin the Host header (self-hosted or a permissive proxy), an attacker sends the forgot-password request for `victim@example.com` with `Host`/`Origin` set to `attacker.tld`. The victim gets a genuine DevStash email whose link points at `https://attacker.tld/reset-password?token=...`. If clicked, the attacker captures the token and resets the victim's password (account takeover). Vercel normally rewrites Host, so exposure depends on hosting. This was not tested against a running server.
- **Fix:** Use a fixed origin from the environment:
  ```ts
  const origin = process.env.APP_URL!; // e.g. https://devstash.app
  ```
  and pass it to `sendPasswordResetEmail`/`sendVerificationEmail` instead of header-derived values.

### [MEDIUM] User enumeration via register response and sign-in timing

- **Location:** `src/app/api/auth/register/route.ts:57` and `:84` (409 "An account with this email already exists"); `src/auth.ts:29-34`
- **Issue:** Register explicitly tells callers whether an email exists. In `authorize`, an unknown email or OAuth-only user returns at line 31 without running bcrypt, while an existing user runs a 12-round `bcrypt.compare`, so response time differs by a couple hundred milliseconds. (Forgot-password is handled correctly.)
- **Attack scenario:** An attacker submits a list of emails to `/api/auth/register` (409 vs 201) or times `/sign-in` to build a list of registered users for credential stuffing or phishing. Registering also creates a real account for each unused email, which can be avoided.
- **Fix:** Compare against a dummy hash when the user is missing so timing matches:
  ```ts
  const DUMMY_HASH = "$2b$12$..."; // a precomputed valid bcrypt hash
  await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user?.password) return null;
  ```
  For register, respond identically in both cases (generic "check your email") and email the existing owner a notice. If product accepts the usability trade-off for register, at least rate limit it.

### [MEDIUM] JWT sessions are never revoked (confirms the documented gap)

- **Location:** `src/auth.ts:52` (`strategy: "jwt"`), `src/auth.config.ts:22-29` (no `jwt` callback checking the user), `src/lib/account.ts:25-30` and `src/lib/password-reset.ts:64-73` (no session invalidation), `src/actions/profile.ts:73`
- **Issue:** The token is trusted until it expires (default 30 days). Password reset, password change and account deletion don't invalidate other tokens, and `signOut` only clears the current cookie. The proxy checks only the JWT.
- **Attack scenario:** An attacker with a stolen session cookie keeps access after the victim resets or changes their password, which is the very step meant to evict them. After account deletion, the old token still passes the proxy (`/profile` handles a missing user, but any new endpoint that trusts `session.user.id` would not).
- **Fix:** Add a `sessionVersion` (or `passwordChangedAt`) field to `User`, store it in the token in a `jwt` callback and compare on each request in the Node (non-edge) `auth()` path, bumping it on reset, change and delete; or reduce `session.maxAge`.

### [LOW] Password max length counted in characters, not bytes

- **Location:** `src/lib/validations/auth.ts:10` (`.max(72)`), `src/lib/password.ts:6`
- **Issue:** bcrypt only uses the first 72 UTF-8 bytes. `bcryptjs` 3.0.3 truncates silently (it exposes `truncates()` but `hash` doesn't throw). A 72-character password with multi-byte characters (e.g. emoji, accented letters) is silently cut, reducing entropy without the user knowing.
- **Attack scenario:** Limited: a user with a long non-ASCII password has an effectively shorter secret, and two passwords sharing the first 72 bytes are interchangeable. `signInSchema` also has no max, so very large passwords are accepted for comparison.
- **Fix:**
  ```ts
  .refine((v) => new TextEncoder().encode(v).length <= 72, "Password is too long")
  ```
  and add `.max(128)` to sign-in and current-password fields.

### [LOW] Delete account has no server-side confirmation or re-authentication

- **Location:** `src/actions/profile.ts:61-75`, `src/components/profile/DeleteAccountDialog.tsx`
- **Issue:** The confirmation is a client-side dialog only. The server action takes no argument and does not require the password, so any valid session can destroy the account and all data.
- **Attack scenario:** Someone with brief access to a signed-in browser or a stolen cookie permanently deletes the account in one call. Impact is limited by the need for an existing session.
- **Fix:** For password users require the current password (or a typed confirmation such as the email) in the action and verify with `bcrypt.compare`; for OAuth-only users require a typed confirmation.

## Passed Checks

- ✅ Passwords hashed with bcrypt, 12 rounds, on every write path: register (`src/app/api/auth/register/route.ts:63`), reset (`src/lib/password-reset.ts:57`), change (`src/lib/account.ts:23`) via `hashPassword` in `src/lib/password.ts`; comparison with bcrypt `compare` (`src/auth.ts:33`, `src/lib/account.ts:20`).
- ✅ Credentials `authorize` validates input with Zod, lowercases the email, rejects OAuth-only users without a password, and checks `emailVerified` only after the password so unverified status isn't exposed to guessers (`src/auth.ts:25-44`). The sign-in error is generic (`src/actions/auth.ts:55-63`).
- ✅ Tokens are 32 bytes from `crypto.randomBytes`, only the SHA-256 hash is stored, and lookups are by hash (`src/lib/tokens.ts:14-40`).
- ✅ Expiry is set (24h verification, 1h reset) and checked server-side in `consumeToken` (`src/lib/tokens.ts:64`); tokens are single-use via delete-first with a count check, so concurrent replay fails (`src/lib/tokens.ts:59-63`); issuing a new token replaces older ones in a transaction (`src/lib/tokens.ts:22-31`).
- ✅ Verification and reset tokens can't substitute for each other: reset identifiers carry the `password-reset:` prefix, verification excludes it (`src/lib/email-verification.ts:8`) and reset requires it (`src/lib/password-reset.ts:14`); `z.email()` can't produce an address starting with that prefix.
- ✅ Reset flow: same validation as registration (`resetPasswordSchema`), clears other reset and verification tokens (`src/lib/password-reset.ts:70-72`), reset page doesn't consume the token on load and sets `referrer: no-referrer` (`src/app/(auth)/reset-password/page.tsx:16-20`).
- ✅ Forgot-password returns the same response for every email and sends in `after()`, so neither body nor timing differs; OAuth-only users are skipped silently (`src/actions/auth.ts:114-124`, `src/lib/password-reset.ts:29`).
- ✅ Server actions derive the user id from the session (`src/actions/profile.ts:22,62`) and `where` clauses use that id (`src/lib/account.ts:14,26,49`); no user id comes from form data (no IDOR).
- ✅ Change password requires the current password, applies shared validation, re-hashes, and clears outstanding reset links (`src/lib/account.ts:9-31`).
- ✅ Delete account is scoped to the session user, uses a confirmation dialog, cascades related data and removes email and reset tokens (`src/lib/account.ts:36-51`).
- ✅ The profile page checks the session and handles a deleted user (`src/app/profile/page.tsx:32-42`); the password hash never reaches client components, only `hasPassword` (`src/lib/db/users.ts:27-29`).
- ✅ `safeCallbackUrl` rejects absolute, `//` and `/\` URLs and is applied in the sign-in page and both sign-in actions; NextAuth's default redirect callback prefixes relative paths with the base URL (`src/lib/safe-callback-url.ts`).
- ✅ `isEmailVerificationEnabled` fails safe: only the exact string `false` disables verification (`src/lib/email-verification.ts:13-15`).
- ✅ No account linking override: the GitHub provider doesn't enable `allowDangerousEmailAccountLinking`, so a pre-registered credentials account can't be taken over via OAuth.
- ✅ The proxy protects `/dashboard` and `/profile` (`src/proxy.ts`); the registration route handles the concurrent-insert race (`P2002`).

## Not Covered by This Audit

- Whether Host/Origin spoofing actually reaches the app depends on the production hosting and proxy setup (a running server was not tested).
- The known documented whitespace-email validation gap is a usability issue (validation runs before `trim`) and has no security impact; not reported.
- `.env` contents and Resend delivery behaviour were not reviewed. Reset emails were not read end to end.
- Full GitHub OAuth round trip and NextAuth internals (CSRF, cookies, PKCE) are out of scope per the audit rules.
