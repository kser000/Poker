import { NextResponse } from "next/server";
import { deleteRangeDb, getRange } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const range = getRange(id);
    if (!range) {
      return NextResponse.json({ error: "找不到範圍表" }, { status: 404 });
    }
    return NextResponse.json({ range });
  } catch (err) {
    const message = err instanceof Error ? err.message : "讀取失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const ok = deleteRangeDb(id);
    if (!ok) {
      return NextResponse.json({ error: "找不到範圍表" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "刪除失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
