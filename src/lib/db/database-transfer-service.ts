import { scanReleaseDb } from "@/lib/db/scan-release-db"
import type {
  DatabaseExport,
  DatabaseExportOptions,
  DatabaseImportSummary,
} from "@/types/database-transfer.type"
import type { HiddenRelease } from "@/types/hidden-release.type"
import type { ReleaseSource } from "@/types/release-source.type"
import type { VisitedRelease } from "@/types/visited-release.type"

export async function exportDatabase(
  options: DatabaseExportOptions
): Promise<DatabaseExport> {
  const sourceIds = new Set(options.sourceIds)
  const [sources, hiddenReleases, visitedReleases] = await Promise.all([
    options.includeSources ? scanReleaseDb.sources.toArray() : [],
    options.includeHiddenReleases
      ? scanReleaseDb.hiddenReleases.toArray()
      : [],
    options.includeVisitedReleases
      ? scanReleaseDb.visitedReleases.toArray()
      : [],
  ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      ...(options.includeSources
        ? { sources: sources.filter((source) => sourceIds.has(source.id)) }
        : {}),
      ...(options.includeHiddenReleases
        ? {
            hiddenReleases: hiddenReleases.filter((release) =>
              sourceIds.has(release.sourceId)
            ),
          }
        : {}),
      ...(options.includeVisitedReleases
        ? {
            visitedReleases: visitedReleases.filter((release) =>
              sourceIds.has(release.sourceId)
            ),
          }
        : {}),
    },
  }
}

export async function importDatabase(
  serializedExport: string
): Promise<DatabaseImportSummary> {
  const parsed: unknown = JSON.parse(serializedExport)
  const databaseExport = parseDatabaseExport(parsed)
  const sources = databaseExport.data.sources ?? []
  const hiddenReleases = databaseExport.data.hiddenReleases ?? []
  const visitedReleases = databaseExport.data.visitedReleases ?? []

  await scanReleaseDb.transaction(
    "rw",
    scanReleaseDb.sources,
    scanReleaseDb.hiddenReleases,
    scanReleaseDb.visitedReleases,
    async () => {
      await scanReleaseDb.sources.bulkPut(sources)
      await scanReleaseDb.hiddenReleases.bulkPut(hiddenReleases)
      await scanReleaseDb.visitedReleases.bulkPut(visitedReleases)
    }
  )

  return {
    sources: sources.length,
    hiddenReleases: hiddenReleases.length,
    visitedReleases: visitedReleases.length,
  }
}

function parseDatabaseExport(value: unknown): DatabaseExport {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.data)) {
    throw new Error("Ce fichier n'est pas un export valide.")
  }

  return {
    version: 1,
    exportedAt:
      typeof value.exportedAt === "string"
        ? value.exportedAt
        : new Date().toISOString(),
    data: {
      ...(value.data.sources
        ? { sources: parseRecords(value.data.sources, isReleaseSource) }
        : {}),
      ...(value.data.hiddenReleases
        ? {
            hiddenReleases: parseRecords(
              value.data.hiddenReleases,
              isHiddenRelease
            ),
          }
        : {}),
      ...(value.data.visitedReleases
        ? {
            visitedReleases: parseRecords(
              value.data.visitedReleases,
              isVisitedRelease
            ),
          }
        : {}),
    },
  }
}

function parseRecords<T>(
  value: unknown,
  guard: (record: unknown) => record is T
) {
  if (!Array.isArray(value) || !value.every(guard)) {
    throw new Error("Le fichier contient des données invalides.")
  }

  return value
}

function isReleaseSource(value: unknown): value is ReleaseSource {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.baseUrl === "string" &&
    typeof value.releaseParentSelector === "string" &&
    Array.isArray(value.releaseSelectors)
  )
}

function isHiddenRelease(value: unknown): value is HiddenRelease {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.itemId === "string" &&
    typeof value.sourceId === "string"
  )
}

function isVisitedRelease(value: unknown): value is VisitedRelease {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.sourceId === "string" &&
    typeof value.releaseUrl === "string" &&
    typeof value.visitedAt === "string"
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
