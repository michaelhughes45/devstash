# Delete Account Confirmation

## Overview

Require users to confirm who they are before deleting their account. The confirmation is currently only a client-side dialog, and the `deleteAccount` server action takes no input, so anyone with a valid session can delete the account and all its data in one call. Finding from `docs/audit-results/AUTH_SECURITY_REVIEW.md`.

## Requirements

- `deleteAccount` (`src/actions/profile.ts`) takes `FormData` with a `confirmation` field, validated with Zod
- `deleteUserAccount` (`src/lib/account.ts`) checks the confirmation before deleting:
  - Users with a password: compare it with `bcrypt.compare`; return `"wrong-password"` if it doesn't match
  - GitHub-only users (no password): the confirmation must match their email (case-insensitive); return `"wrong-confirmation"` if not
- Return field errors in the existing `{ success, error, fieldErrors }` shape, like `changePassword` does
- `DeleteAccountDialog` shows a password input for password users, or an "Type your email to confirm" input for GitHub-only users (pass `hasPassword` from the profile page, which already has it)
- The delete button is disabled until the field has a value; a wrong value keeps the dialog open and shows the error under the field

## Notes

- Use the same approach as change password: the user id comes from the session, never from form data.
- The dialog uses `AlertDialogAction`, which closes the dialog on click. Switch to a regular submit button inside a form (or prevent the default close) so errors can be shown.
- Verify: wrong password keeps the account and shows an error; correct password deletes and redirects to `/sign-in?deleted=1`; a GitHub-only user must type their email; calling the action without a confirmation fails.
