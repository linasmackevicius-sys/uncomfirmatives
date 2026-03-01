import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { statuses } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(statuses)
    .orderBy(asc(statuses.order));
  return NextResponse.json(rows);
}