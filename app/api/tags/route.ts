import { NextRequest, NextResponse } from "next/server";
import { listTags, createTag, TagError } from "@/lib/tags";

export async function GET() {
  const items = await listTags();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json();
    const tag = await createTag(name, color);
    return NextResponse.json(tag, { status: 201 });
  } catch (err) {
    if (err instanceof TagError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "failed to create tag" },
      { status: 500 }
    );
  }
}
