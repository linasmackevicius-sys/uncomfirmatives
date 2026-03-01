import { NextRequest, NextResponse } from "next/server";
import {
  updateEntryStatus,
  EntryNotFoundError,
  ValidationError,
} from "@/lib/entries";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const { status } = await request.json();
    const entry = await updateEntryStatus(Number(id), status);
    return NextResponse.json(entry);
  } catch (err) {
    if (err instanceof EntryNotFoundError) {
      return NextResponse.json({ error: "entry not found" }, { status: 404 });
    }
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "failed to update status" },
      { status: 500 }
    );
  }
}