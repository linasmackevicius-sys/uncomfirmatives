import { NextRequest, NextResponse } from "next/server";
import { listAttachments, createAttachment } from "@/lib/attachments";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const items = await listAttachments(Number(id));
  return NextResponse.json(items);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const uploadedBy = formData.get("uploaded_by") as string | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const attachment = await createAttachment(
      Number(id),
      { name: file.name, type: file.type, buffer },
      uploadedBy || undefined
    );

    return NextResponse.json(attachment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "failed to upload attachment" },
      { status: 500 }
    );
  }
}
