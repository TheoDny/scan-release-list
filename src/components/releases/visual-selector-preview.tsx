import {
  CrosshairIcon,
  CornerDownRightIcon,
  CornerUpLeftIcon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  buildSelectorPreviewDocument,
  chooseSelectorCandidate,
} from "@/lib/scanner/selector-preview"
import type {
  FocusedSelectorPreview,
  SelectorPreviewCommand,
  SelectorPreviewDirection,
  SelectorPreviewMessage,
  SelectorPreviewSelection,
  SelectorTarget,
} from "@/types/selector-preview.type"

type VisualSelectorPreviewProps = {
  html: string
  baseUrl: string
  parentSelector: string
  focusedSelector?: FocusedSelectorPreview
  onSelect: (target: SelectorTarget, selector: string) => void
}

const selectorTargets: SelectorTarget[] = [
  "releaseParentSelector",
  "titleSelector",
  "imageSelector",
  "mangaLinkSelector",
  "releaseLinkSelector",
  "releaseTextSelector",
  "releaseTimeSelector",
]
const selectorFocusEventName = "scan-release-selector-focus"

export function VisualSelectorPreview({
  html,
  baseUrl,
  parentSelector,
  focusedSelector,
  onSelect,
}: VisualSelectorPreviewProps) {
  const { t } = useTranslation()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [target, setTarget] = useState<SelectorTarget>("releaseParentSelector")
  const [currentNodeId, setCurrentNodeId] = useState<string>()
  const [selection, setSelection] = useState<SelectorPreviewSelection>()
  const preview = useMemo(
    () => buildSelectorPreviewDocument(html, baseUrl, parentSelector),
    [baseUrl, html, parentSelector]
  )
  const currentNode = currentNodeId ? preview.nodes[currentNodeId] : undefined
  const postCommand = useCallback((command: SelectorPreviewCommand) => {
    iframeRef.current?.contentWindow?.postMessage(command, "*")
  }, [])
  const highlightNode = useCallback(
    (nodeId: string, commit: boolean) => {
      const node = preview.nodes[nodeId]
      const candidate = chooseSelectorCandidate(
        node,
        target !== "releaseParentSelector"
      )

      setCurrentNodeId(nodeId)
      postCommand({
        type: "scan-release-selector-highlight-node",
        nodeId,
        selector: candidate.selector,
      })

      if (!commit) {
        return
      }

      const nextSelection = {
        nodeId,
        selector: candidate.selector,
        matchCount: candidate.matchCount,
      }

      setSelection(nextSelection)
      onSelect(target, candidate.selector)
    },
    [onSelect, postCommand, preview.nodes, target]
  )
  const moveSelection = (direction: SelectorPreviewDirection) => {
    if (!currentNode) {
      return
    }

    const nextNodeId =
      direction === "parent" ? currentNode.parentId : currentNode.firstChildId

    if (nextNodeId) {
      highlightNode(nextNodeId, true)
    }
  }

  useEffect(() => {
    function handleMessage(event: MessageEvent<unknown>) {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        !isSelectorPreviewMessage(event.data)
      ) {
        return
      }

      highlightNode(
        event.data.nodeId,
        event.data.type === "scan-release-selector-picked"
      )
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [highlightNode])

  useEffect(() => {
    if (!focusedSelector?.selector.trim()) {
      return
    }

    setTarget(focusedSelector.target)
    postCommand({
      type: "scan-release-selector-highlight-selector",
      selector: focusedSelector.selector,
    })
  }, [focusedSelector, postCommand])

  useEffect(() => {
    function handleSelectorFocus(event: Event) {
      const detail = (event as CustomEvent<FocusedSelectorPreview | undefined>)
        .detail

      if (!detail?.selector.trim()) {
        postCommand({ type: "scan-release-selector-clear-highlight" })
        return
      }

      setTarget(detail.target)
      postCommand({
        type: "scan-release-selector-highlight-selector",
        selector: detail.selector,
      })
    }

    window.addEventListener(selectorFocusEventName, handleSelectorFocus)
    return () =>
      window.removeEventListener(selectorFocusEventName, handleSelectorFocus)
  }, [postCommand])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          {t("preview.selectorInstructions")}
        </p>
        <ToggleGroup
          value={[target]}
          variant="outline"
          size="sm"
          className="flex w-full flex-wrap justify-start"
          onValueChange={(value) => {
            const nextTarget = value[0]
            if (isSelectorTarget(nextTarget)) {
              setTarget(nextTarget)
              setSelection(undefined)
            }
          }}
        >
          {selectorTargets.map((selectorTarget) => (
            <ToggleGroupItem
              aria-label={t(`preview.targets.${selectorTarget}`)}
              key={selectorTarget}
              value={selectorTarget}
            >
              {t(`preview.targets.${selectorTarget}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <CrosshairIcon className="text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate font-mono text-xs">
            {selection?.selector ?? t("preview.selectorWaiting")}
          </span>
          {selection ? (
            <Badge variant="secondary">
              {t("preview.selectorMatches", { count: selection.matchCount })}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={!currentNode?.parentId}
            onClick={() => moveSelection("parent")}
          >
            <CornerUpLeftIcon data-icon="inline-start" />
            {t("preview.selectParent")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={!currentNode?.firstChildId}
            onClick={() => moveSelection("firstChild")}
          >
            <CornerDownRightIcon data-icon="inline-start" />
            {t("preview.selectFirstChild")}
          </Button>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        className="min-h-[420px] w-full flex-1 rounded-md border bg-white"
        sandbox="allow-scripts allow-same-origin"
        srcDoc={preview.srcDoc}
        title={t("preview.selectorFrameTitle")}
      />
    </div>
  )
}

function isSelectorPreviewMessage(
  value: unknown
): value is SelectorPreviewMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "scan-release-selector-picked" &&
    "nodeId" in value &&
    typeof value.nodeId === "string"
  )
}

function isSelectorTarget(value: string): value is SelectorTarget {
  return selectorTargets.includes(value as SelectorTarget)
}
