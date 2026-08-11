import { NextResponse } from "next/server";
import { runAiNewsroom } from "@/lib/ai-news/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await runAiNewsroom();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "AI Newsroom run failed." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "PDTV AI Newsroom", method: "POST", protected: true });
}
