import { scanReleaseDb } from "@/lib/db/scan-release-db"
import { normalizeSourceColor } from "@/lib/release-sources/source-color"
import { defaultReleaseDateFormats } from "@/lib/scanner/release-date-parser"
import type {
  DatabaseExport,
  DatabaseExportOptions,
  DatabaseImportSummary,
} from "@/types/database-transfer.type"
import type { HiddenRelease } from "@/types/hidden-release.type"
import type { ReleaseLock } from "@/types/release-lock.type"
import type {
  ReleaseLinkSelector,
  ReleaseSource,
} from "@/types/release-source.type"
import type { VisitedRelease } from "@/types/visited-release.type"

const maxImportedStringLength = 2_000
const maxImportedListLength = 100
const maxReleaseSelectorCount = 3

export async function exportDatabase(
  options: DatabaseExportOptions
): Promise<DatabaseExport> {
  const sourceIds = new Set(options.sourceIds)
  const [sources, hiddenReleases, releaseLocks, visitedReleases] =
    await Promise.all([
      options.includeSources ? scanReleaseDb.sources.toArray() : [],
      options.includeHiddenReleases
        ? scanReleaseDb.hiddenReleases.toArray()
        : [],
      options.includeReleaseLocks ? scanReleaseDb.releaseLocks.toArray() : [],
      options.includeVisitedReleases
        ? scanReleaseDb.visitedReleases.toArray()
        : [],
    ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      ...(options.includeSources
        ? { sources: sources.filter((source) => sourceIds.has(source.id)) }
        : {}),
      ...(options.includeHiddenReleases
        ? {
            hiddenReleases: hiddenReleases.filter((release) =>
              sourceIds.has(release.sourceId)
            ),
          }
        : {}),
      ...(options.includeReleaseLocks
        ? {
            releaseLocks: releaseLocks.filter((lock) =>
              sourceIds.has(lock.sourceId)
            ),
          }
        : {}),
      ...(options.includeVisitedReleases
        ? {
            visitedReleases: visitedReleases.filter((release) =>
              sourceIds.has(release.sourceId)
            ),
          }
        : {}),
    },
  }
}

export async function importDatabase(
  serializedExport: string
): Promise<DatabaseImportSummary> {
  const parsed: unknown = JSON.parse(serializedExport)
  const databaseExport = parseDatabaseExport(parsed)
  const sources = databaseExport.data.sources ?? []
  const hiddenReleases = databaseExport.data.hiddenReleases ?? []
  const releaseLocks = databaseExport.data.releaseLocks ?? []
  const visitedReleases = databaseExport.data.visitedReleases ?? []

  await scanReleaseDb.transaction(
    "rw",
    scanReleaseDb.sources,
    scanReleaseDb.hiddenReleases,
    scanReleaseDb.releaseLocks,
    scanReleaseDb.visitedReleases,
    async () => {
      await scanReleaseDb.sources.bulkPut(sources)
      await scanReleaseDb.hiddenReleases.bulkPut(hiddenReleases)
      await scanReleaseDb.releaseLocks.bulkPut(releaseLocks)
      await scanReleaseDb.visitedReleases.bulkPut(visitedReleases)
    }
  )

  return {
    sources: sources.length,
    hiddenReleases: hiddenReleases.length,
    releaseLocks: releaseLocks.length,
    visitedReleases: visitedReleases.length,
  }
}

function parseDatabaseExport(value: unknown): DatabaseExport {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.data)) {
    throw new Error("Ce fichier n'est pas un export valide.")
  }

  return {
    version: 1,
    exportedAt:
      typeof value.exportedAt === "string"
        ? value.exportedAt
        : new Date().toISOString(),
    data: {
      ...(value.data.sources
        ? { sources: parseRecords(value.data.sources, parseReleaseSource) }
        : {}),
      ...(value.data.hiddenReleases
        ? {
            hiddenReleases: parseRecords(
              value.data.hiddenReleases,
              parseHiddenRelease
            ),
          }
        : {}),
      ...(value.data.releaseLocks
        ? {
            releaseLocks: parseRecords(
              value.data.releaseLocks,
              parseReleaseLock
            ),
          }
        : {}),
      ...(value.data.visitedReleases
        ? {
            visitedReleases: parseRecords(
              value.data.visitedReleases,
              parseVisitedRelease
            ),
          }
        : {}),
    },
  }
}

function parseRecords<T>(
  value: unknown,
  parser: (record: unknown) => T | undefined
) {
  if (!Array.isArray(value) || value.length > maxImportedListLength) {
    throw new Error("Le fichier contient des données invalides.")
  }

  const records: T[] = []

  for (const item of value) {
    const record = parser(item)

    if (!record) {
      throw new Error("Le fichier contient des données invalides.")
    }

    records.push(record)
  }

  return records
}

function parseReleaseSource(value: unknown): ReleaseSource | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = cleanString(value.id)
  const name = cleanString(value.name)
  const baseUrl = cleanHttpUrl(value.baseUrl)
  const releaseParentSelector = cleanString(value.releaseParentSelector)
  const titleSelector = cleanString(value.titleSelector)
  const imageSelector = cleanString(value.imageSelector)
  const mangaLinkSelector = cleanString(value.mangaLinkSelector)
  const releaseSelectors = parseReleaseSelectors(value.releaseSelectors)

  if (
    !id ||
    !name ||
    !baseUrl ||
    !releaseParentSelector ||
    !titleSelector ||
    !mangaLinkSelector ||
    !releaseSelectors
  ) {
    return undefined
  }

  return {
    id,
    name,
    enabled: value.enabled !== false,
    color: normalizeSourceColor(cleanString(value.color)),
    proxyImages: value.proxyImages === true,
    baseUrl,
    releaseParentSelector,
    deleteSelectors: parseStringList(value.deleteSelectors) ?? [],
    titleSelector,
    imageSelector: imageSelector ?? "",
    mangaLinkSelector,
    dateFormats:
      parseStringList(value.dateFormats) ?? defaultReleaseDateFormats(),
    releaseSelectors,
    createdAt: cleanIsoDate(value.createdAt) ?? new Date().toISOString(),
    updatedAt: cleanIsoDate(value.updatedAt) ?? new Date().toISOString(),
  }
}

function parseReleaseSelectors(
  value: unknown
): ReleaseLinkSelector[] | undefined {
  if (!Array.isArray(value) || value.length > maxReleaseSelectorCount) {
    return undefined
  }

  const selectors: ReleaseLinkSelector[] = []

  for (const item of value) {
    const selector = parseReleaseSelector(item)

    if (!selector) {
      return undefined
    }

    selectors.push(selector)
  }

  if (selectors.length === 0) {
    return undefined
  }

  return selectors
}

function parseReleaseSelector(value: unknown): ReleaseLinkSelector | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = cleanString(value.id)
  const linkSelector = cleanString(value.linkSelector)
  const textSelectors = parseStringList(value.textSelectors)
  const timeSelector = cleanString(value.timeSelector)

  if (!id || !linkSelector || !textSelectors || textSelectors.length === 0) {
    return undefined
  }

  return {
    id,
    linkSelector,
    textSelectors,
    ...(timeSelector ? { timeSelector } : {}),
  }
}

function parseHiddenRelease(value: unknown): HiddenRelease | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = cleanString(value.id)
  const itemId = cleanString(value.itemId)
  const sourceId = cleanString(value.sourceId)
  const title = cleanString(value.title)
  const createdAt = cleanIsoDate(value.createdAt)

  if (!id || !itemId || !sourceId || !title || !createdAt) {
    return undefined
  }

  return { id, itemId, sourceId, title, createdAt }
}

function parseReleaseLock(value: unknown): ReleaseLock | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = cleanString(value.id)
  const itemId = cleanString(value.itemId)
  const sourceId = cleanString(value.sourceId)
  const title = cleanString(value.title)
  const delayHours = cleanPositiveInteger(value.delayHours)
  const createdAt = cleanIsoDate(value.createdAt)
  const updatedAt = cleanIsoDate(value.updatedAt)

  if (
    !id ||
    !itemId ||
    !sourceId ||
    !title ||
    !delayHours ||
    !createdAt ||
    !updatedAt
  ) {
    return undefined
  }

  return { id, itemId, sourceId, title, delayHours, createdAt, updatedAt }
}

function parseVisitedRelease(value: unknown): VisitedRelease | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = cleanString(value.id)
  const sourceId = cleanString(value.sourceId)
  const releaseUrl = cleanString(value.releaseUrl)
  const visitedAt = cleanIsoDate(value.visitedAt)

  if (!id || !sourceId || !releaseUrl || !visitedAt) {
    return undefined
  }

  return {
    id,
    sourceId,
    releaseUrl,
    ...(cleanString(value.mangaId)
      ? { mangaId: cleanString(value.mangaId) }
      : {}),
    ...(cleanString(value.mangaTitle)
      ? { mangaTitle: cleanString(value.mangaTitle) }
      : {}),
    ...(cleanString(value.chapterLabel)
      ? { chapterLabel: cleanString(value.chapterLabel) }
      : {}),
    visitedAt,
  }
}

function parseStringList(value: unknown) {
  if (!Array.isArray(value) || value.length > maxImportedListLength) {
    return undefined
  }

  const strings = value
    .map(cleanString)
    .filter((item): item is string => Boolean(item))

  return strings.length === value.length ? strings : undefined
}

function cleanString(value: unknown) {
  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim()

  return normalized.length > 0 && normalized.length <= maxImportedStringLength
    ? normalized
    : undefined
}

function cleanHttpUrl(value: unknown) {
  const rawUrl = cleanString(value)

  if (!rawUrl) {
    return undefined
  }

  try {
    const url = new URL(rawUrl)
    return ["http:", "https:"].includes(url.protocol)
      ? url.toString()
      : undefined
  } catch {
    return undefined
  }
}

function cleanIsoDate(value: unknown) {
  const date = cleanString(value)

  return date && !Number.isNaN(Date.parse(date)) ? date : undefined
}

function cleanPositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return undefined
  }

  return value > 0 && value <= 24 * 30 ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
