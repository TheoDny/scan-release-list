import { scanReleaseDb } from "@/lib/db/scan-release-db"
import { defaultReleaseDateFormats } from "@/lib/scanner/release-date-parser"
import type {
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
    scanReleaseDb.hiddenReleases,
    async () => {
      await scanReleaseDb.sources.delete(sourceId)
      await scanReleaseDb.hiddenReleases
        .where("sourceId")
        .equals(sourceId)
        .delete()
    }
  )
}

export async function duplicateReleaseSource(source: ReleaseSource) {
  const draft: ReleaseSourceDraft = {
    name: `${source.name} (copie)`,
    enabled: (source as unknown as Record<string, unknown>).enabled !== false,
    color: source.color,
    proxyImages:
      (source as unknown as Record<string, unknown>).proxyImages === true,
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
  return (source as unknown as Record<string, unknown>).enabled !== false
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
