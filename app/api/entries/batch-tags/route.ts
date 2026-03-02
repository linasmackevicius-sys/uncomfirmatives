import { NextRequest, NextResponse } from "next/server";
import { batchEntryTags } from "@/lib/tags";

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
  }

  const ids = idsParam.split(",").map(Number).filter((n) => !isNaN(n));
  if (ids.length === 0) {
    return NextResponse.json({});
  }

  const result = await batchEntryTags(ids);
  return NextResponse.json(result);
}
