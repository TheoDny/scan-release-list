import { PlusIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { SelectorInput } from "@/components/releases/selector-input"
import {
  emptyReleaseSelector,
  linesToList,
  updateReleaseSelector,
} from "@/components/releases/source-form-utils"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import type { ReleaseLinkSelector } from "@/types/release-source.type"
import type { SelectorTarget } from "@/types/selector-preview.type"

type ChapterSelectorsFieldProps = {
  value: ReleaseLinkSelector[]
  onChange: (value: ReleaseLinkSelector[]) => void
  onSelectorBlur: (target: SelectorTarget) => void
  onSelectorChange: (target: SelectorTarget, selector: string) => void
  onSelectorFocus: (target: SelectorTarget, selector: string) => void
}

export function ChapterSelectorsField({
  value,
  onChange,
  onSelectorBlur,
  onSelectorChange,
  onSelectorFocus,
}: ChapterSelectorsFieldProps) {
  const { t } = useTranslation()

  return (
    <Field>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <FieldLabel>{t("form.chapterRows")}</FieldLabel>
          <FieldDescription>
            {t("form.chapterRowsDescription")}
          </FieldDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={value.length >= 3}
          onClick={() =>
            onChange([...value, emptyReleaseSelector(value.length)])
          }
        >
          <PlusIcon data-icon="inline-start" />
          {t("common.add")}
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        {value.map((selector, index) => (
          <div className="rounded-lg border bg-muted/20 p-4" key={selector.id}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">
                {t("form.row", { number: index + 1 })}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={value.length === 1}
                onClick={() =>
                  onChange(value.filter((item) => item.id !== selector.id))
                }
              >
                <Trash2Icon />
                <span className="sr-only">{t("form.deleteRow")}</span>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <SelectorInput
                label={t("form.chapterLink")}
                value={selector.linkSelector}
                placeholder="li:nth-child(2) .sts.sts_1"
                selectorTarget="releaseLinkSelector"
                onBlur={onSelectorBlur}
                onChange={(nextValue) => {
                  onSelectorChange("releaseLinkSelector", nextValue)
                  onChange(
                    updateReleaseSelector(value, selector.id, {
                      linkSelector: nextValue,
                    })
                  )
                }}
                onFocus={onSelectorFocus}
              />
              <SelectorInput
                label={t("form.concatenatedTexts")}
                value={selector.textSelectors.join("\n")}
                placeholder="li:nth-child(2) .sts.sts_1"
                multiline
                selectorTarget="releaseTextSelector"
                onBlur={onSelectorBlur}
                onChange={(nextValue) => {
                  onSelectorChange("releaseTextSelector", nextValue)
                  onChange(
                    updateReleaseSelector(value, selector.id, {
                      textSelectors: linesToList(nextValue),
                    })
                  )
                }}
                onFocus={onSelectorFocus}
              />
              <SelectorInput
                label={t("form.time")}
                value={selector.timeSelector ?? ""}
                placeholder="li:nth-child(2) i"
                selectorTarget="releaseTimeSelector"
                onBlur={onSelectorBlur}
                onChange={(nextValue) => {
                  onSelectorChange("releaseTimeSelector", nextValue)
                  onChange(
                    updateReleaseSelector(value, selector.id, {
                      timeSelector: nextValue,
                    })
                  )
                }}
                onFocus={onSelectorFocus}
              />
            </div>
          </div>
        ))}
      </div>
    </Field>
  )
}
