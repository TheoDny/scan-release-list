import { createServerFn } from "@tanstack/react-start"

const maxImageBytes = 2_000_000

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
    const response = await fetch(data.imageUrl, {
      headers: {
        accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        referer: `${data.refererUrl}/`,
        "user-agent":
          "Mozilla/5.0 (compatible; ScanReleaseList/1.0; +https://localhost)",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const contentType = response.headers.get("content-type") ?? "image/webp"
    const bytes = Buffer.from(await response.arrayBuffer())

    if (bytes.byteLength > maxImageBytes) {
      throw new Error("Image trop volumineuse.")
    }

    return `data:${contentType};base64,${bytes.toString("base64")}`
  })
