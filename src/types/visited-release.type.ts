export type VisitedRelease = {
  id: string
  sourceId: string
  releaseUrl: string
  mangaId?: string
  mangaTitle?: string
  chapterLabel?: string
  visitedAt: string
}

export type VisitedReleaseDraft = {
  sourceId: string
  releaseUrl: string
  mangaId: string
  mangaTitle: string
  chapterLabel: string
}
