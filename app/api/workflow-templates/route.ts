import { NextResponse } from "next/server";
import { listWorkflowTemplates } from "@/lib/workflows";

export async function GET() {
  const templates = await listWorkflowTemplates();
  return NextResponse.json(templates);
}
