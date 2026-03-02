import { NextRequest, NextResponse } from "next/server";
import { deleteAttachment, AttachmentError } from "@/lib/attachments";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await deleteAttachment(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof AttachmentError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "failed to delete attachment" },
      { status: 500 }
    );
  }
}
