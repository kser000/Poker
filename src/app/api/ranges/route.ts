import { NextResponse } from "next/server";
import { listRanges, upsertRangeDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ranges = listRanges();
    return NextResponse.json({ ranges });
  } catch (err) {
    const message = err instanceof Error ? err.message : "讀取失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const range = upsertRangeDb(body);
    return NextResponse.json({ range });
  } catch (err) {
    const message = err instanceof Error ? err.message : "儲存失敗";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
