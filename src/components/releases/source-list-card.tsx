import {
  AlertTriangleIcon,
  CopyIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  Settings2Icon,
  Trash2Icon,
} from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

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
import { translateError } from "@/lib/i18n/translate-error"
import { sourceColorStyle } from "@/lib/release-sources/source-color"
import { isReleaseSourceEnabled } from "@/lib/release-sources/source-repository"
import type { ReleaseSource } from "@/types/release-source.type"

type SourceListCardProps = {
  sources: ReleaseSource[]
  errorsBySourceId: Map<string, string | undefined>
  scanningSourceIds: Set<string>
  sourceFetchDurations: Map<string, number>
  onDeleteSource: (sourceId: string) => void
  onDuplicateSource: (source: ReleaseSource) => void
  onEditSource: (source: ReleaseSource) => void
  onScanSource: (source: ReleaseSource) => void
  onSetSourceEnabled: (source: ReleaseSource, enabled: boolean) => void
}

export function SourceListCard({
  sources,
  errorsBySourceId,
  scanningSourceIds,
  sourceFetchDurations,
  onDeleteSource,
  onDuplicateSource,
  onEditSource,
  onScanSource,
  onSetSourceEnabled,
}: SourceListCardProps) {
  const { t } = useTranslation()

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("sources.title")}</CardTitle>
        <CardDescription>
          {t("sources.count", { count: sources.length })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("sources.empty")}</p>
        ) : (
          sources.map((source) => (
            <div
              className="flex items-center gap-1 rounded-md border p-1.5"
              key={source.id}
              style={sourceColorStyle(source.color)}
            >
              <SourceLink
                error={errorsBySourceId.get(source.id)}
                isScanning={scanningSourceIds.has(source.id)}
                source={source}
              />
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
                  onSetSourceEnabled(source, enabled)
                }
              />
              <SourceAction
                label={sourceScanLabel(
                  source.name,
                  sourceFetchDurations.get(source.id),
                  t
                )}
                disabled={
                  !isReleaseSourceEnabled(source) ||
                  scanningSourceIds.has(source.id)
                }
                onClick={() => onScanSource(source)}
              >
                <RefreshCwIcon />
              </SourceAction>
              <SourceAction
                label={t("common.duplicate")}
                onClick={() => onDuplicateSource(source)}
              >
                <CopyIcon />
              </SourceAction>
              <SourceAction
                label={t("common.edit")}
                onClick={() => onEditSource(source)}
              >
                <Settings2Icon />
              </SourceAction>
              <SourceAction
                label={t("common.delete")}
                onClick={() => onDeleteSource(source.id)}
              >
                <Trash2Icon />
              </SourceAction>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function SourceLink({
  source,
  error,
  isScanning,
}: {
  source: ReleaseSource
  error?: string
  isScanning: boolean
}) {
  const { t } = useTranslation()

  return (
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
        {isScanning ? (
          <LoaderCircleIcon className="size-3 shrink-0 animate-spin text-muted-foreground" />
        ) : null}
        <p className="truncate text-sm font-medium">{source.name}</p>
        {error ? (
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangleIcon className="shrink-0 text-destructive" />
              <span className="sr-only">{t("sources.scanError")}</span>
            </TooltipTrigger>
            <TooltipContent>{translateError(error, t)}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <p className="truncate text-xs text-muted-foreground">{source.baseUrl}</p>
    </a>
  )
}

function sourceScanLabel(
  sourceName: string,
  durationMs: number | undefined,
  t: ReturnType<typeof useTranslation>["t"]
) {
  if (durationMs === undefined) {
    return t("sources.scan", { name: sourceName })
  }

  return t("sources.scanWithDuration", {
    name: sourceName,
    duration: formatDuration(durationMs),
  })
}

function formatDuration(durationMs: number) {
  if (durationMs < 1_000) {
    return `${Math.round(durationMs)} ms`
  }

  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: durationMs < 10_000 ? 1 : 0,
  }).format(durationMs / 1_000)} s`
}

function SourceAction({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={onClick}
            className="h-6 w-6"
          />
        }
      >
        {children}
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
