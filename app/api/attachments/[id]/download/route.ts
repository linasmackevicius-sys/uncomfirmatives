import { NextRequest, NextResponse } from "next/server";
import {
  getAttachmentForDownload,
  AttachmentError,
} from "@/lib/attachments";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const { attachment, buffer } = await getAttachmentForDownload(Number(id));

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.mime_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${attachment.filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    if (err instanceof AttachmentError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "failed to download attachment" },
      { status: 500 }
    );
  }
}
