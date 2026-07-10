import { fetchSourceHtml } from "@/lib/scanner/fetch-source-html"
import { parseReleaseHtml } from "@/lib/scanner/release-parser"
import type { ReleaseSource } from "@/types/release-source.type"
import type { ScanSourceResult } from "@/types/scan-release.type"

export async function scanReleaseSource(
  source: ReleaseSource
): Promise<ScanSourceResult> {
  try {
    const html = await fetchSourceHtml({ data: { url: source.baseUrl } })
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
