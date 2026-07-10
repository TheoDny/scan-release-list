import { JSDOM } from "jsdom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { parseReleaseHtml } from "@/lib/scanner/release-parser"
import type { ReleaseSource } from "@/types/release-source.type"

const source: ReleaseSource = {
  id: "source-1",
  name: "Source",
  enabled: true,
  color: "#7c3aed",
  proxyImages: false,
  baseUrl: "https://example.com/releases",
  releaseParentSelector: ".card",
  deleteSelectors: [],
  titleSelector: ".title",
  imageSelector: "img",
  mangaLinkSelector: ".manga",
  dateFormats: ["iso"],
  releaseSelectors: [
    {
      id: "row-1",
      linkSelector: ".chapter",
      textSelectors: [".chapter"],
    },
  ],
  createdAt: "2026-07-09T00:00:00.000Z",
  updatedAt: "2026-07-09T00:00:00.000Z",
}

describe("parseReleaseHtml", () => {
  beforeEach(() => {
    const dom = new JSDOM("<!doctype html>")
    vi.stubGlobal("DOMParser", dom.window.DOMParser)
    vi.stubGlobal("Document", dom.window.Document)
    vi.stubGlobal("HTMLAnchorElement", dom.window.HTMLAnchorElement)
    vi.stubGlobal("HTMLImageElement", dom.window.HTMLImageElement)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("uses compact hashed ids while exposing legacy manga ids", () => {
    const longUrl = `https://example.com/manga/${"very-long-slug-".repeat(20)}`
    const [item] = parseReleaseHtml(
      `
        <article class="card">
          <a class="manga" href="${longUrl}">
            <h3 class="title">Manga title</h3>
          </a>
          <a class="chapter" href="/chapter/1">Chapter 1</a>
        </article>
      `,
      source
    )

    expect(item).toBeDefined()
    expect(item.id).toMatch(/^srl_[a-z0-9]+$/)
    expect(item.id.length).toBeLessThan(32)
    expect(item.legacyId).toBe(encodeURIComponent(`${source.id}|${longUrl}`))
    expect(item.releases[0]?.id).toMatch(/^srl_[a-z0-9]+$/)
  })
})
