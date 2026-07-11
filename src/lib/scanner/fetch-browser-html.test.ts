import { afterEach, describe, expect, it, vi } from "vitest"

import { fetchBrowserHtml } from "@/lib/scanner/fetch-browser-html"

describe("fetchBrowserHtml", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("fetches HTML directly from the browser runtime", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response("<main>OK</main>", {
        headers: { "content-type": "text/html; charset=utf-8" },
      })
    )
    vi.stubGlobal("fetch", fetch)

    await expect(fetchBrowserHtml("https://example.com")).resolves.toBe(
      "<main>OK</main>"
    )
    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/",
      expect.objectContaining({
        headers: { accept: "text/html,application/xhtml+xml" },
        mode: "cors",
      })
    )
  })

  it("rejects non HTTP URLs", async () => {
    await expect(fetchBrowserHtml("file:///etc/passwd")).rejects.toThrow(
      "Seules les URLs http/https sont acceptées."
    )
  })

  it("rejects non HTML responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("{}", {
          headers: { "content-type": "application/json" },
        })
      )
    )

    await expect(fetchBrowserHtml("https://example.com")).rejects.toThrow(
      "La réponse n'est pas du HTML."
    )
  })
})
