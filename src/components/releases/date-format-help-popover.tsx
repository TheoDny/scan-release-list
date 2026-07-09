import { CircleQuestionMarkIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const dateExamples = [
  ["07-09 18:30", "MM-dd HH:mm"],
  ["09/07/2026 18:30", "dd/MM/yyyy HH:mm"],
  ["2026-07-09", "yyyy-MM-dd"],
  ["09.07.2026", "dd.MM.yyyy"],
] as const

const dateTokens = [
  ["dd", "day"],
  ["MM", "month"],
  ["yyyy", "year"],
  ["HH", "hour24"],
  ["mm", "minutes"],
] as const

export function DateFormatHelpPopover() {
  const { t } = useTranslation()

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("form.dateHelp.open")}
          />
        }
      >
        <CircleQuestionMarkIcon />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[min(80svh,640px)] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto"
      >
        <PopoverHeader>
          <PopoverTitle>{t("form.dateHelp.title")}</PopoverTitle>
          <PopoverDescription>
            {t("form.dateHelp.description")}
          </PopoverDescription>
        </PopoverHeader>

        <section className="flex flex-col gap-2">
          <h4 className="font-medium">{t("form.dateHelp.examples")}</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("form.dateHelp.retrievedText")}</TableHead>
                <TableHead>{t("form.dateHelp.configuredFormat")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dateExamples.map(([value, format]) => (
                <TableRow key={value}>
                  <TableCell className="font-mono text-xs">{value}</TableCell>
                  <TableCell className="font-mono text-xs">{format}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="flex flex-col gap-2">
          <h4 className="font-medium">{t("form.dateHelp.tokens")}</h4>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
            {dateTokens.map(([token, label]) => (
              <div className="contents" key={token}>
                <dt className="font-mono text-foreground">{token}</dt>
                <dd>{t(`form.dateHelp.${label}`)}</dd>
              </div>
            ))}
          </dl>
          <p className="text-muted-foreground">
            {t("form.dateHelp.caseWarning")}
          </p>
        </section>

        <section className="flex flex-col gap-1">
          <h4 className="font-mono font-medium">relative-en</h4>
          <p className="text-muted-foreground">
            {t("form.dateHelp.relativeDescription")}
          </p>
          <p className="font-mono text-xs">
            2 hours ago · last week · 3 days ago
          </p>
        </section>

        <section className="flex flex-col gap-1">
          <h4 className="font-mono font-medium">compact-duration</h4>
          <p className="text-muted-foreground">
            {t("form.dateHelp.compactDescription")}
          </p>
          <p className="font-mono text-xs">2h · 14m · 2h 14m</p>
        </section>
      </PopoverContent>
    </Popover>
  )
}
