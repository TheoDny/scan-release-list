import { useLiveQuery } from "dexie-react-hooks"

import { scanReleaseDb } from "@/lib/db/scan-release-db"
import { recentDistinctMangaVisits } from "@/lib/visited-releases/recent-visited-releases"

export function useReleaseSources() {
  return useLiveQuery(
    () => scanReleaseDb.sources.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  )
}

export function useHiddenReleaseIds() {
  const hiddenReleases = useLiveQuery(
    () => scanReleaseDb.hiddenReleases.toArray(),
    [],
    []
  )

  return new Set(hiddenReleases.map((release) => release.itemId))
}

export function useVisitedReleaseIds() {
  const visitedReleases = useLiveQuery(
    () => scanReleaseDb.visitedReleases.toArray(),
    [],
    []
  )

  return new Set(visitedReleases.map((release) => release.id))
}

export function useRecentVisitedReleases() {
  return useLiveQuery(
    async () =>
      recentDistinctMangaVisits(
        await scanReleaseDb.visitedReleases.toArray()
      ),
    [],
    []
  )
}
