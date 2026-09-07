package com.finlo.smsimport

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Minimal HTTP client for:
 *   1. Logging in against Supabase Auth REST (email + password) to obtain a bearer token.
 *   2. Posting filtered SMS messages to the Finlo import API.
 *
 * The Finlo server does all heavy parsing / deduplication / categorization.
 * The device only decides whether a message is worth sending (financial alert,
 * not an OTP), keeping PII exposure minimal.
 */
object Api {
    private const val SUPABASE_AUTH = "${BuildConfig.SUPABASE_URL}/auth/v1/token"

    data class Session(val accessToken: String, val userId: String)

    suspend fun signIn(email: String, password: String): Session = withContext(Dispatchers.IO) {
        val body = JSONObject()
            .put("email", email)
            .put("password", password)
            .put("gotrue_meta_security", JSONObject())

        val conn = URL(SUPABASE_AUTH).openConnection() as HttpURLConnection
        try {
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("apikey", BuildConfig.SUPABASE_ANON_KEY)
            conn.doOutput = true
            conn.outputStream.use { it.write(body.toString().toByteArray()) }

            val code = conn.responseCode
            val raw = if (code in 200..299) conn.inputStream.bufferedReader().readText()
                      else conn.errorStream?.bufferedReader()?.readText().orEmpty()
            val json = JSONObject(raw)
            if (code !in 200..299) throw RuntimeException(json.optString("error_description", "Sign-in failed ($code)"))
            Session(
                accessToken = json.getString("access_token"),
                userId = json.getString("user_id")
            )
        } finally {
            conn.disconnect()
        }
    }

    data class PostResult(val created: Int, val duplicates: Int, val queued: Int)

    /**
     * Send a batch of SMS messages to Finlo. Returns counts from the server.
     */
    suspend fun postMessages(token: String, sender: String, bodies: List<String>, mode: String): PostResult =
        withContext(Dispatchers.IO) {
            val payload = JSONObject().apply {
                put("mode", mode)
                put("messages", JSONArray().apply {
                    bodies.forEach { b -> put(JSONObject().put("sender", sender).put("body", b)) }
                })
            }

            val conn = URL("${BuildConfig.FINLO_SERVER_URL}/api/import/sms").openConnection() as HttpURLConnection
            try {
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.doOutput = true
                conn.outputStream.use { it.write(payload.toString().toByteArray()) }

                val code = conn.responseCode
                val raw = if (code in 200..299) conn.inputStream.bufferedReader().readText()
                          else conn.errorStream?.bufferedReader()?.readText().orEmpty()
                if (code !in 200..299) throw RuntimeException(raw.ifBlank { "Import failed ($code)" })

                val json = JSONObject(raw)
                PostResult(
                    created = json.optInt("created", 0),
                    duplicates = json.optInt("duplicates", 0),
                    queued = json.optInt("queued", 0)
                )
            } finally {
                conn.disconnect()
            }
        }
}