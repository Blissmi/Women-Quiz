// Simple fetch watcher for debugging network calls in the browser console.
// Enable by setting VITE_DEBUG_FETCH=true when building/running the app.
(function () {
  try {
    const orig = window.fetch.bind(window)
    // Avoid double-wrapping
    if ((orig as any).__isWrapped) return
    const wrapped: any = function () {
      try {
        // Log the request url and options (safe stringify)
        const url = arguments[0]
        const opts = arguments[1] || {}
        console.log('fetch called:', url, opts)
      } catch (e) {
        console.warn('fetchWatcher log failed', e)
      }
      return orig.apply(this, arguments)
    }
    wrapped.__isWrapped = true
    // Replace global fetch
    // @ts-ignore
    window.fetch = wrapped
    console.info('fetchWatcher active: VITE_DEBUG_FETCH=true')
  } catch (e) {
    // ignore failures
    // eslint-disable-next-line no-console
    console.warn('Failed to install fetchWatcher', e)
  }
})()
