"use client";

import { useState, useCallback, useEffect } from "react";
import { Smartphone, MessageSquare, Play, ShieldCheck, Info, CheckCircle2, XCircle, Eye, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { analyzeSms } from "@/services/sms-parser/index";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

interface Colors {
  bg: string; sidebar: string; card: string; cardBorder: string;
  text: string; textSub: string; accent: string; accentLight: string;
  positive: string; danger: string; warning: string; inputBg: string; hover: string;
}

/**
 * Type of the /api/import/pending response item.
 * Mirrors the pending_transactions DB row.
 */
interface PendingItem {
  id: string;
  sender?: string | null;
  raw_sms_preview?: string | null;
  amount?: number | null;
  currency?: string | null;
  transaction_type?: string | null;
  bank_name?: string | null;
  merchant?: string | null;
  transaction_date?: string | null;
  parsing_confidence?: number;
  suggested_category?: string | null;
}

interface PreviewResult {
  outcome: string;
  summary: string;
}

const CATEGORIES = ["Food", "Transport", "Rent", "Utilities", "Shopping", "Entertainment", "Health", "Education", "Subscriptions", "Family", "Travel", "Other"];
const SUPPORTED_BANKS = ["HBL", "Meezan Bank", "UBL", "Allied Bank", "MCB", "Easypaisa", "JazzCash", "SadaPay", "NayaPay", "Standard Chartered"];

export function ImportCenter({ colors, supabase }: {
  colors: Colors;
  supabase: SupabaseClient<Database>;
}) {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"review" | "auto">("review");
  const [threshold, setThreshold] = useState(0.9);
  const [excluded, setExcluded] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [dbAvailable, setDbAvailable] = useState(true);

  // Paste-preview tool
  const [smsInput, setSmsInput] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);

  // Review queue
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [queueMsg, setQueueMsg] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("Other");
  const [editMerchant, setEditMerchant] = useState("");
  const [editType, setEditType] = useState<"expense" | "income">("expense");

  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("sms_import_settings").select("*").single();
      if (error && error.code !== "PGRST116") {
        if (error.code === "42P01" || String(error.message).includes("does not exist")) {
          setDbAvailable(false);
        }
        setSettingsLoaded(true);
        return;
      }
      if (data) {
        setEnabled(!!data.enabled);
        setMode(data.import_mode === "auto" ? "auto" : "review");
        setThreshold(Number(data.auto_add_confidence) ?? 0.9);
        setExcluded(Array.isArray(data.excluded_senders) ? data.excluded_senders.join(", ") : "");
      }
      setDbAvailable(true);
    } catch (e) {
      console.error(e);
      setDbAvailable(false);
    } finally {
      setSettingsLoaded(true);
    }
  }, [supabase]);

  const loadPending = useCallback(async () => {
    setRefreshing(true);
    setQueueMsg("");
    try {
      const res = await fetch("/api/import/pending");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setQueueMsg((j as { error?: string }).error || "Could not load review queue");
        setPending([]);
        return;
      }
      const j = (await res.json()) as { items: PendingItem[] };
      setPending(j.items || []);
    } catch {
      setQueueMsg("Review queue unavailable");
      setPending([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadSettings();
      loadPending();
    }, 0);
    return () => clearTimeout(t);
  }, [loadSettings, loadPending]);

  const saveSettings = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const existing = await supabase.from("sms_import_settings").select("user_id").single();
      const record = {
        enabled,
        import_mode: mode,
        auto_add_confidence: threshold,
        excluded_senders: excluded.split(",").map((s) => s.trim()).filter(Boolean),
      };
      if (existing.data) {
        await supabase.from("sms_import_settings").update(record).eq("user_id", existing.data.user_id);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        await supabase.from("sms_import_settings").upsert({ user_id: user.id, ...record });
      }
      setSaveMsg("✓ Settings saved");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (e) {
      setSaveMsg("Save failed — database migration may not be applied yet");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const runPreview = () => {
    if (!smsInput.trim()) return;
    const outcome = analyzeSms({ sender: "", body: smsInput });
    if (outcome.status === "unsupported") {
      setPreview({ outcome: "Not recognized as a bank transaction (or it's an OTP/verification message which we never import).", summary: "" });
      return;
    }
    const p = outcome.parsed;
    setPreview({
      outcome: "✓ Detected",
      summary: p ? `${p.transactionType === "CREDIT" ? "Credit/income" : "Debit/expense"} • ${p.currency} ${p.amount} • ${p.date || "no date"} • ${p.merchant || p.bankName || "unknown merchant"} • confidence ${Math.round(p.confidence * 100)}%` : "",
    });
  };

  const startEdit = (item: PendingItem) => {
    setEditingId(item.id);
    setEditAmount(String(item.amount ?? ""));
    setEditCategory(item.suggested_category ? item.suggested_category.charAt(0).toUpperCase() + item.suggested_category.slice(1) : "Other");
    setEditMerchant(item.merchant || "");
    setEditType(item.transaction_type === "CREDIT" ? "income" : "expense");
  };

  const resolveItem = async (item: PendingItem, action: "add" | "edit" | "ignore") => {
    setQueueMsg("");
    const updates =
      action === "edit"
        ? { amount: Number(editAmount) || 0, category: editCategory.toLowerCase(), merchant: editMerchant, type: editType }
        : undefined;
    try {
      const res = await fetch("/api/import/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: [{ id: item.id, action, updates }] }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setQueueMsg(j.error || "Action failed");
        return;
      }
      setEditingId(null);
      loadPending();
    } catch {
      setQueueMsg("Action failed — try again");
    }
  };

  return (
    <div style={{ padding: 22, borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
        <Smartphone size={16} color="#6366f1" /> SMS Bank Import <span style={{ fontSize: 10, fontWeight: 600, color: "#fff", background: "#6366f1", borderRadius: 6, padding: "2px 8px" }}>ANDROID</span>
      </div>
      <div style={{ fontSize: 12.5, color: colors.textSub, lineHeight: 1.6, marginBottom: 16 }}>
        Automatically turns your bank SMS alerts into Finlo transactions. A small companion Android app reads money-related
        SMS on your phone (after your explicit permission) and sends only transaction details — never OTPs, passwords, or
        your full inbox. SMS transaction import is available on supported Android devices.
      </div>

      {!settingsLoaded && <div style={{ fontSize: 12, color: colors.textSub }}>Loading…</div>}

      {settingsLoaded && !dbAvailable && (
        <div style={{ padding: 12, borderRadius: 10, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)", fontSize: 12.5, color: "#b45309", lineHeight: 1.5, marginBottom: 14 }}>
          Import settings storage is not ready yet — the new database tables are shipped in a migration (<code>supabase/migrations/20260906000000_sms_transaction_import.sql</code>)
          but have not been applied to this database. Run <code>supabase db push</code> to enable persistence. The parser preview below works anyway.
        </div>
      )}

      {/* Enable */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: 13.5, color: colors.text }}>Import SMS transactions</div>
          <div style={{ fontSize: 11.5, color: colors.textSub }}>Allow the Android app to send parsed alerts here</div>
        </div>
        <button onClick={() => setEnabled(!enabled)} style={{ width: 52, height: 28, borderRadius: 20, border: "none", background: enabled ? "#10b981" : colors.cardBorder, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
          <span style={{ position: "absolute", top: 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left 0.2s", left: enabled ? 27 : 3 }} />
        </button>
      </div>

      {/* Mode */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 13.5, color: colors.text, marginBottom: 8 }}>Import mode</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["review", "auto"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{ padding: "8px 14px", borderRadius: 9, border: `1px solid ${mode === m ? "#6366f1" : colors.cardBorder}`, background: mode === m ? "rgba(99,102,241,0.1)" : "transparent", color: mode === m ? "#6366f1" : colors.textSub, fontWeight: mode === m ? 700 : 400, fontSize: 12.5, cursor: "pointer" }}
            >
              {m === "review" ? "Review each transaction (recommended)" : "Auto-add (needs high confidence)"}
            </button>
          ))}
        </div>
        {mode === "auto" && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: colors.textSub, marginBottom: 4 }}>Auto-add confidence threshold: {Math.round(threshold * 100)}%</div>
            <input type="range" min={0.7} max={0.99} step={0.01} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ width: "60%", accentColor: "#6366f1" }} />
          </div>
        )}
      </div>

      {/* Excluded senders */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 13, color: colors.text, marginBottom: 6 }}>Excluded senders</div>
        <input
          value={excluded}
          onChange={(e) => setExcluded(e.target.value)}
          placeholder="e.g. Telenor, Bank Alfalah (comma separated)"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 12.5 }}
        />
      </div>

      {/* Save */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={saveSettings} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        {saveMsg && <span style={{ fontSize: 12, fontWeight: 600, color: saveMsg.includes("✓") ? "#10b981" : "#ef4444" }}>{saveMsg}</span>}
      </div>

      {/* Supported banks */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, color: colors.textSub, marginBottom: 6 }}>Supported banks (pattern engine):</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SUPPORTED_BANKS.map((b) => (
            <span key={b} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 20, background: colors.accentLight, color: colors.text, fontWeight: 500 }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Paste-preview */}
      <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: colors.inputBg, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6, color: colors.text }}>
          <Play size={14} color="#6366f1" /> Test the parser — paste a bank SMS
        </div>
        <textarea
          value={smsInput}
          onChange={(e) => setSmsInput(e.target.value)}
          placeholder={'Try something like:\n"PKR 5,000.00 debit on 06/09/2026 at 14:34 at FoodPanda. Card ending 1234. Ref# 012345678901"'}
          rows={3}
          style={{ width: "100%", padding: 10, borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 12.5, resize: "vertical", fontFamily: "inherit" }}
        />
        <button onClick={runPreview} style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: "#6366f1", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          <MessageSquare size={13} /> Analyze SMS
        </button>
        {preview && (
          <div style={{ marginTop: 10, fontSize: 12.5, display: "flex", alignItems: "flex-start", gap: 8, color: preview.outcome.includes("Not") ? "#b45309" : "#10b981" }}>
            <ShieldCheck size={15} style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600 }}>{preview.outcome}</div>
              {preview.summary && <div style={{ color: colors.textSub }}>{preview.summary}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Review queue */}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <Eye size={14} color="#6366f1" /> Pending review ({pending.length})
          </div>
          <button onClick={loadPending} disabled={refreshing} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: colors.textSub, background: "transparent", border: "none", cursor: "pointer" }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        {queueMsg && <div style={{ fontSize: 12, color: colors.textSub, marginBottom: 8 }}>{queueMsg}</div>}
        {pending.length === 0 && !queueMsg && (
          <div style={{ fontSize: 12, color: colors.textSub, padding: "10px 0", display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={14} color="#10b981" /> All caught up — nothing waiting for review.
          </div>
        )}
        {pending.map((item) => (
          <div key={item.id} style={{ padding: "10px 12px", marginBottom: 8, borderRadius: 10, background: colors.inputBg, border: `1px solid ${colors.cardBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {item.transaction_type === "CREDIT" ? <TrendingUp size={14} color="#10b981" /> : <TrendingDown size={14} color="#ef4444" />}
                  {item.currency} {item.amount}
                  <span style={{ fontSize: 10.5, fontWeight: 500, padding: "2px 7px", borderRadius: 6, background: colors.accentLight, color: "#6366f1" }}>
                    {Math.round((item.parsing_confidence ?? 0) * 100)}%
                  </span>
                </div>
                <div style={{ fontSize: 12, color: colors.textSub, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.merchant || item.bank_name || "Bank transaction"}
                </div>
                <div style={{ fontSize: 11, color: colors.textSub, marginTop: 2, opacity: 0.85 }}>
                  {item.transaction_date || "no date yet"} {item.sender ? `• from ${item.sender}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => resolveItem(item, "add")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <CheckCircle2 size={13} /> Add
                </button>
                <button onClick={() => startEdit(item)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.text, fontSize: 12, cursor: "pointer" }}>
                  Edit
                </button>
                <button onClick={() => resolveItem(item, "ignore")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.4)", background: "transparent", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>
                  <XCircle size={13} /> Ignore
                </button>
              </div>
            </div>

            {editingId === item.id && (
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} style={{ width: 90, padding: "7px 10px", borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 12.5 }} placeholder="Amount" />
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 12.5 }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={editMerchant} onChange={(e) => setEditMerchant(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 12.5 }} placeholder="Merchant / description" />
                <select value={editType} onChange={(e) => setEditType(e.target.value as "expense" | "income")} style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 12.5 }}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <button onClick={() => resolveItem(item, "edit")} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  Save
                </button>
                <button onClick={() => setEditingId(null)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.text, fontSize: 12.5, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11.5, color: colors.textSub, lineHeight: 1.5 }}>
        <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        Privacy promise: only debit/credit alerts are processed. OTPs, passwords and verification codes are filtered out before anything leaves your phone. No raw SMS is ever stored or sent.
      </div>
    </div>
  );
}