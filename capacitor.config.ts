import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor configuration for the Finlo Android wrapper.
 *
 * Architecture note: Finlo is a Next.js App-Router application that MUST be
 * served by a Node runtime (route handlers under /api/*, SSR admin auth with
 * cookies() and the service-role key cannot run inside a WebView bundle).
 * Therefore the Android app is a native Capacitor wrapper that loads the
 * deployed Finlo web app in a WebView (server.url). The `out/` folder is a
 * tiny offline splash shell used only when server.url is NOT reachable.
 *
 * Build the APK with a reachable server URL, e.g.:
 *   FINLO_APP_URL=https://your-finlo.vercel.app npm run mobile:sync
 * For local emulator testing against a running dev server on the host:
 *   FINLO_APP_URL=http://10.0.2.2:3000 npm run mobile:run
 */
const config: CapacitorConfig = {
  appId: 'com.finlo.app',
  appName: 'Finlo',
  webDir: 'out',
  server: {
    url: process.env.FINLO_APP_URL || undefined,
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: process.env.FINLO_ANDROID_DEBUG === 'true',
  },
}

export default config