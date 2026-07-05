import { useForm } from "@tanstack/react-form"
import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { SourcePreview } from "@/components/releases/source-preview"
import { saveReleaseSource } from "@/lib/release-sources/source-repository"
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
  baseUrl: "",
  releaseParentSelector: "",
  deleteSelectors: [],
  titleSelector: "",
  imageSelector: "",
  mangaLinkSelector: "",
  releaseSelectors: [emptyReleaseSelector(0)],
})

export function SourceFormDialog({
  open,
  source,
  onOpenChange,
}: SourceFormDialogProps) {
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
      "deleteSelectors" | "releaseSelectors"
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
            {source ? "Modifier la source" : "Nouvelle source"}
          </DialogTitle>
          <DialogDescription>
            Configure les sélecteurs CSS utilisés pour afficher les chapitres.
          </DialogDescription>
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
                {textField("name", "Nom", "Natomanga", "Le nom est requis.")}
                {textField(
                  "baseUrl",
                  "URL",
                  "https://www.natomanga.com",
                  "L'URL est requise."
                )}
              </div>

              {textField(
                "releaseParentSelector",
                "Parent contenant la liste",
                ".doreamon",
                "Le sélecteur parent est requis."
              )}

              <form.Field name="deleteSelectors">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Sélecteurs à supprimer
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
                      Un sélecteur par ligne, supprimé avant le parsing.
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>

              <FieldSet>
                <div className="grid gap-4 md:grid-cols-3">
                  {textField(
                    "titleSelector",
                    "Titre",
                    "h3 .tooltip",
                    "Le titre est requis."
                  )}
                  {textField(
                    "imageSelector",
                    "Image",
                    ".lazy.lz-entered.lz-loaded",
                    "L'image est requise."
                  )}
                  {textField(
                    "mangaLinkSelector",
                    "Lien manga",
                    ".tooltip.cover.bookmark_check",
                    "Le lien manga est requis."
                  )}
                </div>
              </FieldSet>

              <form.Field name="releaseSelectors">
                {(field) => (
                  <Field>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <FieldLabel>Lignes de chapitre</FieldLabel>
                        <FieldDescription>
                          Correspond aux lignes encadrées dans la carte.
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
                        Ajouter
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
                              Ligne {index + 1}
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
                                Supprimer la ligne
                              </span>
                            </Button>
                          </div>
                          <div className="grid gap-4 md:grid-cols-3">
                            <SelectorInput
                              label="Lien du chapitre"
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
                              label="Textes concaténés"
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
                              label="Temps"
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
              Annuler
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  <SaveIcon data-icon="inline-start" />
                  Enregistrer
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
    baseUrl: source.baseUrl,
    releaseParentSelector: source.releaseParentSelector,
    deleteSelectors: source.deleteSelectors,
    titleSelector: source.titleSelector,
    imageSelector: source.imageSelector,
    mangaLinkSelector: source.mangaLinkSelector,
    releaseSelectors: source.releaseSelectors,
  }
}

function normalizeDraft(draft: ReleaseSourceDraft): ReleaseSourceDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    baseUrl: draft.baseUrl.trim(),
    releaseParentSelector: draft.releaseParentSelector.trim(),
    titleSelector: draft.titleSelector.trim(),
    imageSelector: draft.imageSelector.trim(),
    mangaLinkSelector: draft.mangaLinkSelector.trim(),
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
