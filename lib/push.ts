import { createClient } from "@/lib/supabase";

const ATTEMPTED_KEY = "finlo_push_attempted";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function base64FromKey(key: ArrayBuffer | null): string {
  if (!key) return "";
  try {
    const bytes = new Uint8Array(key);
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  } catch {
    return "";
  }
}

/**
 * One-time setup: registers the service worker, requests permission and stores
 * the PushManager subscription against the signed-in user. Returns true when a
 * working subscription exists.
 */
export async function setupPushSubscription(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    if (Notification.permission === "denied") return false;

    let lastAttempted = "";
    try {
      lastAttempted = localStorage.getItem(ATTEMPTED_KEY) || "";
    } catch {
      /* ignore */
    }
    const today = new Date().toISOString().slice(0, 10);
    if (lastAttempted === today) {
      return Notification.permission === "granted";
    }
    try {
      localStorage.setItem(ATTEMPTED_KEY, today);
    } catch {
      /* ignore */
    }

    const registration = await navigator.serviceWorker.register("/sw.js");

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const appKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!appKey) return false;
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return false;
      }
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(appKey),
      });
    }

    const supabase = createClient();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        keys_p256dh: base64FromKey(subscription.getKey("p256dh")),
        keys_auth: base64FromKey(subscription.getKey("auth")),
        user_agent: navigator.userAgent || "",
      },
      { onConflict: "endpoint" }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function requestPushForDue(items: { name: string; amount: number; date: string }[]): Promise<void> {
  if (!isPushSupported() || Notification.permission !== "granted") return;
  if (items.length === 0) return;
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: items.length === 1 ? "Payment due today" : `${items.length} payments due today`,
        body:
          items.length === 1
            ? `${items[0].name} — ${new Intl.NumberFormat("en-PK").format(items[0].amount)} due ${new Date(items[0].date).toLocaleDateString()}`
            : items.slice(0, 3).map((i) => i.name).join(", ") + (items.length > 3 ? ` +${items.length - 3} more` : ""),
        url: "/dashboard/upcoming",
      }),
    });
  } catch {
    /* ignore */
  }
}