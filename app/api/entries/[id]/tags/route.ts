import { NextRequest, NextResponse } from "next/server";
import { getEntryTags, setEntryTags, TagError } from "@/lib/tags";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const items = await getEntryTags(Number(id));
  return NextResponse.json(items);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const { tag_ids } = await request.json();
    if (!Array.isArray(tag_ids)) {
      return NextResponse.json(
        { error: "tag_ids must be an array" },
        { status: 400 }
      );
    }
    const items = await setEntryTags(Number(id), tag_ids);
    return NextResponse.json(items);
  } catch (err) {
    if (err instanceof TagError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "failed to set entry tags" },
      { status: 500 }
    );
  }
}
