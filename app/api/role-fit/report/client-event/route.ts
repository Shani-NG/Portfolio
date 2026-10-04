import { NextResponse } from "next/server";
import { z } from "zod";
import { logReportLifecycle } from "@/lib/role-fit/runtime/report-lifecycle";

const eventSchema = z.object({
  reportId: z.string().regex(/^R[A-Z0-9]{4}$/),
  boundary: z.enum(["client-response", "display"]),
  outcome: z.enum(["success", "failure"]),
}).strict();

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ state: "invalid-event" }, { status: 400 });

  logReportLifecycle(parsed.data);
  return NextResponse.json({ state: "recorded" });
}
