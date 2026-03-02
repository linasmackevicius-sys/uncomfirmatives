import { NextRequest, NextResponse } from "next/server";
import { updateWorkflowStep, WorkflowError } from "@/lib/workflows";
import type { UpdateWorkflowStepInput } from "@/lib/types";

type Params = { params: Promise<{ id: string; stepId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { stepId } = await params;
  try {
    const input: UpdateWorkflowStepInput = await request.json();
    const step = await updateWorkflowStep(Number(stepId), input);
    return NextResponse.json(step);
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "failed to update workflow step" },
      { status: 500 }
    );
  }
}
