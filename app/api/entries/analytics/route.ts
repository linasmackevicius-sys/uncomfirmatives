import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const groupBy = request.nextUrl.searchParams.get("group_by") as
    | "week"
    | "month"
    | null;

  const analytics = await getAnalytics({
    group_by: groupBy ?? undefined,
  });

  return NextResponse.json(analytics);
}
