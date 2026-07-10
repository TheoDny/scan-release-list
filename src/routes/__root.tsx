import {
  ThemeProvider,
  themeStorageKey,
} from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import i18n, {
  isAppLanguage,
  languageStorageKey,
} from "@/lib/i18n/i18n"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { useEffect } from "react"
import { I18nextProvider, useTranslation } from "react-i18next"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Scan Release List",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  const { t } = useTranslation()

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{t("notFound.title")}</h1>
      <p>{t("notFound.description")}</p>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
        <HeadContent />
      </head>
      <body>
        <I18nextProvider i18n={i18n}>
          <LanguageDocumentSync />
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </I18nextProvider>
        <Scripts />
      </body>
    </html>
  )
}

const themeInitializationScript = `
  try {
    var theme = localStorage.getItem("${themeStorageKey}");
    document.documentElement.classList.toggle("dark", theme !== "light");
  } catch (_) {
    document.documentElement.classList.add("dark");
  }
`

function LanguageDocumentSync() {
  const { i18n: i18nInstance } = useTranslation()

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(languageStorageKey)

    if (
      isAppLanguage(storedLanguage) &&
      storedLanguage !== i18nInstance.resolvedLanguage
    ) {
      void i18nInstance.changeLanguage(storedLanguage)
    }
  }, [i18nInstance])

  useEffect(() => {
    document.documentElement.lang = i18nInstance.resolvedLanguage ?? "fr"
  }, [i18nInstance.resolvedLanguage])

  return null
}
