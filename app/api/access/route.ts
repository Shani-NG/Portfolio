import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  createAccessToken,
  isAccessConfigured,
  isPasswordValid,
} from "@/lib/access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAccessConfigured()) {
    return NextResponse.json(
      { error: "Access is not configured yet." },
      { status: 503 },
    );
  }

  let password = "";

  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isPasswordValid(password)) {
    return NextResponse.json(
      { error: "The password is incorrect." },
      { status: 401 },
    );
  }

  const token = createAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: "Access is not configured yet." },
      { status: 503 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
