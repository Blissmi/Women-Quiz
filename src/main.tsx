import React from 'react'
import { createRoot } from 'react-dom/client'
// Disable programmatic share/external-protocol opens early to avoid
// browser permission popups for users.
import './utils/disableExternalShare'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
