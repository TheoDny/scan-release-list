import { describe, expect, it } from "vitest"

import { readResponseBytesWithLimit } from "@/lib/scanner/limited-response-reader"

describe("readResponseBytesWithLimit", () => {
  it("reads response bytes when they stay below the limit", async () => {
    const response = new Response("hello")
    const bytes = await readResponseBytesWithLimit(response, 10, "too large")

    expect(new TextDecoder().decode(bytes)).toBe("hello")
  })

  it("throws before returning an oversized response", async () => {
    const response = new Response("hello")

    await expect(
      readResponseBytesWithLimit(response, 3, "too large")
    ).rejects.toThrow("too large")
  })
})
