export type ReleaseLinkSelector = {
  id: string
  linkSelector: string
  textSelectors: string[]
  timeSelector?: string
}

export type ReleaseFetchMode = "server" | "browser" | "rendered"

export type ReleaseSource = {
  id: string
  name: string
  enabled: boolean
  fetchMode: ReleaseFetchMode
  color: string
  proxyImages: boolean
  baseUrl: string
  releaseParentSelector: string
  deleteSelectors: string[]
  titleSelector: string
  imageSelector: string
  mangaLinkSelector: string
  dateFormats: string[]
  releaseSelectors: ReleaseLinkSelector[]
  createdAt: string
  updatedAt: string
}

export type ReleaseSourceDraft = Omit<
  ReleaseSource,
  "id" | "createdAt" | "updatedAt"
>
