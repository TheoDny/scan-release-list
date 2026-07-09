import { describe, expect, it } from "vitest"

import { visitedReleaseId } from "./visited-release-repository"

describe("visitedReleaseId", () => {
  it("uses the source and normalized release URL", () => {
    expect(
      visitedReleaseId("source-1", "https://Example.com/chapter/25#reader")
    ).toBe(
      visitedReleaseId("source-1", "https://example.com/chapter/25")
    )
  })

  it("keeps identical URLs from different sources separate", () => {
    expect(visitedReleaseId("source-1", "https://example.com/chapter/25")).not
      .toBe(visitedReleaseId("source-2", "https://example.com/chapter/25"))
  })
})
