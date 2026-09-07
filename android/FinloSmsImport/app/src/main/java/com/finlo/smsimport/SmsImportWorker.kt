package com.finlo.smsimport

import android.content.Context
import androidx.work.*

/**
 * Posts filtered SMS messages to the Finlo import API.
 *
 * A network failure just stops this run — the messages are discarded rather
 * than duplicated; the server dedupes on reference numbers / amount+date too,
 * so re-sending a later SMS is harmless.
 */
class SmsImportWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val sender = inputData.getString(KEY_SENDER).orEmpty()
        val bodies = inputData.getStringArray(KEY_BODIES)?.toList().orEmpty()
        val mode = inputData.getString(KEY_MODE) ?: "review"
        val token = Prefs.accessToken ?: return Result.success()

        if (bodies.isEmpty()) return Result.success()
        return try {
            Api.postMessages(token, sender, bodies, mode)
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }

    companion object {
        private const val KEY_SENDER = "sender"
        private const val KEY_BODIES = "bodies"
        private const val KEY_MODE = "mode"
        private const val WORK_NAME = "finlo_sms_import"

        fun enqueue(context: Context, messages: List<SmsMessage>, mode: String) {
            val unique = messages.distinctBy { it.body }
            val data = workDataOf(
                KEY_SENDER to (unique.firstOrNull()?.sender.orEmpty()),
                KEY_BODIES to unique.map { it.body }.toTypedArray(),
                KEY_MODE to mode
            )
            val request = OneTimeWorkRequestBuilder<SmsImportWorker>()
                .setInputData(data)
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, java.util.concurrent.TimeUnit.SECONDS)
                .build()
            WorkManager.getInstance(context).enqueue(request)
        }

        /** User-triggered scan of the most recent messages already on the phone. */
        fun enqueueInboxScan(context: Context) {
            val msgs = MainActivity.queryInboxMessages()
            if (msgs.isEmpty()) return
            // Group by sender so the server sees a clean sender per batch.
            msgs.groupBy { it.sender }.forEach { (sender, list) ->
                val financial = list.map { SmsMessage(sender, it.body) }.filter { FinloFilter.isFinancial(it) }
                if (financial.isNotEmpty()) enqueue(context, financial, Prefs.importMode)
            }
        }
    }
}