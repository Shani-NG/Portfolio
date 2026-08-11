import { NextResponse } from "next/server";
import { persistContactLead } from "@/lib/role-fit/persistence/task-e";

export async function POST(request: Request) {
  const result = await persistContactLead(await request.json().catch(() => null));

  if (!result.ok) {
    const status = result.reason === "invalid-payload" ? 400 : 200;
    return NextResponse.json(
      { ok: false, message: "I couldn't send the message right now. Please try again." },
      { status },
    );
  }

  return NextResponse.json({ ok: true, message: "Thanks - your message was sent." });
}
