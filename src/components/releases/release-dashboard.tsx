import { useMemo, useRef, useState } from "react"
import {
  DatabaseIcon,
  EyeIcon,
  PlusIcon,
  RefreshCwIcon,
  Settings2Icon,
  Trash2Icon,
} from "lucide-react"

import { ReleaseGrid } from "@/components/releases/release-grid"
import { SourceFormDialog } from "@/components/releases/source-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useHiddenReleaseIds,
  useReleaseSources,
} from "@/hooks/use-release-data"
import {
  hideReleaseItem,
  showReleaseItem,
} from "@/lib/hidden-releases/hidden-release-repository"
import { natomangaSourceDraft } from "@/lib/release-sources/default-source"
import {
  deleteReleaseSource,
  saveReleaseSource,
} from "@/lib/release-sources/source-repository"
import { scanReleaseSource } from "@/lib/scanner/scan-service"
import type { ReleaseSource } from "@/types/release-source.type"
import type {
  ScanReleaseItem,
  ScanSourceResult,
} from "@/types/scan-release.type"

export function ReleaseDashboard() {
  const sources = useReleaseSources()
  const hiddenIds = useHiddenReleaseIds()
  const [results, setResults] = useState<ScanSourceResult[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editedSource, setEditedSource] = useState<ReleaseSource | undefined>()
  const [pendingHideIds, setPendingHideIds] = useState(() => new Set<string>())
  const hideTimers = useRef(new Map<string, number>())

  const allItems = useMemo(
    () => results.flatMap((result) => result.items),
    [results]
  )
  const visibleItems = useMemo(
    () =>
      showHidden
        ? allItems
        : allItems.filter((item) => !hiddenIds.has(item.id)),
    [allItems, hiddenIds, showHidden]
  )
  const errors = results.filter((result) => result.error)

  async function scanAllSources() {
    setIsScanning(true)
    setResults(
      await Promise.all(sources.map((source) => scanReleaseSource(source)))
    )
    setIsScanning(false)
  }

  async function addExampleSource() {
    await saveReleaseSource(natomangaSourceDraft)
  }

  function openSourceForm(source?: ReleaseSource) {
    setEditedSource(source)
    setIsFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setIsFormOpen(open)

    if (!open) {
      setEditedSource(undefined)
    }
  }

  async function handleToggleHidden(item: ScanReleaseItem, hidden: boolean) {
    if (hidden) {
      await showReleaseItem(item.id)
      return
    }

    if (pendingHideIds.has(item.id)) {
      cancelPendingHide(item.id)
      return
    }

    setPendingHideIds((current) => new Set(current).add(item.id))
    const timer = window.setTimeout(async () => {
      hideTimers.current.delete(item.id)
      setPendingHideIds((current) => {
        const next = new Set(current)
        next.delete(item.id)
        return next
      })
      await hideReleaseItem(item)
    }, 3000)

    hideTimers.current.set(item.id, timer)
  }

  function cancelPendingHide(itemId: string) {
    const timer = hideTimers.current.get(itemId)

    if (timer) {
      window.clearTimeout(timer)
      hideTimers.current.delete(itemId)
    }

    setPendingHideIds((current) => {
      const next = new Set(current)
      next.delete(itemId)
      return next
    })
  }

  return (
    <main className="dark min-h-svh bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 md:px-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-normal">
              Scan Release List
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={addExampleSource}>
              <DatabaseIcon data-icon="inline-start" />
              Exemple
            </Button>
            <Button variant="outline" onClick={() => openSourceForm()}>
              <PlusIcon data-icon="inline-start" />
              Source
            </Button>
            <Button
              disabled={sources.length === 0 || isScanning}
              onClick={scanAllSources}
            >
              <RefreshCwIcon data-icon="inline-start" />
              Scanner
            </Button>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <aside className="flex flex-col gap-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Sources</CardTitle>
                <CardDescription>{sources.length} site(s)</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ajoute une source ou charge l'exemple Natomanga.
                  </p>
                ) : (
                  sources.map((source) => (
                    <div
                      className="flex items-center gap-2 rounded-md border p-2"
                      key={source.id}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {source.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {source.baseUrl}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openSourceForm(source)}
                            />
                          }
                        >
                          <Settings2Icon />
                          <span className="sr-only">Modifier</span>
                        </TooltipTrigger>
                        <TooltipContent>Modifier</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => deleteReleaseSource(source.id)}
                            />
                          }
                        >
                          <Trash2Icon />
                          <span className="sr-only">Supprimer</span>
                        </TooltipTrigger>
                        <TooltipContent>Supprimer</TooltipContent>
                      </Tooltip>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Affichage</CardTitle>
                <CardAction>
                  <Badge variant="secondary">{visibleItems.length}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <EyeIcon />
                  Afficher les bannis
                </div>
                <Switch checked={showHidden} onCheckedChange={setShowHidden} />
              </CardContent>
            </Card>
          </aside>

          <section className="min-w-0 rounded-lg bg-card p-4 text-card-foreground ring-1 ring-foreground/10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Releases</h2>
                <Badge variant="outline">{allItems.length} trouvée(s)</Badge>
              </div>
              {isScanning ? (
                <Badge variant="secondary">Scan en cours</Badge>
              ) : null}
            </div>

            {errors.length > 0 ? (
              <>
                <div className="mb-4 flex flex-col gap-2">
                  {errors.map((result) => (
                    <p
                      className="rounded-md border border-destructive/30 px-3 py-2 text-sm text-destructive"
                      key={result.sourceId}
                    >
                      {result.sourceName}: {result.error}
                    </p>
                  ))}
                </div>
                <Separator className="mb-4" />
              </>
            ) : null}

            <ReleaseGrid
              hiddenIds={hiddenIds}
              items={visibleItems}
              pendingHideIds={pendingHideIds}
              onToggleHidden={handleToggleHidden}
            />
          </section>
        </div>
      </section>

      <SourceFormDialog
        key={editedSource?.id ?? "new-source"}
        open={isFormOpen}
        source={editedSource}
        onOpenChange={handleFormOpenChange}
      />
    </main>
  )
}
