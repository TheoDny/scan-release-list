import { describe, expect, it } from "vitest"

import { isAppLanguage } from "@/lib/i18n/i18n"
import { en } from "@/lib/i18n/locales/en"
import { fr } from "@/lib/i18n/locales/fr"

describe("i18n resources", () => {
  it("keeps French and English translation keys aligned", () => {
    expect(resourceKeys(en)).toEqual(resourceKeys(fr))
  })

  it("accepts only supported languages", () => {
    expect(isAppLanguage("fr")).toBe(true)
    expect(isAppLanguage("en")).toBe(true)
    expect(isAppLanguage("de")).toBe(false)
  })
})

function resourceKeys(
  value: Record<string, unknown>,
  prefix = ""
): string[] {
  return Object.entries(value)
    .flatMap(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key
      return typeof child === "object" && child !== null
        ? resourceKeys(child as Record<string, unknown>, path)
        : path
    })
    .sort()
}
