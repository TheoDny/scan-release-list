import { DownloadIcon, UploadIcon } from "lucide-react"
import { useRef, useState } from "react"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import {
  exportDatabase,
  importDatabase,
} from "@/lib/db/database-transfer-service"
import { translateError } from "@/lib/i18n/translate-error"
import type { ReleaseSource } from "@/types/release-source.type"

type DatabaseTransferActionsProps = {
  sources: ReleaseSource[]
}

export function DatabaseTransferActions({
  sources,
}: DatabaseTransferActionsProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [includeSources, setIncludeSources] = useState(true)
  const [includeHiddenReleases, setIncludeHiddenReleases] = useState(true)
  const [includeReleaseLocks, setIncludeReleaseLocks] = useState(true)
  const [includeVisitedReleases, setIncludeVisitedReleases] = useState(true)
  const [sourceIds, setSourceIds] = useState(() =>
    sources.map((source) => source.id)
  )
  const [status, setStatus] = useState("")

  function openExport() {
    setIncludeSources(true)
    setIncludeHiddenReleases(true)
    setIncludeReleaseLocks(true)
    setIncludeVisitedReleases(true)
    setSourceIds(sources.map((source) => source.id))
    setExportOpen(true)
  }

  async function handleExport() {
    const databaseExport = await exportDatabase({
      sourceIds,
      includeSources,
      includeHiddenReleases,
      includeReleaseLocks,
      includeVisitedReleases,
    })
    const blob = new Blob([JSON.stringify(databaseExport, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `scan-release-list-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setExportOpen(false)
    setStatus(t("transfer.exportDone"))
  }

  async function handleImport(file: File | undefined) {
    if (!file) {
      return
    }

    try {
      const summary = await importDatabase(await file.text())
      setStatus(
        t("transfer.importDone", {
          sources: summary.sources,
          unwanted: summary.hiddenReleases,
          locked: summary.releaseLocks,
          visits: summary.visitedReleases,
        })
      )
    } catch (error) {
      setStatus(
        error instanceof Error
          ? translateError(error.message, t)
          : t("transfer.importFailed")
      )
    } finally {
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  const allSourcesSelected =
    sources.length > 0 && sourceIds.length === sources.length
  const hasCategory =
    includeSources ||
    includeHiddenReleases ||
    includeReleaseLocks ||
    includeVisitedReleases

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => inputRef.current?.click()}>
          <UploadIcon data-icon="inline-start" />
          {t("header.import")}
        </Button>
        <Button variant="outline" onClick={openExport}>
          <DownloadIcon data-icon="inline-start" />
          {t("header.export")}
        </Button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={(event) => void handleImport(event.target.files?.[0])}
        />
        <p className="sr-only" role="status">
          {status}
        </p>
      </div>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transfer.exportTitle")}</DialogTitle>
            <DialogDescription>
              {t("transfer.exportDescription")}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>{t("transfer.data")}</FieldLabel>
              <SwitchRow
                checked={includeSources}
                label={t("transfer.sourceConfigurations")}
                onCheckedChange={setIncludeSources}
              />
              <SwitchRow
                checked={includeHiddenReleases}
                label={t("transfer.unwanted")}
                onCheckedChange={setIncludeHiddenReleases}
              />
              <SwitchRow
                checked={includeReleaseLocks}
                label={t("transfer.locks")}
                onCheckedChange={setIncludeReleaseLocks}
              />
              <SwitchRow
                checked={includeVisitedReleases}
                label={t("transfer.visits")}
                onCheckedChange={setIncludeVisitedReleases}
              />
            </Field>

            <Field>
              <FieldLabel>{t("transfer.affectedSources")}</FieldLabel>
              <SwitchRow
                checked={allSourcesSelected}
                label={t("transfer.allSources")}
                onCheckedChange={(checked) =>
                  setSourceIds(
                    checked ? sources.map((source) => source.id) : []
                  )
                }
              />
              <div className="ml-6 flex max-h-48 flex-col gap-2 overflow-y-auto">
                {sources.map((source) => (
                  <SwitchRow
                    checked={sourceIds.includes(source.id)}
                    key={source.id}
                    label={source.name}
                    onCheckedChange={(checked) =>
                      setSourceIds((current) =>
                        checked
                          ? [...current, source.id]
                          : current.filter((id) => id !== source.id)
                      )
                    }
                  />
                ))}
              </div>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!hasCategory || sourceIds.length === 0}
              onClick={() => void handleExport()}
            >
              <DownloadIcon data-icon="inline-start" />
              {t("header.export")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SwitchRow({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  const id = `export-${label.toLowerCase().replace(/\W+/g, "-")}`

  return (
    <label
      className="flex items-center justify-between gap-3 text-sm"
      htmlFor={id}
    >
      {label}
      <Switch
        id={id}
        size="sm"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </label>
  )
}
