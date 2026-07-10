import { AlertCircleIcon, EyeIcon, LoaderCircleIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { ProxiedCoverImage } from "@/components/releases/proxied-cover-image"
import { VisualSelectorPreview } from "@/components/releases/visual-selector-preview"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { translateError } from "@/lib/i18n/translate-error"
import {
  normalizeSourceColor,
  sourceColorStyle,
} from "@/lib/release-sources/source-color"
import { fetchSourceHtml } from "@/lib/scanner/fetch-source-html"
import { defaultReleaseDateFormats } from "@/lib/scanner/release-date-parser"
import { parseReleaseHtml } from "@/lib/scanner/release-parser"
import type { ReleaseSourceDraft } from "@/types/release-source.type"
import type { ScanReleaseItem } from "@/types/scan-release.type"
import type {
  FocusedSelectorPreview,
  SelectorTarget,
} from "@/types/selector-preview.type"

type SourcePreviewProps = {
  draft: ReleaseSourceDraft
  focusedSelector?: FocusedSelectorPreview
  onSelectorSelected: (target: SelectorTarget, selector: string) => void
}

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "parsing" }
  | { status: "ready"; item?: ScanReleaseItem }
  | { status: "error"; message: string }

export function SourcePreview({
  draft,
  focusedSelector,
  onSelectorSelected,
}: SourcePreviewProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<PreviewState>({ status: "idle" })
  const [html, setHtml] = useState("")
  const normalizedDraft = useMemo(
    () => normalizePreviewDraft(draft, t("preview.title")),
    [draft, t]
  )

  useEffect(() => {
    if (!normalizedDraft.baseUrl) {
      setState({ status: "idle" })
      setHtml("")
      return
    }

    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      setState({ status: "loading" })

      try {
        const sourceHtml = await fetchSourceHtml({
          data: { url: normalizedDraft.baseUrl },
        })

        if (!cancelled) {
          setHtml(sourceHtml)
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : t("preview.generationFailed"),
          })
        }
      }
    }, 450)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [normalizedDraft.baseUrl])

  useEffect(() => {
    if (!canPreview(normalizedDraft)) {
      setState({ status: normalizedDraft.baseUrl ? "parsing" : "idle" })
      return
    }

    if (!html) {
      return
    }

    try {
      const items = parseReleaseHtml(html, {
        ...normalizedDraft,
        id: "preview-source",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      setState({ status: "ready", item: items[0] })
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : t("preview.selectorsFailed"),
      })
    }
  }, [html, normalizedDraft])

  return (
    <aside className="flex max-h-[76svh] min-h-[520px] flex-col gap-3 overflow-hidden rounded-lg border bg-muted/20 p-4 lg:sticky lg:top-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("preview.title")}</p>
          <p className="text-xs text-muted-foreground">
            {t("preview.firstManga")}
          </p>
        </div>
        <Badge variant="secondary">
          {state.status === "ready" && state.item
            ? t("common.ok")
            : t("common.live")}
        </Badge>
      </div>

      <Tabs defaultValue="result" className="min-h-0 flex-1">
        <TabsList className="w-full">
          <TabsTrigger value="result">{t("preview.resultTab")}</TabsTrigger>
          <TabsTrigger value="selector" disabled={!html}>
            {t("preview.selectorTab")}
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="result"
          className="flex min-h-0 flex-1 items-start overflow-y-auto"
        >
          {state.status === "idle" ? <PreviewEmpty /> : null}
          {state.status === "loading" || state.status === "parsing" ? (
            <PreviewLoading />
          ) : null}
          {state.status === "error" ? (
            <PreviewError message={translateError(state.message, t)} />
          ) : null}
          {state.status === "ready" ? (
            state.item ? (
              <PreviewCard item={state.item} />
            ) : (
              <PreviewError message={t("preview.noManga")} />
            )
          ) : null}
        </TabsContent>
        <TabsContent value="selector" className="flex min-h-0 flex-1">
          {html ? (
            <VisualSelectorPreview
              html={html}
              baseUrl={normalizedDraft.baseUrl}
              parentSelector={normalizedDraft.releaseParentSelector}
              focusedSelector={focusedSelector}
              onSelect={onSelectorSelected}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </aside>
  )
}

function PreviewCard({ item }: { item: ScanReleaseItem }) {
  return (
    <article
      className="grid w-full min-w-0 grid-cols-[92px_1fr] gap-3 rounded-lg border p-2"
      style={sourceColorStyle(item.sourceColor)}
    >
      <a
        className="block aspect-[3/4] overflow-hidden rounded-md border bg-muted"
        href={item.mangaUrl}
        target="_blank"
        rel="noreferrer"
      >
        {item.imageUrl ? (
          <ProxiedCoverImage
            alt={item.title}
            imageUrl={item.imageUrl}
            refererUrl={item.mangaUrl ?? item.imageUrl}
            useProxy={item.proxyImages}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
            {item.sourceName}
          </div>
        )}
      </a>

      <div className="flex min-w-0 flex-col gap-2">
        <a
          className="truncate text-sm leading-tight font-semibold hover:underline"
          href={item.mangaUrl}
          target="_blank"
          rel="noreferrer"
          title={item.title}
        >
          {item.title}
        </a>

        <div className="flex flex-col gap-1.5">
          {item.releases.map((release) => (
            <a
              className="grid grid-cols-[1fr_auto] items-baseline gap-3 text-sm hover:underline"
              href={release.url}
              key={release.id}
              target="_blank"
              rel="noreferrer"
            >
              <span className="min-w-0 truncate before:mr-2 before:text-muted-foreground before:content-['»']">
                {release.label}
              </span>
              {release.timeLabel ? (
                <span className="text-xs whitespace-nowrap text-muted-foreground italic">
                  {release.timeLabel}
                </span>
              ) : null}
            </a>
          ))}
        </div>
      </div>
    </article>
  )
}

function PreviewEmpty() {
  const { t } = useTranslation()

  return (
    <Empty className="min-h-full border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <EyeIcon />
        </EmptyMedia>
        <EmptyTitle>{t("preview.waitingTitle")}</EmptyTitle>
        <EmptyDescription>{t("preview.waitingDescription")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function PreviewLoading() {
  const { t } = useTranslation()

  return (
    <Empty className="min-h-full border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LoaderCircleIcon className="animate-spin" />
        </EmptyMedia>
        <EmptyTitle>{t("preview.loadingTitle")}</EmptyTitle>
        <EmptyDescription>{t("preview.loadingDescription")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function PreviewError({ message }: { message: string }) {
  const { t } = useTranslation()

  return (
    <Empty className="min-h-full border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertCircleIcon />
        </EmptyMedia>
        <EmptyTitle>{t("preview.unavailable")}</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function canPreview(draft: ReleaseSourceDraft) {
  return (
    draft.baseUrl.length > 0 &&
    draft.releaseParentSelector.length > 0 &&
    draft.titleSelector.length > 0 &&
    draft.mangaLinkSelector.length > 0 &&
    draft.releaseSelectors.some(
      (selector) =>
        selector.linkSelector.length > 0 && selector.textSelectors.length > 0
    )
  )
}

function normalizePreviewDraft(
  draft: ReleaseSourceDraft,
  previewName: string
): ReleaseSourceDraft {
  return {
    ...draft,
    name: draft.name.trim() || previewName,
    color: normalizeSourceColor(draft.color),
    baseUrl: draft.baseUrl.trim(),
    releaseParentSelector: draft.releaseParentSelector.trim(),
    deleteSelectors: draft.deleteSelectors
      .map((item) => item.trim())
      .filter(Boolean),
    titleSelector: draft.titleSelector.trim(),
    imageSelector: draft.imageSelector.trim(),
    mangaLinkSelector: draft.mangaLinkSelector.trim(),
    dateFormats:
      draft.dateFormats.length > 0
        ? draft.dateFormats.map((item) => item.trim()).filter(Boolean)
        : defaultReleaseDateFormats(),
    releaseSelectors: draft.releaseSelectors.map((selector) => ({
      ...selector,
      linkSelector: selector.linkSelector.trim(),
      textSelectors: selector.textSelectors
        .map((textSelector) => textSelector.trim())
        .filter(Boolean),
      timeSelector: selector.timeSelector?.trim(),
    })),
  }
}
