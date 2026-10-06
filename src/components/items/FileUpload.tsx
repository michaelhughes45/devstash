"use client";

import { useRef, useState, type DragEvent } from "react";
import { File as FileIcon, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatMaxSize,
  getAcceptAttribute,
  validateUploadFile,
  type FileItemType,
} from "@/lib/file-constraints";
import { formatFileSize } from "@/lib/item-content";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  id: string;
  type: FileItemType;
  file: File | null;
  onFileChange: (file: File | null) => void;
  // 0–100 while uploading, otherwise null
  progress: number | null;
  // Error from the server, shown when there's no selection error
  error?: string;
  disabled?: boolean;
}

// Drag-and-drop or click to choose one file; checks the type's rules before accepting it
export function FileUpload({
  id,
  type,
  file,
  onFileChange,
  progress,
  error,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  // Local preview of the chosen image, as a data URL so there's nothing to revoke
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const shownError = selectionError ?? error;
  const errorId = `${id}-error`;

  function selectFile(candidate: File | undefined) {
    if (!candidate) return;
    const problem = validateUploadFile(type, candidate);
    setSelectionError(problem);
    setPreviewUrl(null);
    onFileChange(problem ? null : candidate);
    if (!problem && type === "image") readPreview(candidate);
  }

  function readPreview(image: File) {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(image);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) selectFile(event.dataTransfer.files[0]);
  }

  function handleRemove() {
    setSelectionError(null);
    setPreviewUrl(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={getAcceptAttribute(type)}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => selectFile(event.target.files?.[0])}
        aria-invalid={shownError ? true : undefined}
        aria-describedby={shownError ? errorId : undefined}
      />

      {file ? (
        <SelectedFile
          file={file}
          previewUrl={type === "image" ? previewUrl : null}
          progress={progress}
          disabled={disabled}
          onRemove={handleRemove}
        />
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
            dragging && "border-primary bg-primary/5",
            shownError && "border-destructive",
          )}
        >
          <Upload className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm">
            Drag and drop {type === "image" ? "an image" : "a file"} here, or{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              browse
            </Button>
          </p>
          <p className="text-xs text-muted-foreground">
            {getAcceptAttribute(type).replaceAll(",", ", ")} · up to {formatMaxSize(type)}
          </p>
        </div>
      )}

      {shownError && (
        <p id={errorId} className="text-sm text-destructive">
          {shownError}
        </p>
      )}
    </div>
  );
}

interface SelectedFileProps {
  file: File;
  previewUrl: string | null;
  progress: number | null;
  disabled: boolean;
  onRemove: () => void;
}

function SelectedFile({ file, previewUrl, progress, disabled, onRemove }: SelectedFileProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3">
      <div className="flex items-center gap-3">
        {previewUrl ? (
          // A local data URL, which next/image can't optimize
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="size-12 shrink-0 rounded-md border bg-background object-cover"
          />
        ) : (
          <FileIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm">{file.name}</span>
          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${file.name}`}
        >
          <X />
        </Button>
      </div>

      {progress !== null && (
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
            {progress}%
          </span>
        </div>
      )}
    </div>
  );
}
