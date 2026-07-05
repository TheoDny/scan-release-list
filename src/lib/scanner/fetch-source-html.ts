import { createServerFn } from "@tanstack/react-start"

const maxHtmlLength = 4_000_000

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
    const response = await fetch(data.url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "Mozilla/5.0 (compatible; ScanReleaseList/1.0; +https://localhost)",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    return html.slice(0, maxHtmlLength)
  })
