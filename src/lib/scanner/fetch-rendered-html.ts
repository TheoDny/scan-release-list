import { createServerFn } from "@tanstack/react-start"
import type { Browser, BrowserContext, LaunchOptions } from "playwright-core"

const maxHtmlLength = 4_000_000
const navigationTimeoutMs = 12_000
const networkIdleTimeoutMs = 4_000
const postRenderDelayMs = 1_000
const acceptedHtmlTypes = ["text/html", "application/xhtml+xml"]

type FetchRenderedHtmlInput = {
  url: string
}

export const fetchRenderedHtml = createServerFn({ method: "POST" })
  .validator((data: FetchRenderedHtmlInput) => {
    const url = new URL(data.url)

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Seules les URLs http/https sont acceptées.")
    }

    return {
      url: url.toString(),
    }
  })
  .handler(async ({ data }) => {
    const { chromium: playwrightChromium } = await import("playwright-core")
    let browser: Browser | undefined
    let context: BrowserContext | undefined

    try {
      browser = await playwrightChromium.launch(await browserLaunchOptions())
      context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      })

      const page = await context.newPage()
      const response = await page.goto(data.url, {
        timeout: navigationTimeoutMs,
        waitUntil: "domcontentloaded",
      })

      if (!response) {
        throw new Error("Aucune réponse reçue.")
      }

      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}`)
      }

      const contentType = response.headers()["content-type"]
      if (contentType && !isAcceptedHtmlType(contentType)) {
        throw new Error("La réponse n'est pas du HTML.")
      }

      await page
        .waitForLoadState("networkidle", { timeout: networkIdleTimeoutMs })
        .catch(() => undefined)
      await page.waitForTimeout(postRenderDelayMs)

      const html = await page.content()
      if (new TextEncoder().encode(html).byteLength > maxHtmlLength) {
        throw new Error("HTML trop volumineux.")
      }

      return html
    } finally {
      await context?.close().catch(() => undefined)
      await browser?.close().catch(() => undefined)
    }
  })

function isAcceptedHtmlType(contentType: string) {
  const normalizedContentType = contentType.split(";")[0]?.trim().toLowerCase()

  return (
    !normalizedContentType || acceptedHtmlTypes.includes(normalizedContentType)
  )
}

async function browserLaunchOptions(): Promise<LaunchOptions> {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

  if (executablePath) {
    return {
      executablePath,
      headless: true,
    }
  }

  if (isServerlessRuntime()) {
    const chromium = (await import("@sparticuz/chromium")).default

    return {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }
  }

  return {
    channel: process.platform === "win32" ? "msedge" : "chrome",
    headless: true,
  }
}

function isServerlessRuntime() {
  return Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV
  )
}
