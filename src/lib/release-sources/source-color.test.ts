import { describe, expect, it } from "vitest"

import { defaultSourceColor, normalizeSourceColor } from "./source-color"

describe("normalizeSourceColor", () => {
  it("keeps valid long hex colors", () => {
    expect(normalizeSourceColor("#22c55e")).toBe("#22c55e")
  })

  it("expands short hex colors", () => {
    expect(normalizeSourceColor("#abc")).toBe("#aabbcc")
  })

  it("falls back when the stored color is missing or invalid", () => {
    expect(normalizeSourceColor(undefined)).toBe(defaultSourceColor)
    expect(normalizeSourceColor("hotpink")).toBe(defaultSourceColor)
  })
})
