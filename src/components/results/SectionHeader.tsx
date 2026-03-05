import React from 'react'

interface Props {
  title: string
}

export function SectionHeader({ title }: Props) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
      <div className="flex-1 h-px bg-neutral-200" />
    </div>
  )
}
