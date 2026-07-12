import { DatabaseIcon, PlusIcon, RefreshCwIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { AppHelpPopover } from "@/components/app-help-popover"
import { LanguageToggle } from "@/components/language-toggle"
import { DatabaseTransferActions } from "@/components/releases/database-transfer-actions"
import { HiddenReleaseHistory } from "@/components/releases/hidden-release-history"
import { ReleaseGrid } from "@/components/releases/release-grid"
import { ReleaseHistory } from "@/components/releases/release-history"
import { SourceFormDialog } from "@/components/releases/source-form-dialog"
import { ScrollToTopButton } from "@/components/scroll-to-top-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  useFavoriteReleaseIds,
  useHiddenReleaseIds,
  useRecentHiddenReleases,
  useRecentVisitedReleases,
  useReleaseLocks,
  useReleaseSources,
  useVisitedReleaseIds,
} from "@/hooks/use-release-data"
import {
  addFavoriteReleaseItem,
  removeFavoriteReleaseItem,
} from "@/lib/favorite-releases/favorite-release-repository"
import {
  hideReleaseItem,
  showReleaseItem,
} from "@/lib/hidden-releases/hidden-release-repository"
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
import { SourceListCard } from "@/components/releases/source-list-card"

const scanConcurrency = 4

export function ReleaseDashboard() {
  const { t } = useTranslation()
  const sources = useReleaseSources()
  const favoriteIds = useFavoriteReleaseIds()
  const hiddenIds = useHiddenReleaseIds()
  const recentHiddenReleases = useRecentHiddenReleases()
  const releaseLocks = useReleaseLocks()
  const visitedIds = useVisitedReleaseIds()
  const recentVisits = useRecentVisitedReleases()
  const [results, setResults] = useState<ScanSourceResult[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanningSourceIds, setScanningSourceIds] = useState(
    () => new Set<string>()
  )
  const [sourceFetchDurations, setSourceFetchDurations] = useState(
    () => new Map<string, number>()
  )
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
    setScanningSourceIds((current) => {
      const next = new Set(current)
      enabledSources.forEach((source) => next.add(source.id))
      return next
    })
    setResults((current) =>
      current.filter((result) =>
        enabledSources.some((source) => source.id === result.sourceId)
      )
    )

    try {
      await scanSourcesWithConcurrency(
        enabledSources,
        async (result, durationMs) => {
          if (scanRunId.current !== runId) {
            return
          }

          setSourceFetchDurations((current) =>
            new Map(current).set(result.sourceId, durationMs)
          )
          setScanningSourceIds((current) => {
            const next = new Set(current)
            next.delete(result.sourceId)
            return next
          })
          setResults((current) => [
            ...current.filter((item) => item.sourceId !== result.sourceId),
            result,
          ])
        }
      )
    } finally {
      if (scanRunId.current === runId) {
        setIsScanning(false)
        setScanningSourceIds((current) => {
          const next = new Set(current)
          enabledSources.forEach((source) => next.delete(source.id))
          return next
        })
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

  async function scanOneSource(source: ReleaseSource) {
    setScanningSourceIds((current) => new Set(current).add(source.id))
    const startedAt = performance.now()

    try {
      const result = await scanReleaseSource(source)
      const durationMs = performance.now() - startedAt
      setSourceFetchDurations((current) =>
        new Map(current).set(source.id, durationMs)
      )
      setResults((current) => [
        ...current.filter((item) => item.sourceId !== source.id),
        result,
      ])
    } finally {
      setScanningSourceIds((current) => {
        const next = new Set(current)
        next.delete(source.id)
        return next
      })
    }
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
    }, 2000)

    hideTimers.current.set(item.id, timer)
  }

  async function handleToggleFavorite(
    item: ScanReleaseItem,
    favorite: boolean
  ) {
    if (favorite) {
      await removeFavoriteReleaseItem(item.id)
      return
    }

    await addFavoriteReleaseItem(item)
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

  function handleRestoreHiddenRelease(itemId: string) {
    void showReleaseItem(itemId)
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
            <SourceListCard
              errorsBySourceId={errorsBySourceId}
              scanningSourceIds={scanningSourceIds}
              sourceFetchDurations={sourceFetchDurations}
              sources={sources}
              onDeleteSource={(sourceId) => void deleteReleaseSource(sourceId)}
              onDuplicateSource={(source) =>
                void duplicateReleaseSource(source, t("sources.copySuffix"))
              }
              onEditSource={openSourceForm}
              onScanSource={(source) => void scanOneSource(source)}
              onSetSourceEnabled={(source, enabled) =>
                void setReleaseSourceEnabled(source, enabled)
              }
            />

            <ReleaseHistory visits={recentVisits} />
            <HiddenReleaseHistory
              releases={recentHiddenReleases}
              onRestore={handleRestoreHiddenRelease}
            />
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
              favoriteIds={favoriteIds}
              hiddenIds={hiddenIds}
              items={visibleItems}
              lockDelayHoursByItemId={releaseLocks}
              pendingHideIds={pendingHideIds}
              onLockRelease={handleLockRelease}
              onToggleFavorite={handleToggleFavorite}
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
  onResult: (result: ScanSourceResult, durationMs: number) => void
) {
  let nextIndex = 0

  async function worker() {
    while (nextIndex < sources.length) {
      const source = sources[nextIndex]
      nextIndex += 1

      const startedAt = performance.now()
      const result = await scanReleaseSource(source)
      onResult(result, performance.now() - startedAt)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(scanConcurrency, sources.length) }, () =>
      worker()
    )
  )
}
