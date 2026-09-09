import { NextResponse } from "next/server";
import * as webpush from "web-push";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:finlo@example.com";

interface RecurringRow {
  user_id: string;
  name: string;
  amount: string | number;
  next_due_date: string;
}

interface InstallmentRow {
  user_id: string;
  item_name: string;
  monthly_installment: string | number;
  next_due_date: string;
}

interface SubRow {
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: true, skipped: "CRON_SECRET not configured" });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "VAPID keys are not configured" }, { status: 500 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 500 });
  }

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
  const today = new Date().toISOString().slice(0, 10);

  const [recsRes, instsRes] = await Promise.all([
    admin.from("recurring_expenses").select("user_id,name,amount,next_due_date"),
    admin
      .from("installments")
      .select("user_id,item_name,monthly_installment,next_due_date")
      .eq("status", "active"),
  ]);

  if (recsRes.error || instsRes.error) {
    return NextResponse.json({ error: "Failed to load due data" }, { status: 500 });
  }

  const recs = (recsRes.data ?? []) as unknown as RecurringRow[];
  const insts = (instsRes.data ?? []) as unknown as InstallmentRow[];

  const byUser = new Map<string, string[]>();
  recs
    .filter((r) => r.next_due_date && String(r.next_due_date).slice(0, 10) <= today)
    .forEach((r) => {
      const list = byUser.get(r.user_id) ?? [];
      list.push(`${r.name} (${new Intl.NumberFormat("en-PK").format(Number(r.amount))})`);
      byUser.set(r.user_id, list);
    });
  insts
    .filter((i) => i.next_due_date && String(i.next_due_date).slice(0, 10) <= today)
    .forEach((i) => {
      const list = byUser.get(i.user_id) ?? [];
      list.push(`Installment: ${i.item_name} (${new Intl.NumberFormat("en-PK").format(Number(i.monthly_installment))})`);
      byUser.set(i.user_id, list);
    });

  webpush.setVapidDetails(subject, publicKey, privateKey);

  let sent = 0;
  let notifiedUsers = 0;

  for (const [userId, items] of byUser) {
    const { data: subs, error: subsError } = await admin
      .from("push_subscriptions")
      .select("endpoint,keys_p256dh,keys_auth")
      .eq("user_id", userId);

    if (subsError || !subs || subs.length === 0) continue;

    const message = JSON.stringify({
      title: items.length === 1 ? "Payment due today" : `${items.length} payments due today`,
      body: items.length === 1 ? items[0] : items.slice(0, 3).join(", ") + (items.length > 3 ? ` +${items.length - 3} more` : ""),
      url: "/dashboard#upcoming",
    });

    for (const sub of subs as unknown as SubRow[]) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
          message
        );
        sent += 1;
      } catch {
        /* skip individual failures */
      }
    }
    notifiedUsers += 1;
  }

  return NextResponse.json({ ok: true, notifiedUsers, sent });
}