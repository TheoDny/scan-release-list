import type { CSSProperties } from "react"

export const defaultSourceColor = "#7c3aed"

const hexColorPattern = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

export function normalizeSourceColor(value: unknown) {
  if (typeof value !== "string") {
    return defaultSourceColor
  }

  const color = value.trim()

  return hexColorPattern.test(color)
    ? expandShortHexColor(color)
    : defaultSourceColor
}

export function sourceColorStyle(color: string | undefined): CSSProperties {
  const normalizedColor = normalizeSourceColor(color)

  return {
    backgroundColor: hexToRgb(normalizedColor, 0.14),
    borderColor: hexToRgb(normalizedColor, 0.35),
  }
}

function expandShortHexColor(color: string) {
  if (color.length !== 4) {
    return color.toLowerCase()
  }

  return `#${color
    .slice(1)
    .split("")
    .map((item) => `${item}${item}`)
    .join("")}`.toLowerCase()
}

function hexToRgb(color: string, alpha: number) {
  const value = color.slice(1)
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)

  return `rgb(${red} ${green} ${blue} / ${alpha})`
}
