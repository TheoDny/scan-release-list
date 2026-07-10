import { createServerFn } from "@tanstack/react-start"

import {
  fetchWithTimeout,
  readResponseBytesWithLimit,
} from "@/lib/scanner/limited-response-reader"

const maxHtmlLength = 4_000_000
const fetchTimeoutMs = 12_000
const acceptedHtmlTypes = ["text/html", "application/xhtml+xml"]

type FetchSourceHtmlInput = {
  url: string
}

export const fetchSourceHtml = createServerFn({ method: "POST" })
  .validator((data: FetchSourceHtmlInput) => {
    const url = new URL(data.url)

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Seules les URLs http/https sont acceptées.")
    }

    return {
      url: url.toString(),
    }
  })
  .handler(async ({ data }) => {
    const response = await fetchWithTimeout(data.url, {
      timeoutMs: fetchTimeoutMs,
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "Mozilla/5.0 (compatible; ScanReleaseList/1.0; +https://localhost)",
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
  })

function isAcceptedHtmlType(contentType: string) {
  const normalizedContentType = contentType.split(";")[0]?.trim().toLowerCase()

  return (
    !normalizedContentType || acceptedHtmlTypes.includes(normalizedContentType)
  )
}
