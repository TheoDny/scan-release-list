import { JSDOM } from "jsdom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  buildSelectorPreviewDocument,
  chooseSelectorCandidate,
} from "@/lib/scanner/selector-preview"

describe("selector preview", () => {
  beforeEach(() => {
    const dom = new JSDOM("<!doctype html>")
    vi.stubGlobal("DOMParser", dom.window.DOMParser)
    vi.stubGlobal("Document", dom.window.Document)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("sanitizes unsafe markup and normalizes relative URLs", () => {
    const preview = buildSelectorPreviewDocument(
      `
        <article class="card" onclick="alert('x')">
          <a class="title" href="/manga/one">One Piece</a>
          <script>alert('bad')</script>
        </article>
      `,
      "https://example.com/releases",
      ".card"
    )

    expect(preview.srcDoc).not.toContain("onclick")
    expect(preview.srcDoc).not.toContain("alert('bad')")
    expect(preview.srcDoc).toContain("https://example.com/manga/one")
  })

  it("tracks parent and first-child nodes for visual navigation", () => {
    const preview = buildSelectorPreviewDocument(
      `
        <article class="card">
          <h3 class="title">Manga title</h3>
        </article>
      `,
      "https://example.com",
      ".card"
    )
    const nodes = Object.values(preview.nodes)
    const card = nodes.find((node) => node.tagName === "article")
    const title = nodes.find((node) => node.tagName === "h3")

    expect(card?.firstChildId).toBe(title?.id)
    expect(title?.parentId).toBe(card?.id)
  })

  it("prefers relative selectors when available", () => {
    const preview = buildSelectorPreviewDocument(
      `
        <article class="card">
          <a class="chapter" href="/chapter/1">Chapter 1</a>
        </article>
        <article class="card">
          <a class="chapter" href="/chapter/2">Chapter 2</a>
        </article>
      `,
      "https://example.com",
      ".card"
    )
    const chapter = Object.values(preview.nodes).find(
      (node) => node.tagName === "a" && node.text === "Chapter 1"
    )

    expect(chapter).toBeDefined()
    expect(chapter?.relativeCandidates.length).toBeGreaterThan(0)
    expect(chooseSelectorCandidate(chapter!, true).matchCount).toBe(1)
  })
})
