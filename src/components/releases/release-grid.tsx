import { LibraryIcon } from "lucide-react"
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
    <div className="grid gap-x-4 gap-y-2 lg:grid-cols-2">
      {items.map((item) => (
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
  )
}
