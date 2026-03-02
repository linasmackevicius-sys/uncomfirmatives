import { NextRequest, NextResponse } from "next/server";
import { exportEntriesCsv } from "@/lib/export";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const csv = await exportEntriesCsv({
    status: params.get("status") || undefined,
    severity: params.get("severity") || undefined,
    group: params.get("group") || undefined,
    search: params.get("search") || undefined,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="entries-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
