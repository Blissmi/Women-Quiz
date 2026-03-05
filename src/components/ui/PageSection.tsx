import React from 'react'
import { cn } from '@/components/ui/utils'

interface PageSectionProps {
  children: React.ReactNode
  className?: string
}

export function PageSection({ children, className }: PageSectionProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-lg border border-neutral-100 p-8',
        className
      )}
    >
      {children}
    </div>
  )
}
