import React from 'react'
import { motion } from 'framer-motion'

/* ─── InsightCard ─────────────────────────────────────────────────────────── */
interface InsightCardProps {
  title: string
  content: string
  variant?: 'default' | 'subtle'
}

export function InsightCard({ title, content, variant = 'default' }: InsightCardProps) {
  return (
    <div className={`rounded-2xl p-6 ${variant === 'subtle' ? 'bg-white/60 border border-neutral-100' : 'bg-white shadow-lg'}`}>
      <h4 className="text-sm font-semibold text-rose-500 uppercase tracking-wide mb-3">{title}</h4>
      <p className="text-neutral-700 leading-relaxed">{content}</p>
    </div>
  )
}

/* ─── ActionTile ──────────────────────────────────────────────────────────── */
interface ActionTileProps {
  icon: React.ReactNode
  category: string
  content: string
  delay?: number
}

export function ActionTile({ icon, category, content, delay = 0 }: ActionTileProps) {
  const lines = content.split('\n').filter(Boolean)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-6"
    >
      <div className="mb-4">{icon}</div>
      <h4 className="font-semibold text-neutral-800 mb-3">{category}</h4>
      <ul className="space-y-2 text-sm text-neutral-600">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </motion.div>
  )
}
