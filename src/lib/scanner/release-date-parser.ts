import {
  isValid,
  parse,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns"

const defaultDateFormats = ["relative-en", "compact-duration", "MM-dd HH:mm"]
const relativeRegex =
  /^(\d+)\s*(minute|minutes|min|mins|m|hour|hours|h|day|days|d|week|weeks|w|month|months|year|years)\s*ago$/i
const lastRegex = /^last\s+(minute|hour|day|week|month|year)$/i
const compactDurationRegex = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i

export function defaultReleaseDateFormats() {
  return [...defaultDateFormats]
}

export function parseReleaseDate(
  value: string | undefined,
  configuredFormats: string[],
  now = new Date()
) {
  if (!value?.trim()) {
    return undefined
  }

  const formats = normalizeDateFormats(configuredFormats)
  const normalizedValue = value.trim()

  for (const format of formats) {
    const parsed = parseWithFormat(normalizedValue, format, now)

    if (parsed) {
      return parsed.toISOString()
    }
  }

  return undefined
}

export function normalizeDateFormats(configuredFormats: string[]) {
  const formats = configuredFormats.flatMap((format) =>
    inferDateFormatRules(format.trim())
  )

  return Array.from(new Set(formats.length > 0 ? formats : defaultDateFormats))
}

function inferDateFormatRules(format: string) {
  if (!format) {
    return []
  }

  if (relativeRegex.test(format) || lastRegex.test(format)) {
    return ["relative-en"]
  }

  if (compactDurationRegex.test(format) && /[hm]/i.test(format)) {
    return ["compact-duration"]
  }

  if (/^\d{1,2}-\d{1,2}\s+\d{1,2}:\d{2}$/.test(format)) {
    return ["MM-dd HH:mm"]
  }

  return [format]
}

function parseWithFormat(value: string, format: string, now: Date) {
  if (format === "relative-en") {
    return parseRelativeEnglishDate(value, now)
  }

  if (format === "compact-duration") {
    return parseCompactDurationDate(value, now)
  }

  if (format === "iso") {
    const date = new Date(value)
    return isValid(date) ? date : undefined
  }

  return parseAbsoluteDate(value, format, now)
}

function parseRelativeEnglishDate(value: string, now: Date) {
  const nowString = ["now"]
  if (nowString.some((needle) => value.toLowerCase().includes(needle))) {
    return now
  }
    const relativeMatch = relativeRegex.exec(value)

  if (relativeMatch) {
    return subtractUnit(now, Number(relativeMatch[1]), relativeMatch[2])
  }

  const lastMatch = lastRegex.exec(value)

  if (lastMatch) {
    return subtractUnit(now, 1, lastMatch[1])
  }

  return undefined
}

function parseCompactDurationDate(value: string, now: Date) {
  const match = compactDurationRegex.exec(value)

  if (!match || !/[hm]/i.test(value)) {
    return undefined
  }

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)

  if (hours === 0 && minutes === 0) {
    return undefined
  }

  return subMinutes(subHours(now, hours), minutes)
}

function parseAbsoluteDate(value: string, format: string, now: Date) {
  const parsed = parse(value, format, now)

  if (!isValid(parsed)) {
    return undefined
  }

  if (parsed.getTime() > now.getTime()) {
    parsed.setFullYear(parsed.getFullYear() - 1)
  }

  return parsed
}

function subtractUnit(now: Date, amount: number, unit: string) {
  const normalizedUnit = unit.toLowerCase()

  if (["minute", "minutes", "min", "mins", "m"].includes(normalizedUnit)) {
    return subMinutes(now, amount)
  }

  if (["hour", "hours", "h"].includes(normalizedUnit)) {
    return subHours(now, amount)
  }

  if (["day", "days", "d"].includes(normalizedUnit)) {
    return subDays(now, amount)
  }

  if (["week", "weeks", "w"].includes(normalizedUnit)) {
    return subWeeks(now, amount)
  }

  if (["month", "months"].includes(normalizedUnit)) {
    return subMonths(now, amount)
  }

  if (["year", "years"].includes(normalizedUnit)) {
    return subYears(now, amount)
  }

  return undefined
}
