import { randomUUID } from "node:crypto";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getFileExtension } from "@/lib/file-constraints";

// R2's S3-compatible API; server only (reads secret credentials)

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

let client: S3Client | undefined;

// Exported for scripts/r2-lifecycle.ts
export function r2Client(): S3Client {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
  return client;
}

export function bucket(): string {
  return requireEnv("R2_BUCKET_NAME");
}

function publicBaseUrl(): string {
  return requireEnv("R2_PUBLIC_URL").replace(/\/+$/, "");
}

// New uploads land under this prefix until an item uses them. An R2 lifecycle
// rule (scripts/r2-lifecycle.ts) deletes anything left here after a day, so
// abandoned uploads clean themselves up.
export const PENDING_PREFIX = "pending/";

// Pending keys are `pending/{userId}/{uuid}{ext}`, generated here so a client can't pick one
export function createUploadKey(userId: string, fileName: string): string {
  return `${PENDING_PREFIX}${userId}/${randomUUID()}${getFileExtension(fileName)}`;
}

const UPLOAD_KEY_PATTERN =
  /^pending\/([^/]+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+)$/;

// True if `key` has the createUploadKey shape and belongs to `userId`
export function isUserUploadKey(userId: string, key: string): boolean {
  return UPLOAD_KEY_PATTERN.exec(key)?.[1] === userId;
}

// Where an item's file lives once created: the pending key without the prefix,
// i.e. `{userId}/{uuid}{ext}`
export function finalKeyFor(pendingKey: string): string {
  return pendingKey.slice(PENDING_PREFIX.length);
}

// What's stored in Item.fileUrl
export function publicUrlForKey(key: string): string {
  return `${publicBaseUrl()}/${key}`;
}

// The object key behind a stored fileUrl, or null if it isn't one of ours
export function keyFromPublicUrl(fileUrl: string): string | null {
  const prefix = `${publicBaseUrl()}/`;
  return fileUrl.startsWith(prefix) ? fileUrl.slice(prefix.length) || null : null;
}

// S3 metadata must be ASCII, so the original file name is stored URI-encoded
const ORIGINAL_NAME_METADATA = "original-name";

export async function putObject(
  key: string,
  body: Uint8Array,
  contentType: string,
  originalName: string,
): Promise<void> {
  await r2Client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: { [ORIGINAL_NAME_METADATA]: encodeURIComponent(originalName) },
    }),
  );
}

export interface StoredObjectInfo {
  size: number;
  contentType: string | null;
  originalName: string | null;
}

function decodeName(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

// null if the object doesn't exist
export async function headObject(key: string): Promise<StoredObjectInfo | null> {
  try {
    const result = await r2Client().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return {
      size: result.ContentLength ?? 0,
      contentType: result.ContentType ?? null,
      originalName: decodeName(result.Metadata?.[ORIGINAL_NAME_METADATA]),
    };
  } catch (error) {
    if (error instanceof NotFound) return null;
    throw error;
  }
}

export interface StoredObject {
  body: ReadableStream;
  size: number | null;
  contentType: string | null;
}

// null if the object doesn't exist
export async function getObject(key: string): Promise<StoredObject | null> {
  try {
    const result = await r2Client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    if (!result.Body) return null;
    return {
      body: result.Body.transformToWebStream(),
      size: result.ContentLength ?? null,
      contentType: result.ContentType ?? null,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "NoSuchKey") return null;
    throw error;
  }
}

// Copies an object within the bucket, keeping its content type and metadata
export async function copyObject(fromKey: string, toKey: string): Promise<void> {
  await r2Client().send(
    new CopyObjectCommand({
      Bucket: bucket(),
      // CopySource is URL-encoded, segment by segment
      CopySource: `${bucket()}/${fromKey.split("/").map(encodeURIComponent).join("/")}`,
      Key: toKey,
      MetadataDirective: "COPY",
    }),
  );
}

// Succeeds even if the object is already gone
export async function deleteObject(key: string): Promise<void> {
  await r2Client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

// Best effort: a failed delete only leaves an orphaned object, so it's logged, not thrown
export async function deleteObjectQuietly(key: string): Promise<void> {
  try {
    await deleteObject(key);
  } catch (error) {
    console.error(`Failed to delete R2 object ${key}`, error);
  }
}
