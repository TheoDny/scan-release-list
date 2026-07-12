import { normalizeSourceColor } from "@/lib/release-sources/source-color"
import { defaultReleaseDateFormats } from "@/lib/scanner/release-date-parser"
import type {
  ReleaseFetchMode,
  ReleaseLinkSelector,
  ReleaseSource,
  ReleaseSourceDraft,
} from "@/types/release-source.type"

export const emptyReleaseSelector = (index: number): ReleaseLinkSelector => ({
  id: crypto.randomUUID(),
  linkSelector: "",
  textSelectors: [""],
  timeSelector: index === 0 ? "" : undefined,
})

export const createEmptyDraft = (): ReleaseSourceDraft => ({
  name: "",
  enabled: true,
  fetchMode: "server",
  color: normalizeSourceColor(undefined),
  proxyImages: false,
  baseUrl: "",
  releaseParentSelector: "",
  deleteSelectors: [],
  titleSelector: "",
  imageSelector: "",
  mangaLinkSelector: "",
  dateFormats: defaultReleaseDateFormats(),
  releaseSelectors: [emptyReleaseSelector(0)],
})

export function sourceToDraft(source?: ReleaseSource): ReleaseSourceDraft {
  if (!source) {
    return createEmptyDraft()
  }

  return {
    name: source.name,
    enabled: source.enabled !== false,
    fetchMode: normalizeReleaseFetchMode(source.fetchMode),
    color: normalizeSourceColor(source.color),
    proxyImages: source.proxyImages === true,
    baseUrl: source.baseUrl,
    releaseParentSelector: source.releaseParentSelector,
    deleteSelectors: source.deleteSelectors,
    titleSelector: source.titleSelector,
    imageSelector: source.imageSelector,
    mangaLinkSelector: source.mangaLinkSelector,
    dateFormats: dateFormatsFromSource(source),
    releaseSelectors: source.releaseSelectors,
  }
}

export function normalizeDraft(draft: ReleaseSourceDraft): ReleaseSourceDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    color: normalizeSourceColor(draft.color),
    baseUrl: draft.baseUrl.trim(),
    releaseParentSelector: draft.releaseParentSelector.trim(),
    titleSelector: draft.titleSelector.trim(),
    imageSelector: draft.imageSelector.trim(),
    mangaLinkSelector: draft.mangaLinkSelector.trim(),
    dateFormats: draft.dateFormats.map((item) => item.trim()).filter(Boolean),
    deleteSelectors: draft.deleteSelectors
      .map((item) => item.trim())
      .filter(Boolean),
    releaseSelectors: draft.releaseSelectors
      .map((selector) => ({
        ...selector,
        linkSelector: selector.linkSelector.trim(),
        textSelectors: selector.textSelectors
          .map((item) => item.trim())
          .filter(Boolean),
        timeSelector: selector.timeSelector?.trim(),
      }))
      .filter(
        (selector) =>
          selector.linkSelector.length > 0 && selector.textSelectors.length > 0
      ),
  }
}

export function isReleaseFetchMode(value: unknown): value is ReleaseFetchMode {
  return value === "server" || value === "browser" || value === "rendered"
}

export function linesToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function firstSelectorLine(value: string) {
  return linesToList(value)[0] ?? value.trim()
}

export function updateReleaseSelector(
  selectors: ReleaseLinkSelector[],
  selectorId: string,
  patch: Partial<ReleaseLinkSelector>
) {
  return selectors.map((selector) =>
    selector.id === selectorId ? { ...selector, ...patch } : selector
  )
}

function dateFormatsFromSource(source: ReleaseSource) {
  const dateFormats = (source as Record<string, unknown>).dateFormats

  return Array.isArray(dateFormats)
    ? dateFormats.filter(
        (format): format is string => typeof format === "string"
      )
    : defaultReleaseDateFormats()
}

function normalizeReleaseFetchMode(value: unknown): ReleaseFetchMode {
  return isReleaseFetchMode(value) ? value : "server"
}
