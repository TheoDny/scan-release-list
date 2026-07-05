import { scanReleaseDb } from "@/lib/db/scan-release-db"
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
