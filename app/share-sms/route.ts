import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const text = String(form.get("text") || "").trim();
    if (text) {
      const encoded = Buffer.from(text, "utf8").toString("base64url");
      return NextResponse.redirect(new URL(`/dashboard?sms=${encoded}`, request.url));
    }
  } catch {
    /* ignore */
  }
  return NextResponse.redirect(new URL("/dashboard", request.url));
}