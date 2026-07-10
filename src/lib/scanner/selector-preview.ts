import type {
  SelectorCandidate,
  SelectorPreviewDocument,
  SelectorPreviewNode,
} from "@/types/selector-preview.type"

const previewNodeAttribute = "data-srl-node-id"
const removableElements =
  "script, iframe, frame, object, embed, form, input, button, textarea, select, meta[http-equiv], base"
const urlAttributes = ["href", "src", "poster"]
const preferredAttributes = [
  "data-testid",
  "data-id",
  "data-manga-id",
  "data-title",
  "itemprop",
  "name",
  "role",
  "aria-label",
]
const generatedClassPattern =
  /^(?:css|jsx|sc|chakra|mantine|emotion|jss|style)[-_]?[a-z0-9]{5,}$/i
const maxPreviewNodes = 250

export function buildSelectorPreviewDocument(
  html: string,
  baseUrl: string,
  parentSelector: string
): SelectorPreviewDocument {
  const document = new DOMParser().parseFromString(html, "text/html")

  sanitizeDocument(document, baseUrl)

  const boundary = safeQuerySelector(document, parentSelector)
  const nodes: Record<string, SelectorPreviewNode> = {}
  const selectorContext = createSelectorCandidateContext()

  const elements = prioritizedPreviewElements(document, boundary)

  elements.forEach((element, index) => {
    const id = `node-${index}`
    element.setAttribute(previewNodeAttribute, id)
  })

  elements.forEach((element) => {
    const id = element.getAttribute(previewNodeAttribute)
    const firstChild = Array.from(element.children).find((child) =>
      child.hasAttribute(previewNodeAttribute)
    )

    if (!id) {
      return
    }

    nodes[id] = {
      id,
      tagName: element.tagName.toLowerCase(),
      text: element.textContent.replace(/\s+/g, " ").trim().slice(0, 120),
      parentId:
        element.parentElement?.getAttribute(previewNodeAttribute) ?? undefined,
      firstChildId: firstChild?.getAttribute(previewNodeAttribute) ?? undefined,
      candidates: selectorCandidates(element, document, selectorContext),
      relativeCandidates:
        boundary && boundary.contains(element)
          ? selectorCandidates(element, boundary, selectorContext)
          : [],
    }
  })

  injectPreviewAssets(document)

  return {
    srcDoc: `<!doctype html>${document.documentElement.outerHTML}`,
    nodes,
  }
}

function prioritizedPreviewElements(
  document: Document,
  boundary: Element | null
) {
  const elements = boundary
    ? [
        boundary,
        ...Array.from(boundary.querySelectorAll("*")),
        ...Array.from(document.body.querySelectorAll("*")).filter(
          (element) => element !== boundary && !boundary.contains(element)
        ),
      ]
    : Array.from(document.body.querySelectorAll("*"))

  return elements.slice(0, maxPreviewNodes)
}

export function chooseSelectorCandidate(
  node: SelectorPreviewNode,
  relative: boolean
) {
  const candidates =
    relative && node.relativeCandidates.length > 0
      ? node.relativeCandidates
      : node.candidates

  return candidates[0]
}

function sanitizeDocument(document: Document, baseUrl: string) {
  document.querySelectorAll(removableElements).forEach((element) => {
    element.remove()
  })

  document.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()

      if (
        name.startsWith("on") ||
        name === "srcdoc" ||
        name === "formaction" ||
        name === "ping"
      ) {
        element.removeAttribute(attribute.name)
      }
    })

    for (const attribute of urlAttributes) {
      const value = element.getAttribute(attribute)

      if (!value) {
        continue
      }

      const normalized = normalizePreviewUrl(value, baseUrl)
      if (normalized) {
        element.setAttribute(attribute, normalized)
      } else {
        element.removeAttribute(attribute)
      }
    }
  })
}

function normalizePreviewUrl(value: string, baseUrl: string) {
  try {
    const url = new URL(value, baseUrl)
    return ["http:", "https:", "data:"].includes(url.protocol)
      ? url.toString()
      : undefined
  } catch {
    return undefined
  }
}

function selectorCandidates(
  element: Element,
  root: ParentNode,
  context: SelectorCandidateContext
) {
  const selectors = candidateSelectorStrings(element, root, context)
  const candidates: SelectorCandidate[] = []

  for (const selector of selectors) {
    if (candidates.length > 0 && selector.includes(":nth-of-type(")) {
      continue
    }

    const matchCount = selectorMatchCount(root, selector, context)

    if (
      matchCount > 0 &&
      !candidates.some((candidate) => candidate.selector === selector)
    ) {
      candidates.push({ selector, matchCount })
    }
  }

  return candidates
}

function candidateSelectorStrings(
  element: Element,
  root: ParentNode,
  context: SelectorCandidateContext
) {
  const tag = element.tagName.toLowerCase()
  const selectors = directChildSelectorStrings(element, root, context)
  const id = element.getAttribute("id")

  if (id && isStableIdentifier(id)) {
    selectors.push(`#${escapeIdentifier(id)}`)
  }

  for (const attribute of preferredAttributes) {
    const value = element.getAttribute(attribute)
    if (value && value.length <= 80) {
      selectors.push(`[${attribute}="${escapeAttribute(value)}"]`)
      selectors.push(`${tag}[${attribute}="${escapeAttribute(value)}"]`)
    }
  }

  const classes = Array.from(element.classList)
    .filter(isStableIdentifier)
    .slice(0, 3)

  for (const className of classes) {
    selectors.push(`.${escapeIdentifier(className)}`)
    selectors.push(`${tag}.${escapeIdentifier(className)}`)
  }

  if (classes.length >= 2) {
    selectors.push(
      `${tag}.${classes.slice(0, 2).map(escapeIdentifier).join(".")}`
    )
  }

  selectors.push(tag)

  selectors.push(`${tag}:nth-of-type(${elementIndexOfType(element)})`)

  return selectors
}

function directChildSelectorStrings(
  element: Element,
  root: ParentNode,
  context: SelectorCandidateContext
) {
  const parent = element.parentElement

  if (!parent || root === element || !isWithinRoot(parent, root)) {
    return []
  }

  const childSelector = preferredLocalSelector(element)

  if (parent === root && isElementNode(root)) {
    return [`:scope > ${childSelector}`]
  }

  return parentSelectorStrings(parent, root, context).map(
    (parentSelector) => `${parentSelector} > ${childSelector}`
  )
}

function parentSelectorStrings(
  element: Element,
  root: ParentNode,
  context: SelectorCandidateContext
) {
  return candidateSelectorStringsWithoutParent(element).filter(
    (selector) => selectorMatchCount(root, selector, context) > 0
  )
}

function candidateSelectorStringsWithoutParent(element: Element) {
  const tag = element.tagName.toLowerCase()
  const id = element.getAttribute("id")
  const classes = Array.from(element.classList).filter(isStableIdentifier)

  return [
    ...(id && isStableIdentifier(id) ? [`#${escapeIdentifier(id)}`] : []),
    ...classes
      .slice(0, 2)
      .map((className) => `${tag}.${escapeIdentifier(className)}`),
    ...classes
      .slice(0, 2)
      .map((className) => `.${escapeIdentifier(className)}`),
    tag,
  ]
}

function preferredLocalSelector(element: Element) {
  const tag = element.tagName.toLowerCase()
  const id = element.getAttribute("id")

  if (id && isStableIdentifier(id)) {
    return `#${escapeIdentifier(id)}`
  }

  const attributeSelector = preferredAttributes
    .map((attribute) => {
      const value = element.getAttribute(attribute)
      return value && value.length <= 80
        ? `${tag}[${attribute}="${escapeAttribute(value)}"]`
        : undefined
    })
    .find(Boolean)

  if (attributeSelector) {
    return attributeSelector
  }

  const className = Array.from(element.classList).find(isStableIdentifier)

  return className
    ? `${tag}.${escapeIdentifier(className)}`
    : `${tag}:nth-of-type(${elementIndexOfType(element)})`
}

function elementIndexOfType(element: Element) {
  const siblings = Array.from(element.parentElement?.children ?? []).filter(
    (sibling) => sibling.tagName === element.tagName
  )
  return Math.max(1, siblings.indexOf(element) + 1)
}

function isWithinRoot(element: Element, root: ParentNode) {
  return root instanceof Document || root === element || root.contains(element)
}

function isElementNode(value: ParentNode): value is Element {
  return "nodeType" in value && value.nodeType === 1
}

function isStableIdentifier(value: string) {
  return (
    value.length > 0 &&
    value.length <= 64 &&
    !generatedClassPattern.test(value) &&
    !/^\d+$/.test(value)
  )
}

function escapeIdentifier(value: string) {
  return value.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, (match) => `\\${match}`)
}

function escapeAttribute(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

function safeQuerySelector(root: ParentNode, selector: string) {
  if (!selector.trim()) {
    return null
  }

  try {
    return root.querySelector(selector)
  } catch {
    return null
  }
}

function safeQuerySelectorAll(root: ParentNode, selector: string) {
  try {
    return Array.from(root.querySelectorAll(selector))
  } catch {
    return []
  }
}

type SelectorCandidateContext = {
  rootIds: WeakMap<ParentNode, number>
  matchCounts: Map<string, number>
  nextRootId: number
}

function createSelectorCandidateContext(): SelectorCandidateContext {
  return {
    rootIds: new WeakMap(),
    matchCounts: new Map(),
    nextRootId: 1,
  }
}

function selectorMatchCount(
  root: ParentNode,
  selector: string,
  context: SelectorCandidateContext
) {
  const rootId = selectorRootId(root, context)
  const cacheKey = `${rootId}:${selector}`
  const cached = context.matchCounts.get(cacheKey)

  if (cached !== undefined) {
    return cached
  }

  const matchCount = safeQuerySelectorAll(root, selector).length
  context.matchCounts.set(cacheKey, matchCount)

  return matchCount
}

function selectorRootId(root: ParentNode, context: SelectorCandidateContext) {
  const cached = context.rootIds.get(root)

  if (cached !== undefined) {
    return cached
  }

  const rootId = context.nextRootId
  context.nextRootId += 1
  context.rootIds.set(root, rootId)

  return rootId
}

function injectPreviewAssets(document: Document) {
  const style = document.createElement("style")
  style.textContent = `
    [${previewNodeAttribute}] { cursor: crosshair !important; }
    .srl-selector-highlight {
      outline: 3px solid #7c3aed !important;
      outline-offset: 2px !important;
    }
    .srl-selector-label {
      position: fixed !important;
      max-width: min(520px, calc(100vw - 24px)) !important;
      z-index: 2147483647 !important;
      border-radius: 6px !important;
      background: #7c3aed !important;
      color: white !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22) !important;
      padding: 4px 8px !important;
      font: 12px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      pointer-events: none !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
  `

  const script = document.createElement("script")
  script.textContent = `
    (() => {
      const attribute = ${JSON.stringify(previewNodeAttribute)};
      let highlighted;
      const label = document.createElement("div");
      label.className = "srl-selector-label";
      label.hidden = true;
      document.body.append(label);

      function elementFromNodeId(nodeId) {
        return document.querySelector("[" + attribute + "='" + CSS.escape(nodeId) + "']");
      }

      function clearHighlight() {
        highlighted?.classList.remove("srl-selector-highlight");
        highlighted = undefined;
        label.hidden = true;
      }

      function moveLabel(element, selector) {
        const rect = element.getBoundingClientRect();
        label.textContent = selector;
        label.hidden = false;
        const top = Math.max(8, rect.top - label.offsetHeight - 8);
        const left = Math.min(
          Math.max(8, rect.left),
          Math.max(8, window.innerWidth - label.offsetWidth - 8)
        );
        label.style.top = top + "px";
        label.style.left = left + "px";
      }

      function highlightElement(element, selector) {
        if (!element || !selector) {
          clearHighlight();
          return;
        }

        if (highlighted !== element) {
          highlighted?.classList.remove("srl-selector-highlight");
          highlighted = element;
          highlighted.classList.add("srl-selector-highlight");
        }

        moveLabel(element, selector);
      }

      function closestPreviewNode(target) {
        return target instanceof Element ? target.closest("[" + attribute + "]") : null;
      }

      document.addEventListener("pointerover", (event) => {
        const element = closestPreviewNode(event.target);
        const nodeId = element?.getAttribute(attribute);
        if (!nodeId) return;
        window.parent.postMessage({
          type: "scan-release-selector-hovered",
          nodeId
        }, "*");
      });

      document.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const element = closestPreviewNode(event.target);
        const nodeId = element?.getAttribute(attribute);
        if (!nodeId) return;
        window.parent.postMessage({
          type: "scan-release-selector-picked",
          nodeId
        }, "*");
      }, true);

      window.addEventListener("message", (event) => {
        const data = event.data;
        if (!data || typeof data !== "object" || typeof data.type !== "string") {
          return;
        }

        if (data.type === "scan-release-selector-highlight-node") {
          highlightElement(elementFromNodeId(data.nodeId), data.selector);
          return;
        }

        if (data.type === "scan-release-selector-highlight-selector") {
          try {
            highlightElement(document.querySelector(data.selector), data.selector);
          } catch {
            clearHighlight();
          }
          return;
        }

        if (data.type === "scan-release-selector-clear-highlight") {
          clearHighlight();
        }
      });

      window.addEventListener("scroll", () => {
        if (!highlighted || label.hidden) return;
        moveLabel(highlighted, label.textContent);
      }, true);

      window.addEventListener("resize", () => {
        if (!highlighted || label.hidden) return;
        moveLabel(highlighted, label.textContent);
      });
    })();
  `

  document.head.append(style)
  document.body.append(script)
}
