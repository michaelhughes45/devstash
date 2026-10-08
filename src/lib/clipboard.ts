import { toast } from "sonner";

// Copies text in the browser and reports the result with a toast
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Couldn't copy to clipboard");
  }
}

class NothingToCopyError extends Error {}

// Copies text that has to be loaded first, e.g. fetched on click. Safari rejects
// writeText once an await has used up the click, so where ClipboardItem exists the
// clipboard write starts straight away with the text as a pending promise.
export async function copyLoadedText(loadText: () => Promise<string>): Promise<void> {
  const text = loadText().then((value) => {
    if (!value.trim()) throw new NothingToCopyError();
    return value;
  });

  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
      const blob = text.then((value) => new Blob([value], { type: "text/plain" }));
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
    } else {
      await navigator.clipboard.writeText(await text);
    }
    toast.success("Copied to clipboard");
  } catch {
    // The write's own error doesn't say why the text failed, so check the text
    const reason = await text.then(
      () => null,
      (error: unknown) => error,
    );
    if (reason instanceof NothingToCopyError) toast("Nothing to copy");
    else toast.error("Couldn't copy to clipboard");
  }
}
