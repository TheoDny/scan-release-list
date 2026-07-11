import {
  fetchWithTimeout,
  readResponseBytesWithLimit,
} from "@/lib/scanner/limited-response-reader"

const maxHtmlLength = 4_000_000
const fetchTimeoutMs = 12_000
const acceptedHtmlTypes = ["text/html", "application/xhtml+xml"]

export async function fetchBrowserHtml(url: string) {
  const normalizedUrl = normalizeHttpUrl(url)
  const response = await fetchWithTimeout(normalizedUrl, {
    mode: "cors",
    timeoutMs: fetchTimeoutMs,
    headers: {
      accept: "text/html,application/xhtml+xml",
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const contentType = response.headers.get("content-type")
  if (contentType && !isAcceptedHtmlType(contentType)) {
    throw new Error("La réponse n'est pas du HTML.")
  }

  const bytes = await readResponseBytesWithLimit(
    response,
    maxHtmlLength,
    "HTML trop volumineux."
  )

  return new TextDecoder().decode(bytes)
}

function normalizeHttpUrl(rawUrl: string) {
  const url = new URL(rawUrl)

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Seules les URLs http/https sont acceptées.")
  }

  return url.toString()
}

function isAcceptedHtmlType(contentType: string) {
  const normalizedContentType = contentType.split(";")[0]?.trim().toLowerCase()

  return (
    !normalizedContentType || acceptedHtmlTypes.includes(normalizedContentType)
  )
}
