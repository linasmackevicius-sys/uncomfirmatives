import { db } from "./db";
import { attachments } from "./schema";
import { eq } from "drizzle-orm";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import { join } from "path";
import type { Attachment } from "./types";

export class AttachmentError extends Error {}

const UPLOADS_DIR = join(process.cwd(), "uploads", "entries");

function toAttachment(row: typeof attachments.$inferSelect): Attachment {
  return {
    id: row.id,
    entry_id: row.entryId,
    filename: row.filename,
    stored_path: row.storedPath,
    mime_type: row.mimeType ?? null,
    size_bytes: row.sizeBytes ?? null,
    uploaded_by: row.uploadedBy ?? null,
    created_at: row.createdAt?.toISOString() ?? "",
  };
}

export async function listAttachments(entryId: number): Promise<Attachment[]> {
  const rows = await db
    .select()
    .from(attachments)
    .where(eq(attachments.entryId, entryId));
  return rows.map(toAttachment);
}

export async function createAttachment(
  entryId: number,
  file: { name: string; type: string; buffer: Buffer },
  uploadedBy?: string
): Promise<Attachment> {
  const dir = join(UPLOADS_DIR, String(entryId));
  await mkdir(dir, { recursive: true });

  // Deduplicate filenames with timestamp prefix
  const storedName = `${Date.now()}_${file.name}`;
  const storedPath = join(dir, storedName);

  await writeFile(storedPath, file.buffer);

  const [result] = await db.insert(attachments).values({
    entryId,
    filename: file.name,
    storedPath,
    mimeType: file.type || null,
    sizeBytes: file.buffer.length,
    uploadedBy: uploadedBy || null,
  });

  const [row] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, result.insertId));
  return toAttachment(row);
}

export async function deleteAttachment(id: number): Promise<void> {
  const [row] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, id));

  if (!row) throw new AttachmentError("attachment not found");

  // Remove file from disk (best-effort)
  try {
    await unlink(row.storedPath);
  } catch {
    // File may already be missing
  }

  await db.delete(attachments).where(eq(attachments.id, id));
}

export async function getAttachmentForDownload(
  id: number
): Promise<{ attachment: Attachment; buffer: Buffer }> {
  const [row] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, id));

  if (!row) throw new AttachmentError("attachment not found");

  const buffer = await readFile(row.storedPath);
  return { attachment: toAttachment(row), buffer };
}

export async function deleteAttachmentsByEntry(
  entryId: number
): Promise<void> {
  const rows = await db
    .select()
    .from(attachments)
    .where(eq(attachments.entryId, entryId));

  // Remove files from disk (best-effort)
  for (const row of rows) {
    try {
      await unlink(row.storedPath);
    } catch {
      // File may already be missing
    }
  }

  await db.delete(attachments).where(eq(attachments.entryId, entryId));
}
