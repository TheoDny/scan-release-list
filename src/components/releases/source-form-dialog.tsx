import { useForm } from "@tanstack/react-form"
import { SaveIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { ChapterSelectorsField } from "@/components/releases/chapter-selectors-field"
import { DateFormatHelpPopover } from "@/components/releases/date-format-help-popover"
import { SourcePreview } from "@/components/releases/source-preview"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { normalizeSourceColor } from "@/lib/release-sources/source-color"
import { saveReleaseSource } from "@/lib/release-sources/source-repository"
import type {
  ReleaseSource,
  ReleaseSourceDraft,
} from "@/types/release-source.type"
import type {
  FocusedSelectorPreview,
  SelectorTarget,
} from "@/types/selector-preview.type"
import {
  createEmptyDraft,
  firstSelectorLine,
  isReleaseFetchMode,
  linesToList,
  normalizeDraft,
  sourceToDraft,
  updateReleaseSelector,
} from "@/components/releases/source-form-utils"

type SourceFormDialogProps = {
  open: boolean
  source?: ReleaseSource
  onOpenChange: (open: boolean) => void
}

const selectorFocusEventName = "scan-release-selector-focus"

export function SourceFormDialog({
  open,
  source,
  onOpenChange,
}: SourceFormDialogProps) {
  const { t } = useTranslation()
  const [focusedSelector, setFocusedSelector] =
    useState<FocusedSelectorPreview>()
  const form = useForm({
    defaultValues: sourceToDraft(source),
    onSubmit: async ({ value }) => {
      await saveReleaseSource(normalizeDraft(value), source?.id)
      onOpenChange(false)
      form.reset(createEmptyDraft())
    },
  })
  const handleSelectorSelected = (target: SelectorTarget, selector: string) => {
    if (
      target === "releaseParentSelector" ||
      target === "titleSelector" ||
      target === "imageSelector" ||
      target === "mangaLinkSelector"
    ) {
      form.setFieldValue(target, selector)
      return
    }

    const releaseSelectors = form.getFieldValue("releaseSelectors")
    const firstSelector = releaseSelectors[0]

    const patch =
      target === "releaseLinkSelector"
        ? { linkSelector: selector }
        : target === "releaseTextSelector"
          ? { textSelectors: [selector] }
          : { timeSelector: selector }

    form.setFieldValue(
      "releaseSelectors",
      updateReleaseSelector(releaseSelectors, firstSelector.id, patch)
    )
  }
  const updateFocusedSelector = (next: FocusedSelectorPreview) => {
    setFocusedSelector(next)
    window.dispatchEvent(
      new CustomEvent<FocusedSelectorPreview>(selectorFocusEventName, {
        detail: next,
      })
    )
  }
  const handleSelectorFocus = (target: SelectorTarget, selector: string) => {
    updateFocusedSelector({ target, selector: firstSelectorLine(selector) })
  }
  const handleSelectorBlur = (target: SelectorTarget) => {
    setFocusedSelector((current) =>
      current?.target === target ? undefined : current
    )
    window.dispatchEvent(
      new CustomEvent<FocusedSelectorPreview | undefined>(
        selectorFocusEventName,
        {
          detail: undefined,
        }
      )
    )
  }
  const handleFocusedSelectorChange = (
    target: SelectorTarget,
    selector: string
  ) => {
    setFocusedSelector((current) =>
      current?.target === target
        ? { target, selector: firstSelectorLine(selector) }
        : current
    )
    window.dispatchEvent(
      new CustomEvent<FocusedSelectorPreview>(selectorFocusEventName, {
        detail: { target, selector: firstSelectorLine(selector) },
      })
    )
  }
  const textField = (
    name: keyof Omit<
      ReleaseSourceDraft,
      | "color"
      | "enabled"
      | "fetchMode"
      | "proxyImages"
      | "deleteSelectors"
      | "dateFormats"
      | "releaseSelectors"
    >,
    label: string,
    placeholder: string,
    requiredMessage: string,
    selectorTarget?: SelectorTarget
  ) => (
    <form.Field
      name={name}
      validators={{
        onChange: ({ value }) =>
          typeof value === "string" && value.trim()
            ? undefined
            : requiredMessage,
      }}
    >
      {(field) => (
        <Field data-invalid={!field.state.meta.isValid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            id={field.name}
            name={field.name}
            value={field.state.value}
            placeholder={placeholder}
            aria-invalid={!field.state.meta.isValid}
            onBlur={() => {
              field.handleBlur()
              if (selectorTarget) {
                handleSelectorBlur(selectorTarget)
              }
            }}
            onFocus={() => {
              if (selectorTarget) {
                handleSelectorFocus(selectorTarget, field.state.value)
              }
            }}
            onChange={(event) => {
              field.handleChange(event.target.value)
              if (selectorTarget) {
                handleFocusedSelectorChange(selectorTarget, event.target.value)
              }
            }}
          />
          <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
        </Field>
      )}
    </form.Field>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            {source ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            form.handleSubmit()
          }}
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(420px,0.9fr)_1.1fr]">
            <form.Subscribe selector={(state) => state.values}>
              {(values) => (
                <SourcePreview
                  draft={values}
                  focusedSelector={focusedSelector}
                  onSelectorSelected={handleSelectorSelected}
                />
              )}
            </form.Subscribe>

            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                {textField(
                  "name",
                  t("form.name"),
                  "Natomanga",
                  t("form.nameRequired")
                )}
                {textField(
                  "baseUrl",
                  t("form.url"),
                  "https://www.natomanga.com",
                  t("form.urlRequired")
                )}
              </div>

              <form.Field name="color">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("form.color")}
                    </FieldLabel>
                    <div className="grid gap-3 sm:grid-cols-[72px_1fr]">
                      <Input
                        id={field.name}
                        name={field.name}
                        type="color"
                        className="h-10 w-[72px] cursor-pointer p-1"
                        value={normalizeSourceColor(field.state.value)}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                      <Input
                        value={field.state.value}
                        placeholder="#7c3aed"
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                    </div>
                    <FieldDescription>
                      {t("form.colorDescription")}
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>

              <form.Field name="proxyImages">
                {(field) => (
                  <Field orientation="horizontal">
                    <div className="flex-1">
                      <FieldLabel htmlFor={field.name}>
                        {t("form.proxyImages")}
                      </FieldLabel>
                      <FieldDescription>
                        {t("form.proxyDescription")}
                      </FieldDescription>
                    </div>
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="fetchMode">
                {(field) => (
                  <Field>
                    <FieldLabel>{t("form.fetchMode")}</FieldLabel>
                    <ToggleGroup
                      className="justify-start"
                      value={[field.state.value]}
                      variant="outline"
                      onValueChange={(value) => {
                        const nextValue = value[0]
                        if (isReleaseFetchMode(nextValue)) {
                          field.handleChange(nextValue)
                        }
                      }}
                    >
                      <ToggleGroupItem value="server">
                        {t("form.fetchModeServer")}
                      </ToggleGroupItem>
                      <ToggleGroupItem value="browser">
                        {t("form.fetchModeBrowser")}
                      </ToggleGroupItem>
                      <ToggleGroupItem value="rendered">
                        {t("form.fetchModeRendered")}
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <FieldDescription>
                      {t("form.fetchModeDescription")}
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>

              {textField(
                "releaseParentSelector",
                t("form.parent"),
                ".doreamon",
                t("form.parentRequired"),
                "releaseParentSelector"
              )}

              <form.Field name="deleteSelectors">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("form.deleteSelectors")}
                    </FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value.join("\n")}
                      placeholder=".js-banner-ai-home"
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(linesToList(event.target.value))
                      }}
                    />
                    <FieldDescription>
                      {t("form.deleteDescription")}
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>

              <form.Field name="dateFormats">
                {(field) => (
                  <Field>
                    <div className="flex items-center gap-1">
                      <FieldLabel htmlFor={field.name}>
                        {t("form.dateFormats")}
                      </FieldLabel>
                      <DateFormatHelpPopover />
                    </div>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value.join("\n")}
                      placeholder={[
                        "relative-en",
                        "compact-duration",
                        "MM-dd HH:mm",
                      ].join("\n")}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(linesToList(event.target.value))
                      }}
                    />
                    <FieldDescription>
                      {t("form.dateDescription")}
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>

              <FieldSet>
                <div className="grid gap-4 md:grid-cols-3">
                  {textField(
                    "titleSelector",
                    t("form.titleSelector"),
                    "h3 .tooltip",
                    t("form.titleRequired"),
                    "titleSelector"
                  )}
                  {textField(
                    "imageSelector",
                    t("form.imageSelector"),
                    ".lazy.lz-entered.lz-loaded",
                    t("form.imageRequired"),
                    "imageSelector"
                  )}
                  {textField(
                    "mangaLinkSelector",
                    t("form.mangaLink"),
                    ".tooltip.cover.bookmark_check",
                    t("form.mangaLinkRequired"),
                    "mangaLinkSelector"
                  )}
                </div>
              </FieldSet>

              <form.Field name="releaseSelectors">
                {(field) => (
                  <ChapterSelectorsField
                    value={field.state.value}
                    onChange={field.handleChange}
                    onSelectorBlur={handleSelectorBlur}
                    onSelectorChange={handleFocusedSelectorChange}
                    onSelectorFocus={handleSelectorFocus}
                  />
                )}
              </form.Field>
            </FieldGroup>
          </div>

          <Separator />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  <SaveIcon data-icon="inline-start" />
                  {t("common.save")}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
