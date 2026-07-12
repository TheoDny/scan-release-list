import { fetchBrowserHtml } from "@/lib/scanner/fetch-browser-html"
import { fetchRenderedHtml } from "@/lib/scanner/fetch-rendered-html"
import { fetchSourceHtml } from "@/lib/scanner/fetch-source-html"
import type { ReleaseFetchMode } from "@/types/release-source.type"

export async function fetchReleaseSourceHtml(
  url: string,
  fetchMode: ReleaseFetchMode
) {
  if (fetchMode === "browser") {
    return fetchBrowserHtml(url)
  }

  if (fetchMode === "rendered") {
    return fetchRenderedHtml({ data: { url } })
  }

  return fetchSourceHtml({ data: { url } })
}
