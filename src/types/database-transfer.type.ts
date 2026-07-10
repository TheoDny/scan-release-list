import type { HiddenRelease } from "@/types/hidden-release.type"
import type { ReleaseLock } from "@/types/release-lock.type"
import type { ReleaseSource } from "@/types/release-source.type"
import type { VisitedRelease } from "@/types/visited-release.type"

export type DatabaseExportOptions = {
  sourceIds: string[]
  includeSources: boolean
  includeHiddenReleases: boolean
  includeReleaseLocks: boolean
  includeVisitedReleases: boolean
}

export type DatabaseExport = {
  version: 1
  exportedAt: string
  data: {
    sources?: ReleaseSource[]
    hiddenReleases?: HiddenRelease[]
    releaseLocks?: ReleaseLock[]
    visitedReleases?: VisitedRelease[]
  }
}

export type DatabaseImportSummary = {
  sources: number
  hiddenReleases: number
  releaseLocks: number
  visitedReleases: number
}
