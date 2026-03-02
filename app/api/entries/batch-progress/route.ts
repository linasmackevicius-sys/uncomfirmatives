import { NextRequest, NextResponse } from "next/server";
import { batchWorkflowProgress } from "@/lib/workflows";

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
  }

  const ids = idsParam.split(",").map(Number).filter((n) => !isNaN(n));
  if (ids.length === 0) {
    return NextResponse.json({});
  }

  const result = await batchWorkflowProgress(ids);
  return NextResponse.json(result);
}
