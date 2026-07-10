import { createServerFn } from "@tanstack/react-start"

import {
  fetchWithTimeout,
  readResponseBytesWithLimit,
} from "@/lib/scanner/limited-response-reader"

const maxImageBytes = 2_000_000
const fetchTimeoutMs = 12_000
const allowedImageTypes = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
])

type FetchProxiedImageInput = {
  imageUrl: string
  refererUrl: string
}

export const fetchProxiedImage = createServerFn({ method: "POST" })
  .validator((data: FetchProxiedImageInput) => {
    const imageUrl = new URL(data.imageUrl)
    const refererUrl = new URL(data.refererUrl)

    if (
      !["http:", "https:"].includes(imageUrl.protocol) ||
      !["http:", "https:"].includes(refererUrl.protocol)
    ) {
      throw new Error("Seules les URLs http/https sont acceptées.")
    }

    return {
      imageUrl: imageUrl.toString(),
      refererUrl: refererUrl.origin,
    }
  })
  .handler(async ({ data }) => {
    const response = await fetchWithTimeout(data.imageUrl, {
      timeoutMs: fetchTimeoutMs,
      headers: {
        accept:
          "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.8",
        referer: `${data.refererUrl}/`,
        "user-agent":
          "Mozilla/5.0 (compatible; ScanReleaseList/1.0; +https://localhost)",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const contentType = normalizedImageContentType(
      response.headers.get("content-type")
    )
    if (!contentType) {
      throw new Error("Type d'image non supporté.")
    }

    const bytes = await readResponseBytesWithLimit(
      response,
      maxImageBytes,
      "Image trop volumineuse."
    )

    return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`
  })

function normalizedImageContentType(contentType: string | null) {
  const normalizedContentType = contentType?.split(";")[0]?.trim().toLowerCase()

  return normalizedContentType && allowedImageTypes.has(normalizedContentType)
    ? normalizedContentType
    : undefined
}
