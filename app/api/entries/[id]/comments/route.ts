import { NextRequest, NextResponse } from "next/server";
import { listComments, createComment } from "@/lib/comments";
import { EntryNotFoundError, ValidationError } from "@/lib/entries";
import { emitEntryEvent } from "@/lib/event-emitter";
import type { CreateCommentInput } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const result = await listComments(Number(id));
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof EntryNotFoundError) {
      return NextResponse.json({ error: "entry not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "failed to list comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const input: CreateCommentInput = await request.json();
    const comment = await createComment(Number(id), input);
    emitEntryEvent({ type: "entry.updated", id: Number(id) });
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    if (err instanceof EntryNotFoundError) {
      return NextResponse.json({ error: "entry not found" }, { status: 404 });
    }
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "failed to create comment" },
      { status: 500 }
    );
  }
}
