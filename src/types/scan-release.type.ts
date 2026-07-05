export type ScanReleaseLink = {
  id: string
  url: string
  label: string
  timeLabel?: string
}

export type ScanReleaseItem = {
  id: string
  sourceId: string
  sourceName: string
  title: string
  imageUrl?: string
  mangaUrl?: string
  releases: ScanReleaseLink[]
}

export type ScanSourceResult = {
  sourceId: string
  sourceName: string
  scannedAt: string
  items: ScanReleaseItem[]
  error?: string
}
