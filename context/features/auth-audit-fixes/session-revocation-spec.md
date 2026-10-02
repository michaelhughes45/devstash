# Session Revocation

## Overview

Sign users out everywhere when their password changes or is reset, or their account is deleted. Today JWT sessions stay valid for their full lifetime (30 days by default) after any of these, so a stolen session survives the password change meant to stop it. Finding from `docs/audit-results/AUTH_SECURITY_REVIEW.md`.

## Requirements

- Add `sessionVersion Int @default(0)` to `User` with a Prisma migration (`prisma migrate dev`, never `db push`)
- Add a `jwt` callback in `src/auth.ts` (keep the existing `session` callback from `auth.config.ts`):
  - On sign-in, store the user's current `sessionVersion` in the token
  - On later requests, look up the user's `sessionVersion`; return `null` (ends the session) if the user no longer exists or the version doesn't match
- Add `sessionVersion` to the JWT type in `src/types/next-auth.d.ts`
- Increment `sessionVersion` in the same transaction as the password update in `changeUserPassword` (`src/lib/account.ts`) and `resetPassword` (`src/lib/password-reset.ts`)
- Account deletion needs no extra change: a missing user ends the session
- After changing their password, the user is signed out and redirected to `/sign-in?passwordChanged=1`, which shows "Password changed. Sign in with your new password."
- The dashboard redirects to `/sign-in` when there's no session, like `/profile` already does, instead of rendering an empty dashboard

## Notes

- The check must not go in `auth.config.ts`: that config runs in the proxy, which has no database access. The proxy keeps checking only the JWT signature; pages and server actions get the real check through `auth()` / `getSession()`.
- `getSession` is cached per request, so this adds one small query per request.
- Signing the current device out after a password change is the simplest option. Keeping it signed in would mean re-issuing its token through NextAuth's `update()` (`trigger === "update"`); not needed now.
- Verify: sign in on two browsers, change the password on one, confirm both are signed out; same for a password reset; delete an account and confirm the other browser's session ends; GitHub sign-in still works.
