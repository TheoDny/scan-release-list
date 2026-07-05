export type ReleaseLinkSelector = {
  id: string
  linkSelector: string
  textSelectors: string[]
  timeSelector?: string
}

export type ReleaseSource = {
  id: string
  name: string
  baseUrl: string
  releaseParentSelector: string
  deleteSelectors: string[]
  titleSelector: string
  imageSelector: string
  mangaLinkSelector: string
  releaseSelectors: ReleaseLinkSelector[]
  createdAt: string
  updatedAt: string
}

export type ReleaseSourceDraft = Omit<
  ReleaseSource,
  "id" | "createdAt" | "updatedAt"
>
