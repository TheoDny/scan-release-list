import { parseReleaseHtml } from "@/lib/scanner/release-parser"
import { fetchReleaseSourceHtml } from "@/lib/scanner/source-html-fetcher"
import type { ReleaseSource } from "@/types/release-source.type"
import type { ScanSourceResult } from "@/types/scan-release.type"

export async function scanReleaseSource(
  source: ReleaseSource
): Promise<ScanSourceResult> {
  try {
    const html = await fetchReleaseSourceHtml(source.baseUrl, source.fetchMode)
    const items = parseReleaseHtml(html, source)

    return {
      sourceId: source.id,
      sourceName: source.name,
      scannedAt: new Date().toISOString(),
      items,
      ...(items.length === 0
        ? { error: "Aucun manga récupéré depuis cette source." }
        : {}),
    }
  } catch (error) {
    return {
      sourceId: source.id,
      sourceName: source.name,
      scannedAt: new Date().toISOString(),
      items: [],
      error:
        error instanceof Error
          ? error.message
          : "Impossible de scanner cette source.",
    }
  }
}
