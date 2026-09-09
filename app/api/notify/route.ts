import { NextResponse } from "next/server";
import * as webpush from "web-push";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:finlo@example.com";

interface PushRow {
  id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json().catch(() => null)) as
      | { title?: string; body?: string; url?: string }
      | null;
    if (!payload || !payload.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!publicKey || !privateKey) {
      return NextResponse.json({ error: "VAPID keys are not configured" }, { status: 500 });
    }

    const serverClient = await createServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
    const { data: subs, error: subsError } = await admin
      .from("push_subscriptions")
      .select("id,endpoint,keys_p256dh,keys_auth")
      .eq("user_id", user.id);

    if (subsError) {
      return NextResponse.json({ error: subsError.message }, { status: 500 });
    }
    if (!subs || subs.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    let sent = 0;
    const stale: string[] = [];
    const message = JSON.stringify({
      title: payload.title,
      body: payload.body || "",
      url: payload.url || "/dashboard/upcoming",
    });

    for (const sub of subs as PushRow[]) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          message
        );
        sent += 1;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          stale.push(sub.id);
        }
      }
    }

    if (stale.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", stale);
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error("notify route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}