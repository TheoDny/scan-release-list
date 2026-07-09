import { useWindowVirtualizer } from "@tanstack/react-virtual"
import { LibraryIcon, LoaderCircleIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { ReleaseCard } from "@/components/releases/release-card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type {
  ScanReleaseItem,
  ScanReleaseLink,
} from "@/types/scan-release.type"

const releaseBatchSize = 20
const desktopMediaQuery = "(min-width: 1024px)"

type ReleaseGridProps = {
  items: ScanReleaseItem[]
  hiddenIds: Set<string>
  visitedIds: Set<string>
  pendingHideIds: Set<string>
  onToggleHidden: (item: ScanReleaseItem, hidden: boolean) => void
  onVisitRelease: (item: ScanReleaseItem, release: ScanReleaseLink) => void
}

export function ReleaseGrid({
  items,
  hiddenIds,
  visitedIds,
  pendingHideIds,
  onToggleHidden,
  onVisitRelease,
}: ReleaseGridProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [columnCount, setColumnCount] = useState(1)
  const [loadedItemCount, setLoadedItemCount] = useState(releaseBatchSize)
  const [scrollMargin, setScrollMargin] = useState(0)
  const loadedItems = useMemo(
    () => items.slice(0, loadedItemCount),
    [items, loadedItemCount]
  )
  const rows = useMemo(
    () => chunkItems(loadedItems, columnCount),
    [columnCount, loadedItems]
  )
  const hasMore = loadedItemCount < items.length
  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length + (hasMore ? 1 : 0),
    estimateSize: () => 148,
    overscan: 4,
    scrollMargin,
  })
  const virtualRows = rowVirtualizer.getVirtualItems()

  useEffect(() => {
    setLoadedItemCount(releaseBatchSize)
  }, [items])

  useEffect(() => {
    const mediaQuery = window.matchMedia(desktopMediaQuery)
    const updateColumnCount = () => setColumnCount(mediaQuery.matches ? 2 : 1)

    updateColumnCount()
    mediaQuery.addEventListener("change", updateColumnCount)
    return () => mediaQuery.removeEventListener("change", updateColumnCount)
  }, [])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const updateScrollMargin = () => {
      setScrollMargin(container.getBoundingClientRect().top + window.scrollY)
    }
    const observer = new ResizeObserver(updateScrollMargin)

    updateScrollMargin()
    observer.observe(container)
    window.addEventListener("resize", updateScrollMargin)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateScrollMargin)
    }
  }, [])

  useEffect(() => {
    if (virtualRows.length === 0) {
      return
    }

    const lastVirtualRow = virtualRows[virtualRows.length - 1]

    if (lastVirtualRow.index >= rows.length - 1 && hasMore) {
      setLoadedItemCount((current) =>
        Math.min(current + releaseBatchSize, items.length)
      )
    }
  }, [hasMore, items.length, rows.length, virtualRows])

  if (items.length === 0) {
    return (
      <Empty className="min-h-[360px] border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LibraryIcon />
          </EmptyMedia>
          <EmptyTitle>{t("releases.emptyTitle")}</EmptyTitle>
          <EmptyDescription>
            {t("releases.emptyDescription")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div ref={containerRef}>
      <div
        className="relative w-full"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index]
          const isLoaderRow = virtualRow.index >= rows.length

          return (
            <div
              className="absolute top-0 left-0 w-full pb-2"
              data-index={virtualRow.index}
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              style={{
                transform: `translateY(${
                  virtualRow.start - rowVirtualizer.options.scrollMargin
                }px)`,
              }}
            >
              {isLoaderRow ? (
                <div
                  className="flex h-20 items-center justify-center gap-2 text-sm text-muted-foreground"
                  role="status"
                >
                  <LoaderCircleIcon className="animate-spin" />
                  {t("releases.loadingMore")}
                </div>
              ) : (
                <div className="grid gap-x-4 gap-y-2 lg:grid-cols-2">
                  {row.map((item) => (
                    <ReleaseCard
                      hidden={hiddenIds.has(item.id)}
                      item={item}
                      key={item.id}
                      pendingHide={pendingHideIds.has(item.id)}
                      onToggleHidden={onToggleHidden}
                      onVisitRelease={onVisitRelease}
                      visitedIds={visitedIds}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function chunkItems(items: ScanReleaseItem[], columnCount: number) {
  return Array.from(
    { length: Math.ceil(items.length / columnCount) },
    (_, rowIndex) =>
      items.slice(rowIndex * columnCount, (rowIndex + 1) * columnCount)
  )
}
