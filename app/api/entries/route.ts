import { NextRequest, NextResponse } from "next/server";
import {
  listEntries,
  createEntry,
  ValidationError,
} from "@/lib/entries";
import { emitEntryEvent } from "@/lib/event-emitter";
import type { CreateEntryInput } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const result = await listEntries({
    status: params.get("status") || undefined,
    severity: params.get("severity") || undefined,
    search: params.get("search") || undefined,
    group: params.get("group") || undefined,
    tag: params.get("tag") || undefined,
    page: params.get("page") ? Number(params.get("page")) : undefined,
    page_size: params.get("page_size")
      ? Number(params.get("page_size"))
      : undefined,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const input: CreateEntryInput = await request.json();
    const entry = await createEntry(input);
    emitEntryEvent({ type: "entry.created", id: entry.id });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "failed to create entry" },
      { status: 500 }
    );
  }
}