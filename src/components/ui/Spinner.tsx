import React from 'react'

export function Spinner({ size = 6 }: { size?: number }) {
  const s = `${size}rem`
  return (
    <div className="flex items-center justify-center">
      <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
        <path d="M22 12a10 10 0 00-10-10" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  )
}
