import { NextRequest, NextResponse } from "next/server";
import {
  listWorkflowSteps,
  assignWorkflow,
  WorkflowError,
} from "@/lib/workflows";
import { EntryNotFoundError } from "@/lib/entries";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const steps = await listWorkflowSteps(Number(id));
  return NextResponse.json(steps);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const { template_key } = await request.json();
    if (!template_key) {
      return NextResponse.json(
        { error: "template_key is required" },
        { status: 400 }
      );
    }
    const steps = await assignWorkflow(Number(id), template_key);
    return NextResponse.json(steps, { status: 201 });
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof EntryNotFoundError) {
      return NextResponse.json({ error: "entry not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "failed to assign workflow" },
      { status: 500 }
    );
  }
}
