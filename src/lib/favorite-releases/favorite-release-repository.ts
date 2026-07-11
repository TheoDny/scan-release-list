import { scanReleaseDb } from "@/lib/db/scan-release-db"
import type { ScanReleaseItem } from "@/types/scan-release.type"

export async function addFavoriteReleaseItem(item: ScanReleaseItem) {
  await scanReleaseDb.favoriteReleases.put({
    id: item.id,
    itemId: item.id,
    sourceId: item.sourceId,
    title: item.title,
    createdAt: new Date().toISOString(),
  })
}

export async function removeFavoriteReleaseItem(itemId: string) {
  await scanReleaseDb.favoriteReleases.delete(itemId)
}

export async function toggleFavoriteReleaseItem(
  item: ScanReleaseItem,
  favorite: boolean
) {
  if (favorite) {
    await removeFavoriteReleaseItem(item.id)
    return
  }

  await addFavoriteReleaseItem(item)
}
