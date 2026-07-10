import type { VisitedRelease } from "@/types/visited-release.type"

export function recentDistinctMangaVisits(
  visits: VisitedRelease[],
  limit = 10
) {
  const mangaIds = new Set<string>()

  return visits
    .filter(
      (visit) => visit.mangaId && visit.mangaTitle && visit.chapterLabel
    )
    .sort((left, right) => Date.parse(right.visitedAt) - Date.parse(left.visitedAt))
    .filter((visit) => {
      if (!visit.mangaId || mangaIds.has(visit.mangaId)) {
        return false
      }

      mangaIds.add(visit.mangaId)
      return true
    })
    .slice(0, limit)
}
