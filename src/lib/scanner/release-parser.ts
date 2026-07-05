import type { ReleaseSource } from "@/types/release-source.type"
import type {
  ScanReleaseItem,
  ScanReleaseLink,
} from "@/types/scan-release.type"

const imageAttributes = ["src", "data-src", "data-lazy-src", "data-original"]

export function parseReleaseHtml(
  html: string,
  source: ReleaseSource
): ScanReleaseItem[] {
  const document = new DOMParser().parseFromString(html, "text/html")

  removeConfiguredNodes(document, source.deleteSelectors)

  return Array.from(document.querySelectorAll(source.releaseParentSelector))
    .flatMap((parent) => releaseScopesFromParent(parent, source))
    .map((parent) => parseReleaseParent(parent, source))
    .filter((item): item is ScanReleaseItem => item !== null)
}

function removeConfiguredNodes(document: Document, selectors: string[]) {
  for (const selector of selectors) {
    if (!selector.trim()) {
      continue
    }

    document.querySelectorAll(selector).forEach((node) => node.remove())
  }
}

function releaseScopesFromParent(parent: Element, source: ReleaseSource) {
  const titleNodes = Array.from(parent.querySelectorAll(source.titleSelector))

  if (titleNodes.length <= 1) {
    return [parent]
  }

  const scopes = titleNodes
    .map((titleNode) => releaseScopeFromTitle(titleNode, parent, source))
    .filter((scope): scope is Element => scope !== null)

  return scopes.length > 0 ? uniqueElements(scopes) : [parent]
}

function releaseScopeFromTitle(
  titleNode: Element,
  boundary: Element,
  source: ReleaseSource
) {
  let current: Element | null = titleNode

  while (current && current !== boundary) {
    if (
      current.querySelector(source.mangaLinkSelector) &&
      source.releaseSelectors.some((selector) =>
        current?.querySelector(selector.linkSelector)
      )
    ) {
      return current
    }

    current = current.parentElement
  }

  return null
}

function parseReleaseParent(
  parent: Element,
  source: ReleaseSource
): ScanReleaseItem | null {
  const title = textFromSelector(parent, source.titleSelector)
  const mangaUrl = hrefFromSelector(
    parent,
    source.mangaLinkSelector,
    source.baseUrl
  )
  const imageUrl = imageFromSelector(
    parent,
    source.imageSelector,
    source.baseUrl
  )
  const releases = source.releaseSelectors
    .map((selector) => parseReleaseLink(parent, selector, source.baseUrl))
    .filter((release): release is ScanReleaseLink => release !== null)

  if (!title || releases.length === 0) {
    return null
  }

  return {
    id: stableId([
      source.id,
      mangaUrl ?? title,
      releases[0]?.url ?? releases[0]?.label,
    ]),
    sourceId: source.id,
    sourceName: source.name,
    title,
    ...(imageUrl ? { imageUrl } : {}),
    ...(mangaUrl ? { mangaUrl } : {}),
    releases,
  }
}

function parseReleaseLink(
  parent: Element,
  selector: ReleaseSource["releaseSelectors"][number],
  baseUrl: string
): ScanReleaseLink | null {
  const url = hrefFromSelector(parent, selector.linkSelector, baseUrl)
  const label = selector.textSelectors
    .map((textSelector) => textFromSelector(parent, textSelector))
    .filter(Boolean)
    .join(" ")
    .trim()
  const timeLabel = selector.timeSelector
    ? textFromSelector(parent, selector.timeSelector)
    : undefined

  if (!url || !label) {
    return null
  }

  return {
    id: stableId([url, label, timeLabel ?? ""]),
    url,
    label,
    ...(timeLabel ? { timeLabel } : {}),
  }
}

function textFromSelector(parent: Element, selector: string) {
  if (!selector.trim()) {
    return undefined
  }

  return parent.querySelector(selector)?.textContent.replace(/\s+/g, " ").trim()
}

function hrefFromSelector(parent: Element, selector: string, baseUrl: string) {
  const element = parent.querySelector(selector)

  if (!(element instanceof HTMLAnchorElement)) {
    return undefined
  }

  return absoluteUrl(element.href || element.getAttribute("href"), baseUrl)
}

function imageFromSelector(parent: Element, selector: string, baseUrl: string) {
  const element = parent.querySelector(selector) ?? parent.querySelector("img")

  if (!(element instanceof HTMLImageElement)) {
    return undefined
  }

  for (const attribute of imageAttributes) {
    const value = element.getAttribute(attribute)
    const normalized = absoluteUrl(value, baseUrl)

    if (normalized) {
      return normalized
    }
  }

  return undefined
}

function absoluteUrl(value: string | null | undefined, baseUrl: string) {
  if (!value) {
    return undefined
  }

  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return undefined
  }
}

function stableId(parts: Array<string | undefined>) {
  return encodeURIComponent(parts.filter(Boolean).join("|").toLowerCase())
}

function uniqueElements(elements: Element[]) {
  return Array.from(new Set(elements))
}
