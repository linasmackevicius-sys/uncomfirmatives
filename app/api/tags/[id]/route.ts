import { NextRequest, NextResponse } from "next/server";
import { deleteTag, TagError } from "@/lib/tags";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await deleteTag(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof TagError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "failed to delete tag" },
      { status: 500 }
    );
  }
}
