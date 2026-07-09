import { subMonths } from "date-fns"

import { scanReleaseDb } from "@/lib/db/scan-release-db"
import type { VisitedReleaseDraft } from "@/types/visited-release.type"

export function visitedReleaseId(sourceId: string, releaseUrl: string) {
  return encodeURIComponent(
    `${sourceId}|${normalizeReleaseUrl(releaseUrl)}`.toLowerCase()
  )
}

export async function markReleaseVisited(release: VisitedReleaseDraft) {
  await scanReleaseDb.visitedReleases.put({
    id: visitedReleaseId(release.sourceId, release.releaseUrl),
    sourceId: release.sourceId,
    releaseUrl: normalizeReleaseUrl(release.releaseUrl),
    mangaId: release.mangaId,
    mangaTitle: release.mangaTitle,
    chapterLabel: release.chapterLabel,
    visitedAt: new Date().toISOString(),
  })
}

export async function cleanExpiredVisitedReleases(referenceDate = new Date()) {
  const cutoff = subMonths(referenceDate, 2).toISOString()

  return scanReleaseDb.visitedReleases
    .where("visitedAt")
    .below(cutoff)
    .delete()
}

function normalizeReleaseUrl(releaseUrl: string) {
  try {
    const url = new URL(releaseUrl)
    url.hash = ""
    return url.toString()
  } catch {
    return releaseUrl.trim()
  }
}
