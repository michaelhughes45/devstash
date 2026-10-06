import { NextResponse } from "next/server";

import { getItemFile } from "@/lib/db/items";
import { getObject, keyFromPublicUrl } from "@/lib/r2";
import { getCurrentUserId } from "@/lib/session";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// attachment with an ASCII fallback plus the UTF-8 name (RFC 6266 / 5987)
function contentDisposition(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

// Streams a file or image item's stored file from R2 as a download. Same
// origin, so the browser saves it under its original name without R2 CORS.
// The proxy doesn't cover /api, so this checks the session itself.
export async function GET(_request: Request, ctx: RouteContext<"/api/items/[id]/download">) {
  const userId = await getCurrentUserId();
  if (!userId) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;

  try {
    // Another user's item is reported as missing, so ids can't be probed
    const item = await getItemFile(userId, id);
    const key = item ? keyFromPublicUrl(item.fileUrl) : null;
    const object = key ? await getObject(key) : null;
    if (!item || !key || !object) return errorResponse("File not found", 404);

    const headers = new Headers({
      "Content-Type": object.contentType ?? "application/octet-stream",
      "Content-Disposition": contentDisposition(item.fileName ?? key.split("/").pop() ?? "download"),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // Opened directly, an SVG or other active content still can't run scripts here
      "Content-Security-Policy": "sandbox; default-src 'none'",
    });
    if (object.size !== null) headers.set("Content-Length", String(object.size));

    return new Response(object.body, { headers });
  } catch (error) {
    console.error("File download failed", error);
    return errorResponse("Download failed", 500);
  }
}
