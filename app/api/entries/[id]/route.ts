import { NextRequest, NextResponse } from "next/server";
import {
  getEntryById,
  updateEntry,
  deleteEntry,
  EntryNotFoundError,
  ValidationError,
} from "@/lib/entries";
import type { UpdateEntryInput } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const entry = await getEntryById(Number(id));
    return NextResponse.json(entry);
  } catch (err) {
    if (err instanceof EntryNotFoundError) {
      return NextResponse.json({ error: "entry not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "failed to get entry" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const input: UpdateEntryInput = await request.json();
    const entry = await updateEntry(Number(id), input);
    return NextResponse.json(entry);
  } catch (err) {
    if (err instanceof EntryNotFoundError) {
      return NextResponse.json({ error: "entry not found" }, { status: 404 });
    }
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "failed to update entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await deleteEntry(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof EntryNotFoundError) {
      return NextResponse.json({ error: "entry not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "failed to delete entry" },
      { status: 500 }
    );
  }
}