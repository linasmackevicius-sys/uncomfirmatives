import { db } from "./db";
import { tags, entryTags } from "./schema";
import { eq, and, inArray } from "drizzle-orm";
import type { Tag } from "./types";

export class TagError extends Error {}

function toTag(row: typeof tags.$inferSelect): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color ?? null,
  };
}

export async function listTags(): Promise<Tag[]> {
  const rows = await db.select().from(tags);
  return rows.map(toTag);
}

export async function createTag(
  name: string,
  color?: string
): Promise<Tag> {
  if (!name) throw new TagError("tag name is required");

  const [row] = await db.insert(tags).values({
    name,
    color: color || null,
  }).returning();

  return toTag(row);
}

export async function deleteTag(id: number): Promise<void> {
  const [row] = await db.select().from(tags).where(eq(tags.id, id));
  if (!row) throw new TagError("tag not found");

  // Remove all entry-tag associations first
  await db.delete(entryTags).where(eq(entryTags.tagId, id));
  await db.delete(tags).where(eq(tags.id, id));
}

export async function getEntryTags(entryId: number): Promise<Tag[]> {
  const rows = await db
    .select({ tag: tags })
    .from(entryTags)
    .innerJoin(tags, eq(entryTags.tagId, tags.id))
    .where(eq(entryTags.entryId, entryId));

  return rows.map((r) => toTag(r.tag));
}

export async function setEntryTags(
  entryId: number,
  tagIds: number[]
): Promise<Tag[]> {
  // Remove existing tags for this entry
  await db.delete(entryTags).where(eq(entryTags.entryId, entryId));

  if (tagIds.length > 0) {
    // Verify all tags exist
    const existingTags = await db
      .select()
      .from(tags)
      .where(inArray(tags.id, tagIds));

    if (existingTags.length !== tagIds.length) {
      throw new TagError("one or more tag IDs are invalid");
    }

    await db.insert(entryTags).values(
      tagIds.map((tagId) => ({ entryId, tagId }))
    );
  }

  return getEntryTags(entryId);
}

export async function deleteEntryTags(entryId: number): Promise<void> {
  await db.delete(entryTags).where(eq(entryTags.entryId, entryId));
}
