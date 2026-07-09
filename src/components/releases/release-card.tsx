import { EyeIcon, EyeOffIcon, RotateCcwIcon } from "lucide-react"

import { ProxiedCoverImage } from "@/components/releases/proxied-cover-image"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { sourceColorStyle } from "@/lib/release-sources/source-color"
import { cn } from "@/lib/utils"
import { visitedReleaseId } from "@/lib/visited-releases/visited-release-repository"
import type {
  ScanReleaseItem,
  ScanReleaseLink,
} from "@/types/scan-release.type"

type ReleaseCardProps = {
  item: ScanReleaseItem
  hidden: boolean
  pendingHide: boolean
  visitedIds: Set<string>
  onToggleHidden: (item: ScanReleaseItem, hidden: boolean) => void
  onVisitRelease: (item: ScanReleaseItem, release: ScanReleaseLink) => void
}

export function ReleaseCard({
  item,
  hidden,
  pendingHide,
  visitedIds,
  onToggleHidden,
  onVisitRelease,
}: ReleaseCardProps) {
  return (
    <article
      className={cn(
        "grid min-w-0 grid-cols-[84px_1fr] gap-3 rounded-lg border p-2 transition-opacity duration-[3000ms]",
        pendingHide && "opacity-20",
        hidden && "opacity-55"
      )}
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
        <div className="flex min-w-0 items-start gap-2">
          <a
            className="min-w-0 flex-1 truncate text-base leading-tight font-semibold hover:underline"
            href={item.mangaUrl}
            target="_blank"
            rel="noreferrer"
            title={item.title}
          >
            {item.title}
          </a>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  onClick={() => onToggleHidden(item, hidden)}
                />
              }
            >
              {hidden ? (
                <EyeIcon />
              ) : pendingHide ? (
                <RotateCcwIcon />
              ) : (
                <EyeOffIcon />
              )}
              <span className="sr-only">
                {hidden
                  ? "Retirer des indésirables"
                  : pendingHide
                    ? "Annuler"
                    : "Marquer comme indésirable"}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {hidden
                ? "Retirer des indésirables"
                : pendingHide
                  ? "Annuler"
                  : "Marquer comme indésirable"}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex flex-col gap-1.5">
          {item.releases.map((release) => {
            const visited = visitedIds.has(
              visitedReleaseId(item.sourceId, release.url)
            )

            return (
              <div
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3",
                  visited && "text-muted-foreground"
                )}
                key={release.id}
              >
                <a
                  className="min-w-0 truncate text-sm hover:underline before:mr-2 before:text-muted-foreground before:content-['»']"
                  href={release.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onVisitRelease(item, release)}
                  onAuxClick={(event) => {
                    if (event.button === 1) {
                      onVisitRelease(item, release)
                    }
                  }}
                >
                  {release.label}
                </a>
                {release.timeLabel ? (
                  <span className="text-xs whitespace-nowrap text-muted-foreground italic">
                    {release.timeLabel}
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}
