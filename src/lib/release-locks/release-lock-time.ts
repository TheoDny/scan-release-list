import type { ScanReleaseLink } from "@/types/scan-release.type"

const minuteMs = 60_000
const hourMs = 60 * minuteMs

export function adjustedReleaseTime(
  release: ScanReleaseLink,
  lockDelayHours: number | undefined
) {
  if (!release.releasedAt) {
    return undefined
  }

  const releasedAt = Date.parse(release.releasedAt)

  if (Number.isNaN(releasedAt)) {
    return undefined
  }

  return releasedAt + lockDelayMs(lockDelayHours)
}

export function releaseLockRemainingMs(
  release: ScanReleaseLink,
  lockDelayHours: number | undefined,
  now = Date.now()
) {
  const adjustedTime = adjustedReleaseTime(release, lockDelayHours)

  if (!adjustedTime) {
    return 0
  }

  return Math.max(0, adjustedTime - now)
}

export function isReleaseLocked(
  release: ScanReleaseLink,
  lockDelayHours: number | undefined,
  now = Date.now()
) {
  return releaseLockRemainingMs(release, lockDelayHours, now) > 0
}

export function elapsedSinceAdjustedReleaseMs(
  release: ScanReleaseLink,
  lockDelayHours: number | undefined,
  now = Date.now()
) {
  const adjustedTime = adjustedReleaseTime(release, lockDelayHours)

  if (!adjustedTime) {
    return undefined
  }

  return now - adjustedTime
}

export function formatElapsedTime(elapsedMs: number) {
  const elapsedMinutes = Math.max(1, Math.floor(elapsedMs / minuteMs))

  if (elapsedMinutes < 60) {
    return pluralizeElapsed(elapsedMinutes, "minute", " ago")
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60)

  if (elapsedHours < 24) {
    return pluralizeElapsed(elapsedHours, "hour", " ago")
  }

  const elapsedDays = Math.floor(elapsedHours / 24)

  if (elapsedDays < 7) {
    return pluralizeElapsed(elapsedDays, "day", " ago")
  }

  const elapsedWeeks = Math.floor(elapsedDays / 7)

  if (elapsedWeeks < 5) {
    return pluralizeElapsed(elapsedWeeks, "week", " ago")
  }

  const elapsedMonths = Math.floor(elapsedDays / 30)

  if (elapsedMonths < 12) {
    return pluralizeElapsed(Math.max(1, elapsedMonths), "month", " ago")
  }

  return pluralizeElapsed(Math.floor(elapsedDays / 365), "year", " ago")
}

export function formatDuration(durationMs: number) {
  const durationMinutes = Math.max(1, Math.ceil(durationMs / minuteMs))

  if (durationMinutes < 60) {
    return pluralizeElapsed(durationMinutes, "minute", "")
  }

  const durationHours = Math.ceil(durationMinutes / 60)

  if (durationHours < 24) {
    return pluralizeElapsed(durationHours, "hour", "")
  }

  const durationDays = Math.ceil(durationHours / 24)

  return pluralizeElapsed(durationDays, "day", "")
}

function lockDelayMs(lockDelayHours: number | undefined) {
  return lockDelayHours ? lockDelayHours * hourMs : 0
}

function pluralizeElapsed(value: number, unit: string, suffix: string) {
  return `${value} ${unit}${value > 1 ? "s" : ""}${suffix}`
}
