import type { Table } from "dexie"
import Dexie from "dexie"

import type { HiddenRelease } from "@/types/hidden-release.type"
import type { ReleaseLock } from "@/types/release-lock.type"
import type { ReleaseSource } from "@/types/release-source.type"
import type { VisitedRelease } from "@/types/visited-release.type"

export class ScanReleaseDb extends Dexie {
  sources!: Table<ReleaseSource, string>
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
  }
}

export const scanReleaseDb = new ScanReleaseDb()
