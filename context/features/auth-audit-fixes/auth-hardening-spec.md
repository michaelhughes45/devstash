# Auth Hardening

## Overview

Fix three findings from the auth security audit (`docs/audit-results/AUTH_SECURITY_REVIEW.md`): email links built from request headers, sign-in timing that reveals which emails have accounts, and the password length limit counting characters instead of bytes.

## Requirements

### Fixed base URL for email links

- Add an `APP_URL` environment variable (`http://localhost:3000` in development, the real domain in production) and add it to the Environment Variables section of `context/project-overview.md`
- Add `src/lib/app-url.ts` with an `appUrl(path)` helper that builds a `URL` from `APP_URL` and throws if it isn't set
- `sendVerificationEmail` (`src/lib/email-verification.ts`) and `sendPasswordResetEmail` (`src/lib/password-reset.ts`) build their links with `appUrl()` and no longer take an `origin` parameter
- Remove `requestOrigin()` from `src/actions/auth.ts` and the `new URL(request.url).origin` calls in `src/auth.ts` and `src/app/api/auth/register/route.ts`

### Constant-time sign-in

- In the credentials `authorize` (`src/auth.ts`), always run `bcrypt.compare`, using a precomputed dummy bcrypt hash (12 rounds) when the user doesn't exist or has no password
- An unknown email, an OAuth-only user and a wrong password all return `null` after the comparison
- The `emailVerified` check still runs only after a correct password

### Password length in bytes

- In `src/lib/validations/auth.ts`, replace `.max(72)` on `newPassword` with a check that the UTF-8 byte length is at most 72 ("Password is too long")
- Add `.max(256)` to the sign-in `password` and the change-password `currentPassword` fields
- Don't apply the 72-byte rule to sign-in or current-password, so existing users with longer passwords can still sign in

## Notes

- Register keeps returning 409 for an existing email for now. With email verification off there's no way to tell the owner, and a generic response would confuse users who mistyped. Revisit once a Resend domain is set up; rate limiting (`rate-limiting-spec.md`) covers bulk checking in the meantime.
- The dummy hash must be a valid bcrypt hash with the same cost (12) so the timing matches. Generate it once and store it as a constant.
- Verify: verification and reset emails link to `APP_URL` even when the request is sent with a different `Host`/`Origin` header; sign-in still works for valid users and fails for unknown emails; a password with multi-byte characters over 72 bytes is rejected on register, reset and change password.
