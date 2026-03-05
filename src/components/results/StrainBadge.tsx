import React from 'react'
import { motion } from 'framer-motion'

type StrainVariant = 'stable' | 'pressure' | 'attention'

const VARIANT_STYLES: Record<StrainVariant, { iconBg: string; icon: string; textColor: string; shadow: string }> = {
  stable:    { iconBg: 'bg-emerald-100', icon: '🟢', textColor: 'text-emerald-600', shadow: 'shadow-[0_0_20px_10px_rgba(16,185,129,0.3)]' },
  pressure:  { iconBg: 'bg-amber-100',   icon: '🟡', textColor: 'text-amber-600',   shadow: 'shadow-[0_0_20px_10px_rgba(245,158,11,0.3)]' },
  attention: { iconBg: 'bg-rose-100',    icon: '🔴', textColor: 'text-rose-600',    shadow: 'shadow-[0_0_20px_10px_rgba(244,63,94,0.3)]' },
}

interface Props {
  variant: StrainVariant
  label: string
  description: string
}

export function StrainBadge({ variant, label, description }: Props) {
  const s = VARIANT_STYLES[variant]
  return (
    <div className="bg-white rounded-3xl shadow-lg mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center py-8"
      >
        <div className={`${s.iconBg} rounded-full p-6 mb-4 relative ${s.shadow}`}>
          <span className="text-4xl">{s.icon}</span>
        </div>
        <h3 className={`text-2xl font-medium mb-3 ${s.textColor}`}>{label}</h3>
        <p className="text-neutral-600 max-w-xl px-6">{description}</p>
      </motion.div>
    </div>
  )
}
