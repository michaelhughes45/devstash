import { jsonResponse, rateLimitedResponse } from "@/lib/api-response";
import {
  FILE_CONSTRAINTS,
  getStoredContentType,
  isFileItemType,
  validateUploadFile,
} from "@/lib/file-constraints";
import { createUploadKey, putObject } from "@/lib/r2";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCurrentUserId } from "@/lib/session";

interface UploadResponse {
  success: boolean;
  data?: { key: string };
  error?: string;
}

const respond = jsonResponse<UploadResponse>;

// Largest allowed file plus room for the multipart boundaries and other fields
const MAX_BODY_SIZE =
  Math.max(...Object.values(FILE_CONSTRAINTS).map((rule) => rule.maxSize)) + 64 * 1024;

// Stores one file or image in R2 and returns its key, which createItem then
// turns into an item. The proxy doesn't cover /api, so this checks the session itself.
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return respond({ success: false, error: "Unauthorized" }, 401);

  // Reject an oversized body before reading it. Browsers always send a length
  // for FormData, so a chunked body without one is refused rather than buffered.
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader === null) {
    return respond({ success: false, error: "Upload size is required." }, 411);
  }
  const contentLength = Number(lengthHeader);
  if (!Number.isFinite(contentLength) || contentLength > MAX_BODY_SIZE) {
    return respond({ success: false, error: "File is too large." }, 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return respond({ success: false, error: "Invalid upload." }, 400);
  }

  const type = formData.get("type");
  const file = formData.get("file");
  if (typeof type !== "string" || !isFileItemType(type) || !(file instanceof File)) {
    return respond({ success: false, error: "Invalid upload." }, 400);
  }

  const error = validateUploadFile(type, file);
  const contentType = getStoredContentType(type, file.name);
  if (error || !contentType) {
    return respond({ success: false, error: error ?? "File type not allowed." }, 400);
  }

  // Checked after validation, so a rejected file doesn't use up an attempt
  const limit = await checkRateLimit("upload", userId);
  if (!limit.success) return rateLimitedResponse(limit.reset);

  try {
    const key = createUploadKey(userId, file.name);
    // Stored with the type from its extension, never the browser-reported one
    await putObject(key, new Uint8Array(await file.arrayBuffer()), contentType, file.name);
    return respond({ success: true, data: { key } }, 201);
  } catch (uploadError) {
    console.error("R2 upload failed", uploadError);
    return respond({ success: false, error: "Upload failed. Please try again." }, 500);
  }
}
