import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CategoryDefinitions } from '@/components/CategoryDefinitions'

interface StrainStats {
  green: { count: number; percentage: number | string }
  amber: { count: number; percentage: number | string }
  red: { count: number; percentage: number | string }
  total: number
}

interface BubbleData {
  label: string
  percentage: number
  count: number
  color: string
  bgColor: string
  textColor: string
}

export function BubbleChart() {
  const [stats, setStats]: any = useState(null)
  const [loading, setLoading]: any = useState(true)
  const [error, setError]: any = useState(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const serverBase = ((import.meta as any).env.VITE_API_BASE || '').replace(/\/$/, '')
        const url = serverBase ? `${serverBase}/api/results/aggregated-stats` : '/api/results/aggregated-stats'
        const response = await fetch(url, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Failed to fetch aggregated stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    // Refresh stats every 2 seconds for near real-time updates
    const interval = setInterval(fetchStats, 10)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading aggregated results...</div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">Unable to load aggregated results</div>
      </div>
    )
  }

  const bubbles: BubbleData[] = [
    {
      label: 'Stable',
      percentage: parseFloat(stats.green.percentage as unknown as string),
      count: stats.green.count,
      color: '#10b981',
      bgColor: '#d1fae5',
      textColor: '#065f46',
    },
    {
      label: 'Under Pressure',
      percentage: parseFloat(stats.amber.percentage as unknown as string),
      count: stats.amber.count,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      textColor: '#92400e',
    },
    {
      label: 'Needs Attention',
      percentage: parseFloat(stats.red.percentage as unknown as string),
      count: stats.red.count,
      color: '#ef4444',
      bgColor: '#fee2e2',
      textColor: '#7f1d1d',
    },
  ]

  // SVG dimensions - more compact
  const svgWidth = 700
  const svgHeight = 300
  const padding = 60

  // Calculate radius size based on percentage - reduced for better fit
  const maxPercentage = Math.max(...bubbles.map(b => b.percentage))
  const getRadius = (percentage: number) => {
    const normalized = Math.sqrt(percentage / maxPercentage)
    return 30 + normalized * 55
  }

  // Position bubbles: left to right based on category - tighter spacing
  const bubblePositions = [
    { x: 130, y: 120 }, // Stable (left)
    { x: 350, y: 150 },  // Under Pressure (center)
    { x: 570, y: 100 }, // Needs Attention (right)
  ]

  return (
    <div className="w-full">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Workforce Strain Index Distribution</h3>
      </div>

      <div className="flex items-center justify-center py-2 px-4">
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{ maxWidth: '100%', height: 'auto' }}
          className="drop-shadow-md"
        >
          {bubbles.map((bubble, idx) => {
            const radius = getRadius(bubble.percentage)
            const pos = bubblePositions[idx]

            return (
              <motion.g
                key={bubble.label}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 15,
                  delay: idx * 0.15,
                }}
              >
                {/* Bubble circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={bubble.bgColor}
                  stroke={bubble.color}
                  strokeWidth={3}
                  className="transition-all cursor-pointer hover:opacity-80"
                />

                {/* Percentage text */}
                <text
                  x={pos.x}
                  y={pos.y - 5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-bold"
                  style={{
                    fontSize: radius > 60 ? '32px' : '24px',
                    fill: bubble.color,
                    pointerEvents: 'none',
                  }}
                >
                  {bubble.percentage}%
                </text>

                {/* Label below bubble */}
                <text
                  x={pos.x}
                  y={pos.y + radius + 18}
                  textAnchor="middle"
                  className="font-semibold"
                  style={{
                    fontSize: '13px',
                    fill: '#1f2937',
                    pointerEvents: 'none',
                  }}
                >
                  {bubble.label}
                </text>
              </motion.g>
            )
          })}
        </svg>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">About these categories</h3>
        <CategoryDefinitions />
      </div>
    </div>
  )
}
