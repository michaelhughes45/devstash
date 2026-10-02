"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteAccount } from "@/actions/profile";
import { FormMessage } from "@/components/auth/FormMessage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteAccountDialog() {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(undefined);
    startTransition(async () => {
      // Redirects to sign-in on success, so only failures come back
      const result = await deleteAccount();
      if (!result.success) setError(result.error);
    });
  }

  return (
    <AlertDialog onOpenChange={(open) => !open && setError(undefined)}>
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
        {error && <FormMessage variant="error">{error}</FormMessage>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? "Deleting…" : "Delete account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
