import { describe, expect, it } from "vitest"

import { parseReleaseDate } from "@/lib/scanner/release-date-parser"

const now = new Date("2026-07-06T12:00:00.000Z")
const formats = [
  "relative-en",
  "compact-duration",
  "MM-dd HH:mm",
  "2 hours ago",
  "last week",
  "2h 14m",
]

describe("parseReleaseDate", () => {
  it.each([
    ["1 minute ago", "2026-07-06T11:59:00.000Z"],
    ["22 minute ago", "2026-07-06T11:38:00.000Z"],
    ["22 minutes ago", "2026-07-06T11:38:00.000Z"],
    ["2 hour ago", "2026-07-06T10:00:00.000Z"],
    ["2 hours ago", "2026-07-06T10:00:00.000Z"],
    ["1 days ago", "2026-07-05T12:00:00.000Z"],
    ["2 days ago", "2026-07-04T12:00:00.000Z"],
    ["last week", "2026-06-29T12:00:00.000Z"],
    ["2 weeks ago", "2026-06-22T12:00:00.000Z"],
    ["2h 14m", "2026-07-06T09:46:00.000Z"],
    ["06-27 16:12", "2026-06-27T14:12:00.000Z"],
  ])("parses %s", (value, expected) => {
    expect(parseReleaseDate(value, formats, now)).toBe(expected)
  })

  it("rolls month-day dates to the previous year when they are in the future", () => {
    expect(parseReleaseDate("12-27 16:12", formats, now)).toBe(
      "2025-12-27T15:12:00.000Z"
    )
  })

  it("returns undefined when no configured format matches", () => {
    expect(parseReleaseDate("hier", ["MM-dd HH:mm"], now)).toBeUndefined()
  })
})
