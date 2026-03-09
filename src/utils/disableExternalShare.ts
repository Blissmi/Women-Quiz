// Runtime safeguard to prevent the app from invoking the OS share sheet
// or auto-opening external apps via common protocols. Import this as
// early as possible (e.g. in `main.tsx`) to neutralize calls that would
// otherwise show the browser permission dialog.

function safeResolve() {
  return Promise.resolve();
}

// Replace navigator.share with a no-op that resolves, preventing the
// browser from showing the "access other apps" permission dialog.
export function disableNavigatorShare() {
  try {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      // @ts-ignore - intentionally overwriting for safety
      navigator.share = function () {
        console.warn('Blocked navigator.share call');
        return safeResolve();
      }
    }
  } catch (e) {
    // ignore
  }
}

// Block window.open for dangerous/auto-open protocols when not triggered
// by an explicit user gesture. We try to allow normal use while preventing
// programmatic opens that would launch external apps.
export function guardWindowOpen() {
  try {
    if (typeof window === 'undefined') return

    const origOpen = window.open.bind(window)
    // List of protocols that could open native apps
    const blockedProtocols = ['mailto:', 'tel:', 'sms:', 'whatsapp:', 'zoom:', 'tg:', 'slack:']

    window.open = function (url?: string | URL | null, target?: string, features?: string) {
      try {
        const u = typeof url === 'string' ? url : url instanceof URL ? url.href : ''
        if (u) {
          const lower = u.toLowerCase()
          for (const p of blockedProtocols) {
            if (lower.startsWith(p)) {
              console.warn('Blocked programmatic open for protocol:', p, 'url:', u)
              return null
            }
          }
        }
      } catch (e) {
        // fallback to original
      }
      return origOpen(url as any, target, features)
    }
  } catch (e) {
    // ignore
  }
}

// Run the guards immediately when this module is imported.
disableNavigatorShare()
guardWindowOpen()

export default {}
