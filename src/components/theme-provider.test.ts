import { describe, expect, it } from "vitest"

import { isAppTheme } from "@/components/theme-provider"

describe("isAppTheme", () => {
  it("accepts light and dark themes only", () => {
    expect(isAppTheme("light")).toBe(true)
    expect(isAppTheme("dark")).toBe(true)
    expect(isAppTheme("system")).toBe(false)
  })
})
