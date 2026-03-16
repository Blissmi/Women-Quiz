import React from 'react'
import { createRoot } from 'react-dom/client'
// Disable programmatic share/external-protocol opens early to avoid
// browser permission popups for users.
import './utils/disableExternalShare'
import App from './App'
import './index.css'
// Dev-time fetch watcher: enable in development or when VITE_DEBUG_FETCH=true
if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_FETCH === 'true') {
  import('./debug/fetchWatcher')
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
