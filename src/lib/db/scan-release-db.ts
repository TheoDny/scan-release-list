import Dexie from "dexie"
import type { Table } from "dexie"

import type { HiddenRelease } from "@/types/hidden-release.type"
import type { ReleaseSource } from "@/types/release-source.type"

export class ScanReleaseDb extends Dexie {
  sources!: Table<ReleaseSource, string>
  hiddenReleases!: Table<HiddenRelease, string>

  constructor() {
    super("scan-release-list")

    this.version(1).stores({
      sources: "id, name, baseUrl, updatedAt",
      hiddenReleases: "id, itemId, sourceId, createdAt",
    })
  }
}

export const scanReleaseDb = new ScanReleaseDb()
