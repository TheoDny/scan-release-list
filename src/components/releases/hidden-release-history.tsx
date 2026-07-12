import { EyeOffIcon, RotateCcwIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { HiddenRelease } from "@/types/hidden-release.type"

type HiddenReleaseHistoryProps = {
  releases: HiddenRelease[]
  onRestore: (itemId: string) => void
}

export function HiddenReleaseHistory({
  releases,
  onRestore,
}: HiddenReleaseHistoryProps) {
  const { t } = useTranslation()

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeOffIcon />
          {t("hiddenHistory.title")}
        </CardTitle>
        <CardDescription>{t("hiddenHistory.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {releases.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("hiddenHistory.empty")}
          </p>
        ) : (
          <ol className="flex flex-col gap-1">
            {releases.map((release) => (
              <li
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1"
                key={release.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {release.title}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-3.5 w-3.5"
                        onClick={() => onRestore(release.itemId)}
                      />
                    }
                  >
                    <RotateCcwIcon className="h-3.5! w-3.5!" />
                    <span className="sr-only">
                      {t("hiddenHistory.restore", { title: release.title })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("hiddenHistory.restore", { title: release.title })}
                  </TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
