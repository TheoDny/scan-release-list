import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LockOpenIcon,
  RotateCcwIcon,
  StarIcon,
  StarOffIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { ProxiedCoverImage } from "@/components/releases/proxied-cover-image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  elapsedSinceAdjustedReleaseMs,
  formatDuration,
  formatElapsedTime,
  isReleaseLocked,
  releaseLockRemainingMs,
} from "@/lib/release-locks/release-lock-time"
import { sourceColorStyle } from "@/lib/release-sources/source-color"
import { cn } from "@/lib/utils"
import { visitedReleaseId } from "@/lib/visited-releases/visited-release-repository"
import type {
  ScanReleaseItem,
  ScanReleaseLink,
} from "@/types/scan-release.type"

type ReleaseCardProps = {
  item: ScanReleaseItem
  favorite: boolean
  hidden: boolean
  lockDelayHours?: number
  pendingHide: boolean
  visitedIds: Set<string>
  onLockRelease: (item: ScanReleaseItem, hours: number) => void
  onToggleFavorite: (item: ScanReleaseItem, favorite: boolean) => void
  onToggleHidden: (item: ScanReleaseItem, hidden: boolean) => void
  onUnlockRelease: (item: ScanReleaseItem) => void
  onVisitRelease: (item: ScanReleaseItem, release: ScanReleaseLink) => void
}

export function ReleaseCard({
  item,
  favorite,
  hidden,
  lockDelayHours,
  pendingHide,
  visitedIds,
  onLockRelease,
  onToggleFavorite,
  onToggleHidden,
  onUnlockRelease,
  onVisitRelease,
}: ReleaseCardProps) {
  const { t } = useTranslation()
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [favoriteHovered, setFavoriteHovered] = useState(false)
  const visibilityLabel = hidden
    ? t("releases.restore")
    : pendingHide
      ? t("releases.undo")
      : t("releases.hide")
  const lockLabel = lockDelayHours ? t("releases.unlock") : t("releases.lock")
  const favoriteLabel = favorite
    ? t("releases.removeFavorite")
    : t("releases.addFavorite")
  const lockDelayLabel = lockDelayHours
    ? t("releases.lockDelay", { count: lockDelayHours })
    : undefined

  function handleLockClick() {
    if (lockDelayHours) {
      onUnlockRelease(item)
      return
    }

    setLockDialogOpen(true)
  }

  return (
    <>
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
              className={cn(
                "min-w-0 flex-1 truncate text-base leading-tight font-semibold hover:underline",
                favorite && "text-amber-300"
              )}
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
                    className={cn(
                      "hover:text-amber-300",
                      favorite && "text-amber-300"
                    )}
                    variant="ghost"
                    size="icon-sm"
                    type="button"
                    onMouseEnter={() => setFavoriteHovered(true)}
                    onMouseLeave={() => setFavoriteHovered(false)}
                    onClick={() => onToggleFavorite(item, favorite)}
                  />
                }
              >
                {favorite && favoriteHovered ? (
                  <StarOffIcon className="text-amber-300" />
                ) : (
                  <StarIcon
                    className={cn(
                      (favorite || favoriteHovered) &&
                        "fill-current text-amber-300"
                    )}
                  />
                )}
                <span className="sr-only">{favoriteLabel}</span>
              </TooltipTrigger>
              <TooltipContent>{favoriteLabel}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    type="button"
                    onClick={handleLockClick}
                  />
                }
              >
                {lockDelayHours ? <LockOpenIcon /> : <LockIcon />}
                <span className="sr-only">{lockLabel}</span>
              </TooltipTrigger>
              <TooltipContent>{lockDelayLabel ?? lockLabel}</TooltipContent>
            </Tooltip>
            {!favorite && ( 
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
                  <span className="sr-only">{visibilityLabel}</span>
                </TooltipTrigger>
                <TooltipContent>{visibilityLabel}</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {item.releases.map((release) => {
              const visited = visitedIds.has(
                visitedReleaseId(item.sourceId, release.url)
              )
              const releaseLocked = isReleaseLocked(release, lockDelayHours)
              const displayTimeLabel = releaseTimeLabel(release, lockDelayHours)
              const remainingLockLabel = releaseLocked
                ? formatDuration(
                    releaseLockRemainingMs(release, lockDelayHours)
                  )
                : undefined

              return (
                <div
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3",
                    visited && "text-muted-foreground"
                  )}
                  key={release.id}
                >
                  <a
                    className="min-w-0 text-sm hover:underline"
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
                    <span className="flex min-w-0 items-center gap-1 before:mr-1 before:text-muted-foreground before:content-['»']">
                      <span className="min-w-0 truncate">{release.label}</span>
                      {releaseLocked ? (
                        <LockIcon
                          className="size-3.5 shrink-0 text-amber-300"
                          aria-label={lockDelayLabel ?? t("releases.locked")}
                        />
                      ) : null}
                    </span>
                  </a>
                  {displayTimeLabel || remainingLockLabel ? (
                    <span className="text-xs whitespace-nowrap italic">
                      {displayTimeLabel ? (
                        <span className="text-muted-foreground">
                          {displayTimeLabel}
                        </span>
                      ) : null}
                      {remainingLockLabel ? (
                        <span className="ml-1 text-amber-300">
                          ({remainingLockLabel})
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </article>

      <LockReleaseDialog
        open={lockDialogOpen}
        onLock={(hours) => onLockRelease(item, hours)}
        onOpenChange={setLockDialogOpen}
      />
    </>
  )
}

function releaseTimeLabel(
  release: ScanReleaseLink,
  lockDelayHours: number | undefined
) {
  if (!release.timeLabel || !lockDelayHours || !release.releasedAt) {
    return release.timeLabel
  }

  const elapsed = elapsedSinceAdjustedReleaseMs(release, lockDelayHours)

  if (elapsed === undefined || elapsed < 0) {
    return release.timeLabel
  }

  return formatElapsedTime(elapsed)
}

function LockReleaseDialog({
  open,
  onLock,
  onOpenChange,
}: {
  open: boolean
  onLock: (hours: number) => void
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const [hours, setHours] = useState("1")
  const parsedHours = Number.parseInt(hours, 10)
  const normalizedHours = Number.isFinite(parsedHours)
    ? Math.max(1, parsedHours)
    : 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("releases.lockTitle")}</DialogTitle>
          <DialogDescription>{t("releases.lockDescription")}</DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="release-lock-hours">
            {t("releases.lockHours")}
          </FieldLabel>
          <Input
            id="release-lock-hours"
            min={1}
            step={1}
            type="number"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
          />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              onLock(normalizedHours)
              onOpenChange(false)
            }}
          >
            <LockIcon data-icon="inline-start" />
            {t("releases.lock")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
