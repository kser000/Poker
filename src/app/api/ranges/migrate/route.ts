import { NextResponse } from "next/server";
import { listRanges, migrateRanges } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ranges = Array.isArray(body?.ranges) ? body.ranges : [];
    const result = migrateRanges(ranges);
    return NextResponse.json({
      ...result,
      ranges: listRanges(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "遷移失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
