package com.finlo.smsimport

import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Telephony
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

/**
 * Consent-first setup screen.
 *
 * The user explicitly opts in here before ANY SMS permission is requested or
 * any message is read. Permission is requested from a button tap, never at
 * app launch. Sign-in uses the same credentials as the Finlo web app.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var statusText: TextView
    private lateinit var emailInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var loginBtn: Button
    private lateinit var consentCheck: CheckBox
    private lateinit var enableToggle: Button
    private lateinit var scanInboxBtn: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        AppScope.context = applicationContext

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 80, 48, 48)
        }

        root.addView(TextView(this).apply { text = "Finlo SMS Import"; textSize = 22f })
        root.addView(TextView(this).apply {
            text = "This app reads ONLY bank/transaction alerts from your SMS (after your explicit permission below) and sends the amounts, dates and merchant names to your Finlo account. OTPs, passwords, and other private messages are never read, stored or uploaded — the filter runs on your device."
            textSize = 13f; setPadding(0, 12, 0, 24)
        })

        emailInput = EditText(this).apply { hint = "Finlo email" }
        passwordInput = EditText(this).apply { hint = "Password"; inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD }
        root.addView(emailInput)
        root.addView(passwordInput)

        loginBtn = Button(this).apply { text = "Sign in & link device" }
        root.addView(loginBtn)

        consentCheck = CheckBox(this).apply {
            text = "I understand only bank debit/credit alerts are read, and I consent"
            textSize = 12f
        }
        root.addView(consentCheck)

        enableToggle = Button(this).apply { text = "Enable SMS import" }
        root.addView(enableToggle)

        scanInboxBtn = Button(this).apply { text = "Scan my recent bank SMS" }
        root.addView(scanInboxBtn)

        statusText = TextView(this).apply { textSize = 12f; setPadding(0, 16, 0, 0) }
        root.addView(statusText)

        setContentView(root)

        binding()

        loginBtn.setOnClickListener {
            val email = emailInput.text.toString().trim()
            val password = passwordInput.text.toString()
            if (email.isBlank() || password.isBlank()) { toast("Enter your Finlo email and password"); return@setOnClickListener }
            statusText.text = "Signing in…"
            lifecycleScope.launch {
                try {
                    val session = Api.signIn(email, password)
                    Prefs.accessToken = session.accessToken
                    Prefs.userId = session.userId
                    Prefs.email = email
                    Prefs.importMode = "review"
                    statusText.text = "✓ Linked to ${session.userId.take(8)}…"
                } catch (e: Exception) {
                    statusText.text = "Sign-in failed: ${e.message}"
                }
            }
        }

        consentCheck.setOnCheckedChangeListener { _, _ -> bind() }

        enableToggle.setOnClickListener {
            if (!consentCheck.isChecked) { toast("Please check the consent box first"); return@setOnClickListener }
            if (!hasPermission()) {
                toast("Phone permission is required to read SMS")
                requestSmsPermission.launch(android.Manifest.permission.READ_SMS)
                return@setOnClickListener
            }
            if (!Prefs.isSignedIn()) { toast("Sign in first"); return@setOnClickListener }
            Prefs.importEnabled = !Prefs.importEnabled
            bind()
            toast(if (Prefs.importEnabled) "SMS import enabled" else "SMS import disabled")
        }

        scanInboxBtn.setOnClickListener {
            if (!consentCheck.isChecked) { toast("Please check the consent box first"); return@setOnClickListener }
            if (!hasPermission()) { toast("Phone permission is required"); requestSmsPermission.launch(android.Manifest.permission.READ_SMS); return@setOnClickListener }
            if (!Prefs.isSignedIn()) { toast("Sign in first"); return@setOnClickListener }
            SmsImportWorker.enqueueInboxScan(this)
            toast("Scan queued — results appear in the app's review queue")
        }

        bind()
    }

    private val requestSmsPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            bind()
            if (!granted) statusText.text = "Permission denied — SMS import stays off."
        }

    private fun hasPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, android.Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED

    private fun bind() {
        val signedIn = Prefs.isSignedIn()
        val enabled = Prefs.importEnabled && hasPermission() && Prefs.isSignedIn()
        loginBtn.isEnabled = !signedIn
        enableToggle.text = if (enabled) "Disable SMS import" else "Enable SMS import"
        enableToggle.isEnabled = consentCheck.isChecked && signedIn && hasPermission()
        scanInboxBtn.isEnabled = consentCheck.isChecked && signedIn && hasPermission()
        statusText.text = if (enabled) "✓ SMS import is ON — new bank alerts will be sent automatically."
                         else if (signedIn && consentCheck.isChecked && !hasPermission())
                             "Sign-in ok. Tap Enable and grant SMS permission to activate."
                         else if (signedIn) "Signed in. Consent + permission needed to activate."
                         else "Sign in to link this device to your Finlo account."
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()

    @Suppress("DEPRECATION")
    companion object {
        fun queryInboxMessages(): List<SmsMessage> {
            val context = AppScope.context
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) return emptyList()
            val inbox = Telephony.Sms.getInboxUri(context)
            val out = mutableListOf<SmsMessage>()
            val cur = context.contentResolver?.query(inbox, arrayOf("address", "body"), null, null, "date DESC")
            cur?.use {
                var n = 0
                while (it.moveToNext() && n < 400) {
                    val address = it.getString(0) ?: ""
                    val body = it.getString(1) ?: ""
                    if (body.isNotBlank()) out.add(SmsMessage(address, body))
                    n++
                }
            }
            return out
        }
    }
}

data class SmsMessage(val sender: String, val body: String)