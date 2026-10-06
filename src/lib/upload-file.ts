import type { FileItemType } from "@/lib/file-constraints";

export type UploadResult = { success: true; key: string } | { success: false; error: string };

const UPLOAD_FAILED = "Upload failed. Please try again.";

// Posts the file to /api/upload. Uses XHR rather than fetch because fetch has
// no upload progress events. `onProgress` gets 0–100.
export function uploadFile(
  type: FileItemType,
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      const body = xhr.response as { success?: boolean; data?: { key?: string }; error?: string } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.success && body.data?.key) {
        resolve({ success: true, key: body.data.key });
      } else {
        resolve({ success: false, error: body?.error ?? UPLOAD_FAILED });
      }
    };
    xhr.onerror = () => resolve({ success: false, error: UPLOAD_FAILED });

    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);
    xhr.send(formData);
  });
}
