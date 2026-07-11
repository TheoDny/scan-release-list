import type { FavoriteRelease } from "@/types/favorite-release.type"
import type { HiddenRelease } from "@/types/hidden-release.type"
import type { ReleaseLock } from "@/types/release-lock.type"
import type { ReleaseSource } from "@/types/release-source.type"
import type { VisitedRelease } from "@/types/visited-release.type"

export type DatabaseExportOptions = {
  sourceIds: string[]
  includeSources: boolean
  includeFavoriteReleases: boolean
  includeHiddenReleases: boolean
  includeReleaseLocks: boolean
  includeVisitedReleases: boolean
}

export type DatabaseExport = {
  version: 1
  exportedAt: string
  data: {
    sources?: ReleaseSource[]
    favoriteReleases?: FavoriteRelease[]
    hiddenReleases?: HiddenRelease[]
    releaseLocks?: ReleaseLock[]
    visitedReleases?: VisitedRelease[]
  }
}

export type DatabaseImportSummary = {
  sources: number
  favoriteReleases: number
  hiddenReleases: number
  releaseLocks: number
  visitedReleases: number
}
