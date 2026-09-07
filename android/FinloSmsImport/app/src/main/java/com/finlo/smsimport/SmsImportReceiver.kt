package com.finlo.smsimport

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

/**
 * Listens for incoming SMS while SMS import is enabled.
 *
 * The on-device filter (deterministic, keeps private data private):
 *   - drops OTP / verification / password / marketing messages,
 *   - keeps only messages that look like bank/transaction alerts,
 *   - then hands matching messages to a WorkManager job that POSTs them
 *     to the Finlo import API. No inbox browsing, no full-text upload.
 */
class SmsImportReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        if (!Prefs.importEnabled) return
        if (Prefs.accessToken.isNullOrBlank()) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            ?.map { SmsMessage(it.displayOriginatingAddress.orEmpty(), it.displayMessageBody.orEmpty()) }
            ?: emptyList()

        val keep = messages.filter { FinloFilter.isFinancial(it) }
        if (keep.isEmpty()) return
        SmsImportWorker.enqueue(context, keep, Prefs.importMode)
    }
}

/** Deterministic filtering — the ONLY place device-side SMS content is inspected. */
object FinloFilter {

    private val AUTH_EXCLUSION = Regex(
        "OTP|one[- ]?time pass|verification code|verif\\w*ide?|security code|password|PIN is|login code|captcha",
        RegexOption.IGNORE_CASE
    )

    private val FINANCIAL_HINT = Regex(
        "debit|credit|balance|paid|received|sent|withdraw|deposit|transaction|transfer|refund|salary|purchase|payment|bill|Rs\\.?|PKR",
        RegexOption.IGNORE_CASE
    )

    fun isFinancial(m: SmsMessage): Boolean {
        val body = m.body.trim()
        if (body.isEmpty()) return false
        if (AUTH_EXCLUSION.containsMatchIn(body)) return false
        return FINANCIAL_HINT.containsMatchIn(body)
    }
}