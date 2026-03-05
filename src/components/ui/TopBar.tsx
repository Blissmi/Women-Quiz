import React from 'react'

interface TopBarProps {
  onStartOver?: () => void
  className?: string
}

export function TopBar({ onStartOver, className }: TopBarProps) {
  return (
    <div className={`w-full flex items-center justify-between px-6 py-4 ${className ?? ''}`}>
      <div />
      {onStartOver && (
        <button
          onClick={onStartOver}
          className="text-sm text-neutral-600 hover:text-rose-500 transition-colors duration-200"
        >
          Start Over
        </button>
      )}
    </div>
  )
}
