import { useForm } from "@tanstack/react-form"
import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"

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
import { DateFormatHelpPopover } from "@/components/releases/date-format-help-popover"
import { SourcePreview } from "@/components/releases/source-preview"
import { saveReleaseSource } from "@/lib/release-sources/source-repository"
import { normalizeSourceColor } from "@/lib/release-sources/source-color"
import { defaultReleaseDateFormats } from "@/lib/scanner/release-date-parser"
import type {
  ReleaseLinkSelector,
  ReleaseSource,
  ReleaseSourceDraft,
} from "@/types/release-source.type"

type SourceFormDialogProps = {
  open: boolean
  source?: ReleaseSource
  onOpenChange: (open: boolean) => void
}

const emptyReleaseSelector = (index: number): ReleaseLinkSelector => ({
  id: crypto.randomUUID(),
  linkSelector: "",
  textSelectors: [""],
  timeSelector: index === 0 ? "" : undefined,
})

const createEmptyDraft = (): ReleaseSourceDraft => ({
  name: "",
  enabled: true,
  color: normalizeSourceColor(undefined),
  proxyImages: false,
  baseUrl: "",
  releaseParentSelector: "",
  deleteSelectors: [],
  titleSelector: "",
  imageSelector: "",
  mangaLinkSelector: "",
  dateFormats: defaultReleaseDateFormats(),
  releaseSelectors: [emptyReleaseSelector(0)],
})

export function SourceFormDialog({
  open,
  source,
  onOpenChange,
}: SourceFormDialogProps) {
  const { t } = useTranslation()
  const form = useForm({
    defaultValues: sourceToDraft(source),
    onSubmit: async ({ value }) => {
      await saveReleaseSource(normalizeDraft(value), source?.id)
      onOpenChange(false)
      form.reset(createEmptyDraft())
    },
  })
  const textField = (
    name: keyof Omit<
      ReleaseSourceDraft,
      | "color"
      | "enabled"
      | "proxyImages"
      | "deleteSelectors"
      | "dateFormats"
      | "releaseSelectors"
    >,
    label: string,
    placeholder: string,
    requiredMessage: string
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
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
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
          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            <form.Subscribe selector={(state) => state.values}>
              {(values) => <SourcePreview draft={values} />}
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

              {textField(
                "releaseParentSelector",
                t("form.parent"),
                ".doreamon",
                t("form.parentRequired")
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
                        "2 hours ago",
                        "last week",
                        "2h 14m",
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
                    t("form.titleRequired")
                  )}
                  {textField(
                    "imageSelector",
                    t("form.imageSelector"),
                    ".lazy.lz-entered.lz-loaded",
                    t("form.imageRequired")
                  )}
                  {textField(
                    "mangaLinkSelector",
                    t("form.mangaLink"),
                    ".tooltip.cover.bookmark_check",
                    t("form.mangaLinkRequired")
                  )}
                </div>
              </FieldSet>

              <form.Field name="releaseSelectors">
                {(field) => (
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
                        disabled={field.state.value.length >= 3}
                        onClick={() => {
                          field.handleChange([
                            ...field.state.value,
                            emptyReleaseSelector(field.state.value.length),
                          ])
                        }}
                      >
                        <PlusIcon data-icon="inline-start" />
                        {t("common.add")}
                      </Button>
                    </div>
                    <div className="flex flex-col gap-4">
                      {field.state.value.map((selector, index) => (
                        <div
                          className="rounded-lg border bg-muted/20 p-4"
                          key={selector.id}
                        >
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">
                              {t("form.row", { number: index + 1 })}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={field.state.value.length === 1}
                              onClick={() => {
                                field.handleChange(
                                  field.state.value.filter(
                                    (item) => item.id !== selector.id
                                  )
                                )
                              }}
                            >
                              <Trash2Icon />
                              <span className="sr-only">
                                {t("form.deleteRow")}
                              </span>
                            </Button>
                          </div>
                          <div className="grid gap-4 md:grid-cols-3">
                            <SelectorInput
                              label={t("form.chapterLink")}
                              value={selector.linkSelector}
                              placeholder="li:nth-child(2) .sts.sts_1"
                              onChange={(value) => {
                                field.handleChange(
                                  updateReleaseSelector(
                                    field.state.value,
                                    selector.id,
                                    {
                                      linkSelector: value,
                                    }
                                  )
                                )
                              }}
                            />
                            <SelectorInput
                              label={t("form.concatenatedTexts")}
                              value={selector.textSelectors.join("\n")}
                              placeholder="li:nth-child(2) .sts.sts_1"
                              multiline
                              onChange={(value) => {
                                field.handleChange(
                                  updateReleaseSelector(
                                    field.state.value,
                                    selector.id,
                                    {
                                      textSelectors: linesToList(value),
                                    }
                                  )
                                )
                              }}
                            />
                            <SelectorInput
                              label={t("form.time")}
                              value={selector.timeSelector ?? ""}
                              placeholder="li:nth-child(2) i"
                              onChange={(value) => {
                                field.handleChange(
                                  updateReleaseSelector(
                                    field.state.value,
                                    selector.id,
                                    {
                                      timeSelector: value,
                                    }
                                  )
                                )
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Field>
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

function SelectorInput({
  label,
  value,
  placeholder,
  multiline = false,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  multiline?: boolean
  onChange: (value: string) => void
}) {
  const id = `${label}-${placeholder}`.replace(/\W+/g, "-")

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  )
}

function sourceToDraft(source?: ReleaseSource): ReleaseSourceDraft {
  if (!source) {
    return createEmptyDraft()
  }

  return {
    name: source.name,
    enabled: (source as unknown as Record<string, unknown>).enabled !== false,
    color: normalizeSourceColor((source as Record<string, unknown>).color),
    proxyImages:
      (source as unknown as Record<string, unknown>).proxyImages === true,
    baseUrl: source.baseUrl,
    releaseParentSelector: source.releaseParentSelector,
    deleteSelectors: source.deleteSelectors,
    titleSelector: source.titleSelector,
    imageSelector: source.imageSelector,
    mangaLinkSelector: source.mangaLinkSelector,
    dateFormats: dateFormatsFromSource(source),
    releaseSelectors: source.releaseSelectors,
  }
}

function normalizeDraft(draft: ReleaseSourceDraft): ReleaseSourceDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    color: normalizeSourceColor(draft.color),
    baseUrl: draft.baseUrl.trim(),
    releaseParentSelector: draft.releaseParentSelector.trim(),
    titleSelector: draft.titleSelector.trim(),
    imageSelector: draft.imageSelector.trim(),
    mangaLinkSelector: draft.mangaLinkSelector.trim(),
    dateFormats: draft.dateFormats.map((item) => item.trim()).filter(Boolean),
    deleteSelectors: draft.deleteSelectors
      .map((item) => item.trim())
      .filter(Boolean),
    releaseSelectors: draft.releaseSelectors
      .map((selector) => ({
        ...selector,
        linkSelector: selector.linkSelector.trim(),
        textSelectors: selector.textSelectors
          .map((item) => item.trim())
          .filter(Boolean),
        timeSelector: selector.timeSelector?.trim(),
      }))
      .filter(
        (selector) =>
          selector.linkSelector.length > 0 && selector.textSelectors.length > 0
      ),
  }
}

function dateFormatsFromSource(source: ReleaseSource) {
  const dateFormats = (source as Record<string, unknown>).dateFormats

  return Array.isArray(dateFormats)
    ? dateFormats.filter(
        (format): format is string => typeof format === "string"
      )
    : defaultReleaseDateFormats()
}

function linesToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

function updateReleaseSelector(
  selectors: ReleaseLinkSelector[],
  selectorId: string,
  patch: Partial<ReleaseLinkSelector>
) {
  return selectors.map((selector) =>
    selector.id === selectorId ? { ...selector, ...patch } : selector
  )
}
