"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";

import { deleteAccount, type DeleteAccountState } from "@/actions/profile";
import { FormField } from "@/components/auth/FormField";
import { FormMessage } from "@/components/auth/FormMessage";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const INITIAL_STATE: DeleteAccountState = { success: false };

interface DeleteAccountDialogProps {
  hasPassword: boolean;
}

export function DeleteAccountDialog({ hasPassword }: DeleteAccountDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2 data-icon="inline-start" />
        Delete account
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account and all of your items, collections and
            tags. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Unmounts when the dialog closes, so the field and errors reset */}
        <DeleteAccountForm hasPassword={hasPassword} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteAccountForm({ hasPassword }: DeleteAccountDialogProps) {
  // Redirects to sign-in on success, so only failures come back
  const [state, formAction, pending] = useActionState(deleteAccount, INITIAL_STATE);
  const [confirmation, setConfirmation] = useState("");

  return (
    <form action={formAction} className="grid gap-4">
      {state.error && <FormMessage variant="error">{state.error}</FormMessage>}
      <FormField
        name="confirmation"
        label={hasPassword ? "Enter your password to confirm" : "Type your email to confirm"}
        type={hasPassword ? "password" : "email"}
        autoComplete={hasPassword ? "current-password" : "off"}
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        errors={state.fieldErrors?.confirmation}
        required
      />
      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
        <Button type="submit" variant="destructive" disabled={pending || !confirmation}>
          {pending ? "Deleting…" : "Delete account"}
        </Button>
      </AlertDialogFooter>
    </form>
  );
}
