export type SelectorTarget =
  | "releaseParentSelector"
  | "titleSelector"
  | "imageSelector"
  | "mangaLinkSelector"
  | "releaseLinkSelector"
  | "releaseTextSelector"
  | "releaseTimeSelector"

export type SelectorCandidate = {
  selector: string
  matchCount: number
}

export type SelectorPreviewNode = {
  id: string
  tagName: string
  text: string
  parentId?: string
  firstChildId?: string
  candidates: SelectorCandidate[]
  relativeCandidates: SelectorCandidate[]
}

export type SelectorPreviewDocument = {
  srcDoc: string
  nodes: Record<string, SelectorPreviewNode>
}

export type SelectorPreviewMessage =
  | {
      type: "scan-release-selector-hovered"
      nodeId: string
    }
  | {
      type: "scan-release-selector-picked"
      nodeId: string
    }

export type SelectorPreviewCommand =
  | {
      type: "scan-release-selector-highlight-node"
      nodeId: string
      selector: string
    }
  | {
      type: "scan-release-selector-highlight-selector"
      selector: string
    }
  | {
      type: "scan-release-selector-clear-highlight"
    }

export type FocusedSelectorPreview = {
  target: SelectorTarget
  selector: string
}

export type SelectorPreviewDirection = "parent" | "firstChild"

export type SelectorPreviewSelection = {
  nodeId: string
  selector: string
  matchCount: number
}
