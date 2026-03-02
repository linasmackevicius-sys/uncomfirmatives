import { db } from "./db";
import { comments } from "./schema";
import { eq, desc } from "drizzle-orm";
import { EntryNotFoundError, ValidationError, getEntryById } from "./entries";
import type { Comment, CreateCommentInput } from "./types";

function toComment(row: typeof comments.$inferSelect): Comment {
  return {
    id: row.id,
    entry_id: row.entryId,
    author: row.author,
    content: row.content,
    created_at: row.createdAt?.toISOString() ?? "",
  };
}

export async function listComments(entryId: number): Promise<Comment[]> {
  await getEntryById(entryId);
  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.entryId, entryId))
    .orderBy(desc(comments.createdAt));
  return rows.map(toComment);
}

export async function createComment(
  entryId: number,
  input: CreateCommentInput
): Promise<Comment> {
  await getEntryById(entryId);

  if (!input.author?.trim()) throw new ValidationError("author is required");
  if (!input.content?.trim()) throw new ValidationError("content is required");

  const [row] = await db.insert(comments).values({
    entryId,
    author: input.author.trim(),
    content: input.content.trim(),
  }).returning();

  return toComment(row);
}
