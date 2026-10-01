import { NextResponse } from "next/server";
import { roleFitClientBoundaryEventSchema } from "@/lib/role-fit/runtime/boundary-events";
import { logRoleFitBoundaryEvent } from "@/lib/role-fit/runtime/supabase-runtime-store";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return new NextResponse(null, { status: 403 });
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return new NextResponse(null, { status: 415 });
  if (Number(request.headers.get("content-length")) > 1_000) return new NextResponse(null, { status: 413 });

  const body = await request.text();
  if (body.length > 1_000) return new NextResponse(null, { status: 413 });
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const parsed = roleFitClientBoundaryEventSchema.safeParse(value);
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const persisted = await logRoleFitBoundaryEvent({
    ...parsed.data,
    source: "client",
  });
  return new NextResponse(null, { status: persisted.ok ? 204 : 503, headers: { "Cache-Control": "no-store" } });
}
