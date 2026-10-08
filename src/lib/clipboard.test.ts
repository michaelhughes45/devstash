import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";

import { copyLoadedText } from "@/lib/clipboard";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

class FakeClipboardItem {
  constructor(public items: Record<string, Promise<Blob>>) {}
}

function stubClipboard(clipboard: { write?: unknown; writeText?: unknown }) {
  vi.stubGlobal("navigator", { clipboard });
}

describe("copyLoadedText", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts a ClipboardItem write with the pending text where supported", async () => {
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    const write = vi.fn(async ([item]: FakeClipboardItem[]) => {
      await item.items["text/plain"];
    });
    stubClipboard({ write, writeText: vi.fn() });

    await copyLoadedText(async () => "npm run dev");

    const [[[item]]] = write.mock.calls;
    expect(await (await item.items["text/plain"]).text()).toBe("npm run dev");
    expect(toast.success).toHaveBeenCalledWith("Copied to clipboard");
  });

  it("falls back to writeText without ClipboardItem", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });

    await copyLoadedText(async () => "npm run dev");

    expect(writeText).toHaveBeenCalledWith("npm run dev");
    expect(toast.success).toHaveBeenCalledWith("Copied to clipboard");
  });

  it("says there's nothing to copy for blank text", async () => {
    const writeText = vi.fn();
    stubClipboard({ writeText });

    await copyLoadedText(async () => "   ");

    expect(writeText).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith("Nothing to copy");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows an error when loading the text fails", async () => {
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    const write = vi.fn(async ([item]: FakeClipboardItem[]) => {
      await item.items["text/plain"];
    });
    stubClipboard({ write });

    await copyLoadedText(async () => {
      throw new Error("Item not found");
    });

    expect(toast.error).toHaveBeenCalledWith("Couldn't copy to clipboard");
    expect(toast.success).not.toHaveBeenCalled();
  });
});
