import { scanReleaseDb } from "@/lib/db/scan-release-db"
import { defaultReleaseDateFormats } from "@/lib/scanner/release-date-parser"
import type {
  ReleaseFetchMode,
  ReleaseSource,
  ReleaseSourceDraft,
} from "@/types/release-source.type"

export function createReleaseSource(draft: ReleaseSourceDraft): ReleaseSource {
  const now = new Date().toISOString()

  return {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
}

export async function saveReleaseSource(
  draft: ReleaseSourceDraft,
  sourceId?: string
) {
  if (!sourceId) {
    return scanReleaseDb.sources.add(createReleaseSource(draft))
  }

  const existing = await scanReleaseDb.sources.get(sourceId)
  if (!existing) {
    return scanReleaseDb.sources.add(createReleaseSource(draft))
  }

  return scanReleaseDb.sources.put({
    ...existing,
    ...draft,
    id: sourceId,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteReleaseSource(sourceId: string) {
  await scanReleaseDb.transaction(
    "rw",
    scanReleaseDb.sources,
    scanReleaseDb.favoriteReleases,
    scanReleaseDb.hiddenReleases,
    scanReleaseDb.releaseLocks,
    scanReleaseDb.visitedReleases,
    async () => {
      await scanReleaseDb.sources.delete(sourceId)
      await scanReleaseDb.favoriteReleases
        .where("sourceId")
        .equals(sourceId)
        .delete()
      await scanReleaseDb.hiddenReleases
        .where("sourceId")
        .equals(sourceId)
        .delete()
      await scanReleaseDb.releaseLocks
        .where("sourceId")
        .equals(sourceId)
        .delete()
      await scanReleaseDb.visitedReleases
        .where("sourceId")
        .equals(sourceId)
        .delete()
    }
  )
}

export async function duplicateReleaseSource(
  source: ReleaseSource,
  copySuffix: string
) {
  const draft: ReleaseSourceDraft = {
    name: `${source.name} ${copySuffix}`,
    enabled: source.enabled !== false,
    fetchMode: normalizeReleaseFetchMode(source.fetchMode),
    color: source.color,
    proxyImages: source.proxyImages === true,
    baseUrl: source.baseUrl,
    releaseParentSelector: source.releaseParentSelector,
    deleteSelectors: [...source.deleteSelectors],
    titleSelector: source.titleSelector,
    imageSelector: source.imageSelector,
    mangaLinkSelector: source.mangaLinkSelector,
    dateFormats: Array.isArray(source.dateFormats)
      ? [...source.dateFormats]
      : defaultReleaseDateFormats(),
    releaseSelectors: source.releaseSelectors.map((selector) => ({
      ...selector,
      id: crypto.randomUUID(),
      textSelectors: [...selector.textSelectors],
    })),
  }

  return scanReleaseDb.sources.add(createReleaseSource(draft))
}

export function isReleaseSourceEnabled(source: ReleaseSource) {
  return source.enabled !== false
}

export async function setReleaseSourceEnabled(
  source: ReleaseSource,
  enabled: boolean
) {
  await scanReleaseDb.sources.update(source.id, {
    enabled,
    updatedAt: new Date().toISOString(),
  })
}

function normalizeReleaseFetchMode(value: unknown): ReleaseFetchMode {
  return value === "browser" ? "browser" : "server"
}
