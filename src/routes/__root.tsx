import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { useEffect } from "react"
import { I18nextProvider, useTranslation } from "react-i18next"
import { TooltipProvider } from "@/components/ui/tooltip"
import i18n from "@/lib/i18n/i18n"

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
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        <I18nextProvider i18n={i18n}>
          <LanguageDocumentSync />
          <TooltipProvider>{children}</TooltipProvider>
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

function LanguageDocumentSync() {
  const { i18n: i18nInstance } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18nInstance.resolvedLanguage ?? "fr"
  }, [i18nInstance.resolvedLanguage])

  return null
}
