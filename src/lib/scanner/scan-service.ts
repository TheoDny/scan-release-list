import { parseReleaseHtml } from "@/lib/scanner/release-parser"
import type { ReleaseSource } from "@/types/release-source.type"
import type { ScanSourceResult } from "@/types/scan-release.type"

export async function scanReleaseSource(
  source: ReleaseSource
): Promise<ScanSourceResult> {
  try {
    const response = await fetch(source.baseUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    return {
      sourceId: source.id,
      sourceName: source.name,
      scannedAt: new Date().toISOString(),
      items: parseReleaseHtml(html, source),
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
