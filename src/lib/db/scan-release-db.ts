import type { Table } from "dexie"
import Dexie from "dexie"

import type { FavoriteRelease } from "@/types/favorite-release.type"
import type { HiddenRelease } from "@/types/hidden-release.type"
import type { ReleaseLock } from "@/types/release-lock.type"
import type { ReleaseSource } from "@/types/release-source.type"
import type { VisitedRelease } from "@/types/visited-release.type"

export class ScanReleaseDb extends Dexie {
  sources!: Table<ReleaseSource, string>
  favoriteReleases!: Table<FavoriteRelease, string>
  hiddenReleases!: Table<HiddenRelease, string>
  releaseLocks!: Table<ReleaseLock, string>
  visitedReleases!: Table<VisitedRelease, string>

  constructor() {
    super("scan-release-list")

    this.version(1).stores({
      sources: "id, name, baseUrl, updatedAt",
      hiddenReleases: "id, itemId, sourceId, createdAt",
      releaseLocks: "id, itemId, sourceId, updatedAt",
      visitedReleases: "id, sourceId, releaseUrl, visitedAt",
    })

    this.version(2).stores({
      sources: "id, name, baseUrl, updatedAt",
      favoriteReleases: "id, itemId, sourceId, createdAt",
      hiddenReleases: "id, itemId, sourceId, createdAt",
      releaseLocks: "id, itemId, sourceId, updatedAt",
      visitedReleases: "id, sourceId, releaseUrl, visitedAt",
    })
  }
}

export const scanReleaseDb = new ScanReleaseDb()
