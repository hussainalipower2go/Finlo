package com.finlo.smsimport

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/** Secure storage for the user's Supabase session and settings. */
object Prefs {
    private const val FILE = "finlo_secure_prefs"

    private fun prefs(context: Context) = runCatching {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            FILE,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }.getOrElse { context.getSharedPreferences(FILE, Context.MODE_PRIVATE) }

    var accessToken: String?
        get() = prefs(AppScope.context).getString("access_token", null)
        set(v) = prefs(AppScope.context).edit().putString("access_token", v).apply()

    var userId: String?
        get() = prefs(AppScope.context).getString("user_id", null)
        set(v) = prefs(AppScope.context).edit().putString("user_id", v).apply()

    var email: String?
        get() = prefs(AppScope.context).getString("email", null)
        set(v) = prefs(AppScope.context).edit().putString("email", v).apply()

    var importEnabled: Boolean
        get() = prefs(AppScope.context).getBoolean("import_enabled", false)
        set(v) = prefs(AppScope.context).edit().putBoolean("import_enabled", v).apply()

    var importMode: String
        get() = prefs(AppScope.context).getString("import_mode", "review") ?: "review"
        set(v) = prefs(AppScope.context).edit().putString("import_mode", v).apply()

    fun isSignedIn(): Boolean = !accessToken.isNullOrBlank()
}

object AppScope {
    lateinit var context: Context
}