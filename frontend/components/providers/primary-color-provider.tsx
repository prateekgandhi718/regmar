'use client'

import * as React from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/redux/features/authSlice'

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '').trim()
  if (normalized.length !== 6) return null
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
  return { r, g, b }
}

const srgbToLinear = (c: number) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

const rgbToHsl = (r: number, g: number, b: number) => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255

  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  let hue = 0
  if (delta !== 0) {
    if (max === rn) hue = ((gn - bn) / delta) % 6
    else if (max === gn) hue = (bn - rn) / delta + 2
    else hue = (rn - gn) / delta + 4
    hue *= 60
    if (hue < 0) hue += 360
  }

  const lightness = (max + min) / 2
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))

  return { h: hue, s: saturation, l: lightness }
}

const hslToRgb = (h: number, s: number, l: number) => {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (h % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r1 = 0
  let g1 = 0
  let b1 = 0

  if (0 <= hp && hp < 1) [r1, g1, b1] = [c, x, 0]
  else if (1 <= hp && hp < 2) [r1, g1, b1] = [x, c, 0]
  else if (2 <= hp && hp < 3) [r1, g1, b1] = [0, c, x]
  else if (3 <= hp && hp < 4) [r1, g1, b1] = [0, x, c]
  else if (4 <= hp && hp < 5) [r1, g1, b1] = [x, 0, c]
  else if (5 <= hp && hp < 6) [r1, g1, b1] = [c, 0, x]

  const m = l - c / 2
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

const getReadableForeground = (hex: string) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#ffffff'

  const r = srgbToLinear(rgb.r)
  const g = srgbToLinear(rgb.g)
  const b = srgbToLinear(rgb.b)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b

  return luminance > 0.5 ? '#0a0a0a' : '#ffffff'
}

const rgbToHex = (r: number, g: number, b: number) => {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const hslToHex = (h: number, s: number, l: number) => {
  const { r, g, b } = hslToRgb(h, clamp01(s), clamp01(l))
  return rgbToHex(r, g, b)
}

const createChartPalette = (primaryHex: string) => {
  const primaryRgb = hexToRgb(primaryHex)
  if (!primaryRgb) {
    return { chart1: primaryHex, chart2: '#3b82f6', chart3: '#8b5cf6' }
  }

  const { h, s, l } = rgbToHsl(primaryRgb.r, primaryRgb.g, primaryRgb.b)

  // Keep the chart palette vivid and distinct regardless of the chosen primary.
  const paletteS = clamp01(Math.max(0.62, Math.min(0.85, s * 0.9 + 0.15)))
  const paletteL = clamp01(Math.max(0.48, Math.min(0.58, l * 0.6 + 0.24)))

  const chart2 = hslToHex(h + 120, paletteS, paletteL)
  const chart3 = hslToHex(h + 240, paletteS, paletteL)

  return { chart1: primaryHex, chart2, chart3 }
}

export function PrimaryColorProvider({ children }: { children: React.ReactNode }) {
  const user = useSelector(selectCurrentUser)
  const primaryColor = user?.primaryColor

  React.useEffect(() => {
    if (!primaryColor) return
    if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) return

    const root = document.documentElement
    root.style.setProperty('--color-primary', primaryColor)
    root.style.setProperty('--color-primary-foreground', getReadableForeground(primaryColor))
    root.style.setProperty('--color-ring', primaryColor)

    // Chart palette (triadic hues derived from the chosen primary)
    const { chart1, chart2, chart3 } = createChartPalette(primaryColor)
    root.style.setProperty('--chart-1', chart1)
    root.style.setProperty('--chart-2', chart2)
    root.style.setProperty('--chart-3', chart3)
  }, [primaryColor])

  return <>{children}</>
}
