import {
  AlertTriangleIcon,
  CopyIcon,
  DatabaseIcon,
  PlusIcon,
  RefreshCwIcon,
  Settings2Icon,
  Trash2Icon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { AppHelpPopover } from "@/components/app-help-popover"
import { LanguageToggle } from "@/components/language-toggle"
import { DatabaseTransferActions } from "@/components/releases/database-transfer-actions"
import { ReleaseGrid } from "@/components/releases/release-grid"
import { ReleaseHistory } from "@/components/releases/release-history"
import { SourceFormDialog } from "@/components/releases/source-form-dialog"
import { ScrollToTopButton } from "@/components/scroll-to-top-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useHiddenReleaseIds,
  useRecentVisitedReleases,
  useReleaseLocks,
  useReleaseSources,
  useVisitedReleaseIds,
} from "@/hooks/use-release-data"
import {
  hideReleaseItem,
  showReleaseItem,
} from "@/lib/hidden-releases/hidden-release-repository"
import { translateError } from "@/lib/i18n/translate-error"
import {
  setReleaseItemLockDelay,
  unlockReleaseItem,
} from "@/lib/release-locks/release-lock-repository"
import { adjustedReleaseTime } from "@/lib/release-locks/release-lock-time"
import { natomangaSourceDraft } from "@/lib/release-sources/default-source"
import {
  deleteReleaseSource,
  duplicateReleaseSource,
  isReleaseSourceEnabled,
  saveReleaseSource,
  setReleaseSourceEnabled,
} from "@/lib/release-sources/source-repository"
import { scanReleaseSource } from "@/lib/scanner/scan-service"
import {
  cleanExpiredVisitedReleases,
  markReleaseVisited,
} from "@/lib/visited-releases/visited-release-repository"
import type { ReleaseSource } from "@/types/release-source.type"
import type {
  ScanReleaseItem,
  ScanReleaseLink,
  ScanSourceResult,
} from "@/types/scan-release.type"

const scanConcurrency = 4

export function ReleaseDashboard() {
  const { t } = useTranslation()
  const sources = useReleaseSources()
  const hiddenIds = useHiddenReleaseIds()
  const releaseLocks = useReleaseLocks()
  const visitedIds = useVisitedReleaseIds()
  const recentVisits = useRecentVisitedReleases()
  const [results, setResults] = useState<ScanSourceResult[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editedSource, setEditedSource] = useState<ReleaseSource | undefined>()
  const [pendingHideIds, setPendingHideIds] = useState(() => new Set<string>())
  const hideTimers = useRef(new Map<string, number>())
  const scanRunId = useRef(0)
  const enabledSources = sources.filter(isReleaseSourceEnabled)

  async function scanAllSources() {
    const runId = scanRunId.current + 1
    scanRunId.current = runId

    setIsScanning(true)
    setResults((current) =>
      current.filter((result) =>
        enabledSources.some((source) => source.id === result.sourceId)
      )
    )

    try {
      await scanSourcesWithConcurrency(enabledSources, async (result) => {
        if (scanRunId.current !== runId) {
          return
        }

        setResults((current) => [
          ...current.filter((item) => item.sourceId !== result.sourceId),
          result,
        ])
      })
    } finally {
      if (scanRunId.current === runId) {
        setIsScanning(false)
      }
    }
  }

  useEffect(() => {
    scanAllSources()
  }, [sources])

  useEffect(() => {
    void cleanExpiredVisitedReleases()
  }, [])

  const allItems = useMemo(
    () =>
      results
        .flatMap((result) => result.items)
        .sort(
          (left, right) =>
            releaseSortValue(right, releaseLocks.get(right.id)) -
            releaseSortValue(left, releaseLocks.get(left.id))
        ),
    [releaseLocks, results]
  )
  const visibleItems = useMemo(
    () =>
      showHidden
        ? allItems
        : allItems.filter((item) => !isHiddenReleaseItem(item, hiddenIds)),
    [allItems, hiddenIds, showHidden]
  )
  const errors = results.filter((result) => result.error)
  const errorsBySourceId = new Map(
    errors.map((result) => [result.sourceId, result.error])
  )

  async function addExampleSource() {
    await saveReleaseSource(natomangaSourceDraft)
  }

  function openSourceForm(source?: ReleaseSource) {
    setEditedSource(source)
    setIsFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setIsFormOpen(open)

    if (!open) {
      setEditedSource(undefined)
    }
  }

  async function handleToggleHidden(item: ScanReleaseItem, hidden: boolean) {
    if (hidden) {
      await showReleaseItem(item.id)
      return
    }

    if (pendingHideIds.has(item.id)) {
      cancelPendingHide(item.id)
      return
    }

    setPendingHideIds((current) => new Set(current).add(item.id))
    const timer = window.setTimeout(async () => {
      hideTimers.current.delete(item.id)
      setPendingHideIds((current) => {
        const next = new Set(current)
        next.delete(item.id)
        return next
      })
      await hideReleaseItem(item)
    }, 3000)

    hideTimers.current.set(item.id, timer)
  }

  function handleVisitRelease(item: ScanReleaseItem, release: ScanReleaseLink) {
    void markReleaseVisited({
      sourceId: item.sourceId,
      releaseUrl: release.url,
      mangaId: item.id,
      mangaTitle: item.title,
      chapterLabel: release.label,
    })
  }

  async function handleLockRelease(item: ScanReleaseItem, hours: number) {
    await setReleaseItemLockDelay(item, hours)
  }

  async function handleUnlockRelease(item: ScanReleaseItem) {
    await unlockReleaseItem(item.id)
  }

  function cancelPendingHide(itemId: string) {
    const timer = hideTimers.current.get(itemId)

    if (timer) {
      window.clearTimeout(timer)
      hideTimers.current.delete(itemId)
    }

    setPendingHideIds((current) => {
      const next = new Set(current)
      next.delete(itemId)
      return next
    })
  }

  return (
    <main className="min-h-svh max-w-dvw bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-1 py-2">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <img src="/M-logo.svg" alt="M" className="h-12 w-12" />
            <h1 className="text-2xl font-semibold tracking-normal">
              Scan Release List
            </h1>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              {t("header.showUnwanted")}
              <Switch
                checked={showHidden}
                size="sm"
                onCheckedChange={setShowHidden}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AppHelpPopover />
            <ThemeToggle />
            <LanguageToggle />
            <DatabaseTransferActions sources={sources} />
            <Button variant="outline" onClick={addExampleSource}>
              <DatabaseIcon data-icon="inline-start" />
              {t("header.example")}
            </Button>
            <Button variant="outline" onClick={() => openSourceForm()}>
              <PlusIcon data-icon="inline-start" />
              {t("header.source")}
            </Button>
            <Button
              disabled={enabledSources.length === 0 || isScanning}
              onClick={scanAllSources}
            >
              <RefreshCwIcon data-icon="inline-start" />
              {t("header.scan")}
            </Button>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <aside className="flex flex-col gap-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>{t("sources.title")}</CardTitle>
                <CardDescription>
                  {t("sources.count", { count: sources.length })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("sources.empty")}
                  </p>
                ) : (
                  sources.map((source) => (
                    <div
                      className="flex items-center gap-0.5 rounded-md border p-2"
                      key={source.id}
                    >
                      <a
                        href={source.baseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={
                          isReleaseSourceEnabled(source)
                            ? "min-w-0 flex-1"
                            : "min-w-0 flex-1 opacity-50"
                        }
                      >
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">
                            {source.name}
                          </p>
                          {errorsBySourceId.get(source.id) ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertTriangleIcon className="shrink-0 text-destructive" />
                                <span className="sr-only">
                                  {t("sources.scanError")}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {translateError(
                                  errorsBySourceId.get(source.id) ?? "",
                                  t
                                )}
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {source.baseUrl}
                        </p>
                      </a>
                      <Switch
                        aria-label={t(
                          isReleaseSourceEnabled(source)
                            ? "sources.disable"
                            : "sources.enable",
                          { name: source.name }
                        )}
                        checked={isReleaseSourceEnabled(source)}
                        size="sm"
                        onCheckedChange={(enabled) =>
                          void setReleaseSourceEnabled(source, enabled)
                        }
                      />
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                duplicateReleaseSource(
                                  source,
                                  t("sources.copySuffix")
                                )
                              }
                            />
                          }
                        >
                          <CopyIcon />
                          <span className="sr-only">
                            {t("common.duplicate")}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{t("common.duplicate")}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openSourceForm(source)}
                            />
                          }
                        >
                          <Settings2Icon />
                          <span className="sr-only">{t("common.edit")}</span>
                        </TooltipTrigger>
                        <TooltipContent>{t("common.edit")}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => deleteReleaseSource(source.id)}
                            />
                          }
                        >
                          <Trash2Icon />
                          <span className="sr-only">{t("common.delete")}</span>
                        </TooltipTrigger>
                        <TooltipContent>{t("common.delete")}</TooltipContent>
                      </Tooltip>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <ReleaseHistory visits={recentVisits} />
          </aside>

          <section className="min-w-0 rounded-lg bg-card px-0.5 py-4 text-card-foreground ring-1 ring-foreground/10 sm:px-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{t("releases.title")}</h2>
                <Badge variant="outline">
                  {t("releases.found", { count: allItems.length })}
                </Badge>
              </div>
              {isScanning ? (
                <Badge variant="secondary">{t("header.scanning")}</Badge>
              ) : null}
            </div>

            <ReleaseGrid
              hiddenIds={hiddenIds}
              items={visibleItems}
              lockDelayHoursByItemId={releaseLocks}
              pendingHideIds={pendingHideIds}
              onLockRelease={handleLockRelease}
              onToggleHidden={handleToggleHidden}
              onUnlockRelease={handleUnlockRelease}
              onVisitRelease={handleVisitRelease}
              visitedIds={visitedIds}
            />
          </section>
        </div>
      </section>

      <SourceFormDialog
        key={editedSource?.id ?? "new-source"}
        open={isFormOpen}
        source={editedSource}
        onOpenChange={handleFormOpenChange}
      />
      <ScrollToTopButton />
    </main>
  )
}

function releaseSortValue(
  item: ScanReleaseItem,
  lockDelayHours: number | undefined
) {
  return Math.max(
    ...item.releases.map(
      (release) => adjustedReleaseTime(release, lockDelayHours) ?? 0
    ),
    item.latestReleasedAt ? Date.parse(item.latestReleasedAt) : 0
  )
}

function isHiddenReleaseItem(item: ScanReleaseItem, hiddenIds: Set<string>) {
  return hiddenIds.has(item.id)
}

async function scanSourcesWithConcurrency(
  sources: ReleaseSource[],
  onResult: (result: ScanSourceResult) => void
) {
  let nextIndex = 0

  async function worker() {
    while (nextIndex < sources.length) {
      const source = sources[nextIndex]
      nextIndex += 1

      onResult(await scanReleaseSource(source))
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(scanConcurrency, sources.length) }, () =>
      worker()
    )
  )
}
