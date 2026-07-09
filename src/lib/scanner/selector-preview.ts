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

export function buildSelectorPreviewDocument(
  html: string,
  baseUrl: string,
  parentSelector: string
): SelectorPreviewDocument {
  const document = new DOMParser().parseFromString(html, "text/html")

  sanitizeDocument(document, baseUrl)

  const boundary = safeQuerySelector(document, parentSelector)
  const nodes: Record<string, SelectorPreviewNode> = {}

  const elements = Array.from(document.body.querySelectorAll("*"))

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
      candidates: selectorCandidates(element, document),
      relativeCandidates:
        boundary && boundary.contains(element)
          ? selectorCandidates(element, boundary)
          : [],
    }
  })

  injectPreviewAssets(document)

  return {
    srcDoc: `<!doctype html>${document.documentElement.outerHTML}`,
    nodes,
  }
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

function selectorCandidates(element: Element, root: ParentNode) {
  const selectors = candidateSelectorStrings(element, root)
  const candidates: SelectorCandidate[] = []

  for (const selector of selectors) {
    const matchCount = safeQuerySelectorAll(root, selector).length

    if (
      matchCount > 0 &&
      !candidates.some((candidate) => candidate.selector === selector)
    ) {
      candidates.push({ selector, matchCount })
    }
  }

  return candidates
}

function candidateSelectorStrings(element: Element, root: ParentNode) {
  const tag = element.tagName.toLowerCase()
  const selectors: string[] = []
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

  const parent = element.parentElement
  if (parent && root !== element && isWithinRoot(parent, root)) {
    const parentSelector = shortestDistinctSelector(parent, root)
    const childSelector =
      classes.length > 0
        ? `${tag}.${escapeIdentifier(classes[0])}`
        : `${tag}:nth-of-type(${elementIndexOfType(element)})`

    if (parentSelector) {
      selectors.push(`${parentSelector} > ${childSelector}`)
    }
  }

  selectors.push(`${tag}:nth-of-type(${elementIndexOfType(element)})`)

  return selectors
}

function shortestDistinctSelector(element: Element, root: ParentNode) {
  return candidateSelectorStringsWithoutParent(element).find(
    (selector) => safeQuerySelectorAll(root, selector).length <= 8
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
      .map((className) => `.${escapeIdentifier(className)}`),
    tag,
  ]
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
