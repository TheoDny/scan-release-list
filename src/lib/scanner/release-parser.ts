import { normalizeSourceColor } from "@/lib/release-sources/source-color"
import {
  defaultReleaseDateFormats,
  parseReleaseDate,
} from "@/lib/scanner/release-date-parser"
import type { ReleaseSource } from "@/types/release-source.type"
import type {
  ScanReleaseItem,
  ScanReleaseLink,
} from "@/types/scan-release.type"

const imageAttributes = ["src", "data-src", "data-lazy-src", "data-original"]

export class InvalidCssSelectorError extends Error {
  constructor(selector: string) {
    super(`Sélecteur CSS invalide: ${selector}`)
    this.name = "InvalidCssSelectorError"
  }
}

export function parseReleaseHtml(
  html: string,
  source: ReleaseSource
): ScanReleaseItem[] {
  const document = new DOMParser().parseFromString(html, "text/html")

  removeConfiguredNodes(document, source.deleteSelectors)

  return safeQuerySelectorAll(document, source.releaseParentSelector)
    .flatMap((parent) => [...parent.children])
    .map((parent) => parseReleaseParent(parent, source))
    .filter((item): item is ScanReleaseItem => item !== null)
}

function removeConfiguredNodes(document: Document, selectors: string[]) {
  for (const selector of selectors) {
    if (!selector.trim()) {
      continue
    }

    safeQuerySelectorAll(document, selector).forEach((node) => node.remove())
  }
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
    .map((selector) => parseReleaseLink(parent, selector, source))
    .filter((release): release is ScanReleaseLink => release !== null)
  const latestReleasedAt = latestReleaseDate(releases)

  if (!title || releases.length === 0) {
    return null
  }

  return {
    id: stableId([source.id, mangaUrl ?? title]),
    legacyId: legacyStableId([source.id, mangaUrl ?? title]),
    sourceId: source.id,
    sourceName: source.name,
    sourceColor: normalizeSourceColor(
      (source as Record<string, unknown>).color
    ),
    proxyImages: (source as Record<string, unknown>).proxyImages === true,
    title,
    ...(imageUrl ? { imageUrl } : {}),
    ...(mangaUrl ? { mangaUrl } : {}),
    ...(latestReleasedAt ? { latestReleasedAt } : {}),
    releases,
  }
}

function parseReleaseLink(
  parent: Element,
  selector: ReleaseSource["releaseSelectors"][number],
  source: ReleaseSource
): ScanReleaseLink | null {
  const url = hrefFromSelector(parent, selector.linkSelector, source.baseUrl)
  const label = selector.textSelectors
    .map((textSelector) => textFromSelector(parent, textSelector))
    .filter(Boolean)
    .join(" ")
    .trim()
  const timeLabel = selector.timeSelector
    ? textFromSelector(parent, selector.timeSelector)
    : undefined
  const releasedAt = parseReleaseDate(timeLabel, dateFormatsFromSource(source))

  if (!url || !label) {
    return null
  }

  return {
    id: stableId([url, label, timeLabel ?? ""]),
    url,
    label,
    ...(timeLabel ? { timeLabel } : {}),
    ...(releasedAt ? { releasedAt } : {}),
  }
}

function textFromSelector(parent: Element, selector: string) {
  if (!selector.trim()) {
    return undefined
  }

  return safeQuerySelector(parent, selector)
    ?.textContent.replace(/\s+/g, " ")
    .trim()
}

function hrefFromSelector(parent: Element, selector: string, baseUrl: string) {
  const element = safeQuerySelector(parent, selector)

  if (!(element instanceof HTMLAnchorElement)) {
    return undefined
  }

  return absoluteUrl(element.href || element.getAttribute("href"), baseUrl)
}

function imageFromSelector(parent: Element, selector: string, baseUrl: string) {
  const element =
    (selector.trim() ? safeQuerySelector(parent, selector) : null) ??
    safeQuerySelector(parent, "img")

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
  return `srl_${hashString(stableIdInput(parts))}`
}

function legacyStableId(parts: Array<string | undefined>) {
  return encodeURIComponent(stableIdInput(parts))
}

function stableIdInput(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join("|").toLowerCase()
}

function hashString(value: string) {
  let hash1 = 0xdeadbeef
  let hash2 = 0x41c6ce57

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    hash1 = Math.imul(hash1 ^ code, 2654435761)
    hash2 = Math.imul(hash2 ^ code, 1597334677)
  }

  hash1 =
    Math.imul(hash1 ^ (hash1 >>> 16), 2246822507) ^
    Math.imul(hash2 ^ (hash2 >>> 13), 3266489909)
  hash2 =
    Math.imul(hash2 ^ (hash2 >>> 16), 2246822507) ^
    Math.imul(hash1 ^ (hash1 >>> 13), 3266489909)

  return (4294967296 * (2097151 & hash2) + (hash1 >>> 0)).toString(36)
}

function latestReleaseDate(releases: ScanReleaseLink[]) {
  return releases
    .map((release) => release.releasedAt)
    .filter((date): date is string => Boolean(date))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0]
}

function safeQuerySelector(parent: ParentNode, selector: string) {
  try {
    return parent.querySelector(selector)
  } catch {
    throw new InvalidCssSelectorError(selector)
  }
}

function safeQuerySelectorAll(parent: ParentNode, selector: string) {
  try {
    return Array.from(parent.querySelectorAll(selector))
  } catch {
    throw new InvalidCssSelectorError(selector)
  }
}

function dateFormatsFromSource(source: ReleaseSource) {
  const dateFormats = (source as Record<string, unknown>).dateFormats

  return Array.isArray(dateFormats)
    ? dateFormats.filter(
        (format): format is string => typeof format === "string"
      )
    : defaultReleaseDateFormats()
}
