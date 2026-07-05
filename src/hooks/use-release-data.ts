import { useLiveQuery } from "dexie-react-hooks"

import { scanReleaseDb } from "@/lib/db/scan-release-db"

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
