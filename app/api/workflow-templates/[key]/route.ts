import { NextRequest, NextResponse } from "next/server";
import { getWorkflowTemplate, WorkflowError } from "@/lib/workflows";

type Params = { params: Promise<{ key: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { key } = await params;
  try {
    const result = await getWorkflowTemplate(key);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "failed to get workflow template" },
      { status: 500 }
    );
  }
}
