import { scanReleaseDb } from "@/lib/db/scan-release-db"
import type { ScanReleaseItem } from "@/types/scan-release.type"

export async function hideReleaseItem(item: ScanReleaseItem) {
  await scanReleaseDb.hiddenReleases.put({
    id: item.id,
    itemId: item.id,
    sourceId: item.sourceId,
    title: item.title,
    createdAt: new Date().toISOString(),
  })
}

export async function showReleaseItem(itemId: string) {
  await scanReleaseDb.hiddenReleases.delete(itemId)
}

export async function toggleReleaseItemVisibility(
  item: ScanReleaseItem,
  isHidden: boolean
) {
  if (isHidden) {
    await showReleaseItem(item.id)
    return
  }

  await hideReleaseItem(item)
}
