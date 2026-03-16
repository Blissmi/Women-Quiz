import React from 'react'
import { ResponsiveCirclePacking } from '@nivo/circle-packing'

type NodeDatum = {
  name: string
  value?: number
  status?: 'stable' | 'needs_attention' | 'under_pressure' | string
  children?: NodeDatum[]
}

type Props = {
  data: NodeDatum
  height?: number
}

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '')
  const bigint = parseInt(h, 16)
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
}

const rgbToHex = (r: number, g: number, b: number) => {
  return (
    '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
  )
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const interpolateHex = (aHex: string, bHex: string, t: number) => {
  const a = hexToRgb(aHex)
  const b = hexToRgb(bHex)
  const r = Math.round(lerp(a[0], b[0], t))
  const g = Math.round(lerp(a[1], b[1], t))
  const bl = Math.round(lerp(a[2], b[2], t))
  return rgbToHex(r, g, bl)
}

const sumValues = (node?: NodeDatum): number => {
  if (!node) return 0
  if (typeof node.value === 'number') return node.value
  if (node.children && node.children.length) {
    return node.children.reduce((s, c) => s + sumValues(c), 0)
  }
  return 0
}

const getColorForNode = (nodeValue: number, rootValue: number, status?: string) => {
  const green = '#4ADE80'
  const red = '#F87171'
  if (status === 'stable') return green
  if (status === 'needs_attention') return red
  const t = rootValue > 0 ? Math.min(1, Math.max(0, nodeValue / rootValue)) : 0
  return interpolateHex(green, red, t)
}

const StrainBubbleChart: React.FC<Props> = ({ data, height = 420 }) => {
  const rootValue = sumValues(data) || (data.value ?? 0)

  return (
    <div style={{ height }}>
      <ResponsiveCirclePacking
        data={data as any}
        id="name"
        value="value"
        padding={4}
        borderWidth={2}
        margin={{ top: 10, right: 10, bottom: 80, left: 10 }}
        labelsSkipRadius={24}
        labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        label={(node: any) => {
          const percent = rootValue > 0 ? Math.round((node.value / rootValue) * 100) : 0
          return `${percent}% ${node.data.name}`
        }}
        colors={(node: any) => getColorForNode(node.value, rootValue, node.data.status)}
        // ensure strokes use a slightly darker color
        defs={[]}
        animate={true}
        motionConfig="gentle"
      />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 12,
                background: '#4ADE80',
                display: 'inline-block',
                boxShadow: '0 0 0 4px rgba(74,222,128,0.08)'
              }}
            />
            <div style={{ fontSize: 13, color: '#334155' }}>Stable</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 12,
                background: '#F87171',
                display: 'inline-block',
                boxShadow: '0 0 0 4px rgba(248,113,113,0.06)'
              }}
            />
            <div style={{ fontSize: 13, color: '#334155' }}>Needs Attention</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StrainBubbleChart

// Sample hierarchical data shape (exported for quick testing)
export const sampleData: NodeDatum = {
  name: 'root',
  children: [
    {
      name: 'Stable group',
      children: [
        { name: 'Stable A', value: 34, status: 'stable' },
        { name: 'Stable B', value: 20, status: 'stable' }
      ]
    },
    {
      name: 'Needs Attention group',
      children: [
        { name: 'Attention A', value: 57.4, status: 'needs_attention' },
        { name: 'Attention B', value: 30, status: 'needs_attention' }
      ]
    },
    {
      name: 'Under Pressure group',
      children: [{ name: 'Pressure', value: 8.5, status: 'under_pressure' }]
    }
  ]
}
