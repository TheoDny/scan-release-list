import { EyeIcon, EyeOffIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ProxiedCoverImage } from "@/components/releases/proxied-cover-image"
import { sourceColorStyle } from "@/lib/release-sources/source-color"
import { cn } from "@/lib/utils"
import type { ScanReleaseItem } from "@/types/scan-release.type"

type ReleaseCardProps = {
  item: ScanReleaseItem
  hidden: boolean
  pendingHide: boolean
  onToggleHidden: (item: ScanReleaseItem, hidden: boolean) => void
}

export function ReleaseCard({
  item,
  hidden,
  pendingHide,
  onToggleHidden,
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
                {hidden ? "Réafficher" : pendingHide ? "Annuler" : "Bannir"}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {hidden ? "Réafficher" : pendingHide ? "Annuler" : "Bannir"}
            </TooltipContent>
          </Tooltip>
        </div>

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
