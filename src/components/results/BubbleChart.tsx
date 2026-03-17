import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, ChevronDown } from 'lucide-react'
import jsPDF from 'jspdf'
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
  const [range, setRange] = useState('hour' as 'hour' | 'day' | 'overall')
  
  // centralized fetch so we can call it on mount, interval, and on external events
  async function fetchStats(rangeParam?: 'hour' | 'day' | 'overall') {
    const r = rangeParam || range
    const initial = !stats
    try {
      if (initial) setLoading(true)
      const serverBase = ((import.meta as any).env.VITE_API_BASE || '').replace(/\/$/, '')
      const urlBase = serverBase ? `${serverBase}/api/results/aggregated-stats` : '/api/results/aggregated-stats'
      const url = `${urlBase}?range=${r === 'overall' ? 'overall' : (r === 'day' ? 'day' : 'hour')}`
      console.debug('Fetching aggregated stats:', url)
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to fetch aggregated stats')
      }
      const data = await response.json()
      console.debug('Aggregated stats response:', data)
      setStats(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      if (initial) setLoading(false)
    }
  }

  // fetch on mount
  useEffect(() => {
    fetchStats()
    // register a global listener that triggers a refresh when results are posted
    const handler = () => fetchStats()
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('results:posted', handler)
    }
    return () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('results:posted', handler)
      }
    }
  }, [])

  // re-fetch when user changes the selected range
  useEffect(() => {
    fetchStats()
  }, [range])

  // Generate and download PDF with all three ranges
  async function handleDownloadReport() {
    try {
      // Fetch all three ranges data
      const serverBase = ((import.meta as any).env.VITE_API_BASE || '').replace(/\/$/, '')
      const urlBase = serverBase ? `${serverBase}/api/results/aggregated-stats` : '/api/results/aggregated-stats'

      const [hourRes, dayRes, overallRes] = await Promise.all([
        fetch(`${urlBase}?range=hour`, { cache: 'no-store' }),
        fetch(`${urlBase}?range=day`, { cache: 'no-store' }),
        fetch(`${urlBase}?range=overall`, { cache: 'no-store' })
      ])

      if (!hourRes.ok || !dayRes.ok || !overallRes.ok) {
        throw new Error('Failed to fetch report data')
      }

      const [hourData, dayData, overallData] = await Promise.all([
        hourRes.json(),
        dayRes.json(),
        overallRes.json()
      ])

      // Generate PDF as Blob
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPosition = 15

      // Title
      doc.setFontSize(20)
      doc.setTextColor(200, 60, 100)
      doc.text('Workforce Strain Index Report', 15, yPosition)
      yPosition += 12

      // Generated date
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, yPosition)
      yPosition += 10

      // Function to calculate bubble radius
      const getRadius = (percentage: number, maxPercentage: number) => {
        const normalized = Math.sqrt(percentage / maxPercentage)
        return 8 + normalized * 12
      }

      // Function to draw bubble chart
      const drawBubbleChart = (title: string, data: any, startY: number) => {
        if (startY > pageHeight - 80) {
          doc.addPage()
          startY = 15
        }

        // Title
        doc.setFontSize(14)
        doc.setTextColor(200, 60, 100)
        doc.text(title, 15, startY)
        let y = startY + 10

        // Calculate max percentage for radius scaling
        const maxPercentage = Math.max(
          parseFloat(data.green.percentage),
          parseFloat(data.amber.percentage),
          parseFloat(data.red.percentage)
        )

        // Draw bubbles with better spacing
        const bubbleSpacing = 60
        const startX = 45
        const bubbleCenterY = y + 15

        // Green bubble
        const greenRadius = getRadius(parseFloat(data.green.percentage), maxPercentage)
        doc.setFillColor(16, 185, 129)
        doc.circle(startX, bubbleCenterY, greenRadius, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('Helvetica', 'bold')
        doc.text(`${data.green.percentage}%`, startX, bubbleCenterY, { align: 'center' })
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(50, 50, 50)
        doc.text('Stable', startX, bubbleCenterY + 30, { align: 'center' })

        // Amber bubble
        const amberRadius = getRadius(parseFloat(data.amber.percentage), maxPercentage)
        doc.setFillColor(245, 158, 11)
        doc.circle(startX + bubbleSpacing, bubbleCenterY, amberRadius, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('Helvetica', 'bold')
        doc.text(`${data.amber.percentage}%`, startX + bubbleSpacing, bubbleCenterY, { align: 'center' })
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(50, 50, 50)
        doc.text('Under', startX + bubbleSpacing, bubbleCenterY + 30, { align: 'center' })
        doc.text('Pressure', startX + bubbleSpacing, bubbleCenterY + 34, { align: 'center' })

        // Red bubble
        const redRadius = getRadius(parseFloat(data.red.percentage), maxPercentage)
        doc.setFillColor(239, 68, 68)
        doc.circle(startX + bubbleSpacing * 2, bubbleCenterY, redRadius, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('Helvetica', 'bold')
        doc.text(`${data.red.percentage}%`, startX + bubbleSpacing * 2, bubbleCenterY, { align: 'center' })
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(50, 50, 50)
        doc.text('Needs', startX + bubbleSpacing * 2, bubbleCenterY + 30, { align: 'center' })
        doc.text('Attention', startX + bubbleSpacing * 2, bubbleCenterY + 34, { align: 'center' })

        return bubbleCenterY + 48
      }

      // Draw all three bubble charts
      yPosition = drawBubbleChart('Last 1 Hour Results', hourData, yPosition)
      yPosition = drawBubbleChart('Last 24 Hours Results', dayData, yPosition)
      yPosition = drawBubbleChart('Overall Results (All Time)', overallData, yPosition)

      // Add page break before category definitions if needed
      if (yPosition > pageHeight - 80) {
        doc.addPage()
        yPosition = 15
      }

      // Add category definitions section
      doc.setFontSize(14)
      doc.setTextColor(50, 50, 50)
      doc.text('About these categories', 15, yPosition)
      yPosition += 12

      // Stable category
      doc.setDrawColor(16, 185, 129)
      doc.setLineWidth(0.5)
      doc.rect(15, yPosition, 55, 35)
      doc.setFontSize(11)
      doc.setTextColor(16, 185, 129)
      doc.setFont('Helvetica', 'bold')
      doc.text('Stable', 42.5, yPosition + 8, { align: 'center' })
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      doc.text('Good energy levels', 17, yPosition + 16)
      doc.text('and stress', 17, yPosition + 20)
      doc.text('management', 17, yPosition + 24)

      // Under Pressure category
      doc.setDrawColor(245, 158, 11)
      doc.setLineWidth(0.5)
      doc.rect(75, yPosition, 55, 35)
      doc.setFontSize(11)
      doc.setTextColor(245, 158, 11)
      doc.setFont('Helvetica', 'bold')
      doc.text('Under Pressure', 102.5, yPosition + 8, { align: 'center' })
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      doc.text('Some signs of strain', 77, yPosition + 16)
      doc.text('requiring attention', 77, yPosition + 20)

      // Needs Attention category
      doc.setDrawColor(239, 68, 68)
      doc.setLineWidth(0.5)
      doc.rect(135, yPosition, 55, 35)
      doc.setFontSize(11)
      doc.setTextColor(239, 68, 68)
      doc.setFont('Helvetica', 'bold')
      doc.text('Needs Attention', 162.5, yPosition + 8, { align: 'center' })
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      doc.text('Elevated strain levels', 137, yPosition + 16)
      doc.text('indicating need for', 137, yPosition + 20)
      doc.text('support', 137, yPosition + 24)

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('This report was generated by Blissmi Women\'s Health Quiz', 15, pageHeight - 10)

      // Get PDF as blob
      const pdfBlob = doc.output('blob')
      
      // Generate filename
      const fileName = `strain-index-report-${new Date().toISOString().split('T')[0]}.pdf`
      
      // Download PDF
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error('Error generating report:', err)
      alert('Failed to generate report. Please try again.')
    }
  }

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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Workforce Strain Index Distribution</h3>
      </div>

      <div className="flex justify-between items-center mb-6 gap-4">
        {/* Dropdown on left */}
        <div className="relative">
          <select
            value={range}
            onChange={(e) => {
              const v = e.target.value
              setRange(v === 'overall' ? 'overall' : (v === 'day' ? 'day' : 'hour'))
            }}
            className="appearance-none bg-gradient-to-r from-rose-400 to-rose-500 text-white font-semibold text-sm px-4 py-3 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2 pr-10 shadow-md hover:shadow-lg transition-shadow"
          >
            <option value="hour">Last 1 hour results</option>
            <option value="day">Last 24 hours</option>
            <option value="overall">Overall results</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
        </div>

        {/* Download button on right */}
        <button
          onClick={handleDownloadReport}
          className="inline-flex items-center gap-2 bg-white text-rose-500 px-5 py-3 rounded-full font-semibold transition-transform duration-200 shadow-md hover:shadow-lg hover:scale-105 text-sm whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
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
