import { scanReleaseDb } from "@/lib/db/scan-release-db"
import type { ScanReleaseItem } from "@/types/scan-release.type"

export async function setReleaseItemLockDelay(
  item: ScanReleaseItem,
  delayHours: number
) {
  const now = new Date().toISOString()

  await scanReleaseDb.releaseLocks.put({
    id: item.id,
    itemId: item.id,
    sourceId: item.sourceId,
    title: item.title,
    delayHours: Math.max(1, Math.floor(delayHours)),
    createdAt: now,
    updatedAt: now,
  })
}

export async function unlockReleaseItem(itemId: string) {
  await scanReleaseDb.releaseLocks.delete(itemId)
}
