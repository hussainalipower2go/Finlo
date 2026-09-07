# Finlo SMS Import (Android)

Companion Android app for Finlo's **SMS Bank Transaction Import**.

It reads ONLY bank/transaction alert SMS from your device (after explicit,
user-triggered consent), filters them locally, and posts a minimal payload to
the Finlo import API. All parsing, deduplication and categorization happen
**server-side** so the device never stores or uploads anything sensitive.

## Architecture

```
SMS_RECEIVED (or user "Scan inbox" tap)
   └─ SmsImportReceiver / MainActivity.scanInbox
        └─ FinloFilter.isFinancial()      (device-side: drop OTP/promo, keep alerts)
             └─ SmsImportWorker (WorkManager)
                  └─ POST {server}/api/import/sms
                       └─ Finlo server: parser engine → dedupe → auto-add OR review queue
```

- `MainActivity` — consent + sign-in + enable toggle (permission is **never**
  requested at launch; only from the explicit "Enable" tap).
- `SmsImportReceiver` — broadcast receiver gated by `Prefs.importEnabled`.
- `FinloFilter` — the ONLY place device code inspects SMS text. It rejects
  OTP/verification/password messages and keeps financial-alert messages.
- `SmsImportWorker` — outbound network job (batched, retried on failure,
  server dedupes so re-sends are harmless).

## Play Store policy compliance (critical)

`READ_SMS` and `RECEIVE_SMS` are **restricted permissions**. To ship this on
Google Play you **must** have the Default SMS handler / or a Play-approved use
case. Compliance requirements:

1. **Declared purpose** must be phone-number verification (or SMS backup / Default
   SMS handler). "Import bank alerts" is NOT an approved declared purpose alone —
   document clearly. The safest path:
   - Make the import a **user-invoked, one-time flows** (scan button), or
   - Ship a separate, sideloaded module for the SMS part while the Play-build
     disables it, or
   - Apply for the restricted permission review with strong privacy claims.
2. **Consent:** never request the permission at app launch. Request only after
   the user taps Enable and reads the card in `MainActivity`.
3. **Data minimization:** the on-device filter is the gate; raw SMS bodies are
   truncated server-side for review and deleted on resolution. OTPs are
   structurally excluded.
4. **Disclose** in Play data safety form: personal info (financial), SMS,
   with "data shared off device" clearly described.
5. Keep the module **modular/disable-able** so the main Finlo app works without
   it (the web app already shows SMS import as Android-only).

## Building

```bash
cd android/FinloSmsImport
# put your Supabase anon key into app/build.gradle.kts (finlo.supaKey gradle prop
# or replace the default) and set FINLO_SERVER_URL to your deployed Finlo URL.
./gradlew assembleDebug
```

### Notes
- `BuildConfig.FINLO_SERVER_URL` defaults to `https://finlo.example.com` — change
  it to your real deployment. For local testing use `http://10.0.2.2:3000`
  (emulator → host).
- Tokens are stored with `EncryptedSharedPreferences` (falls back to plain
  SharedPreferences if the security lib is unavailable).
- iOS / web cannot read device SMS — the app disables this feature there
  (Import Center shows the Android-only notice).
- No OTP, password, or non-financial SMS is ever stored. Server-side
  `pending_transactions.raw_sms_preview` is a ≤160-char preview deleted once
  the item is resolved.