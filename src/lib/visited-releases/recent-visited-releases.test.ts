import { describe, expect, it } from "vitest"

import { recentDistinctMangaVisits } from "./recent-visited-releases"
import type { VisitedRelease } from "@/types/visited-release.type"

const visits: VisitedRelease[] = [
  visit("manga-1", "Chapter 2", "2026-07-09T12:00:00.000Z"),
  visit("manga-2", "Chapter 8", "2026-07-09T11:00:00.000Z"),
  visit("manga-1", "Chapter 1", "2026-07-09T10:00:00.000Z"),
]

describe("recentDistinctMangaVisits", () => {
  it("keeps only the latest chapter for each manga", () => {
    expect(
      recentDistinctMangaVisits(visits).map((entry) => entry.chapterLabel)
    ).toEqual(["Chapter 2", "Chapter 8"])
  })

  it("limits the history size", () => {
    expect(recentDistinctMangaVisits(visits, 1)).toHaveLength(1)
  })

  it("shows up to ten entries by default", () => {
    const manyVisits = Array.from({ length: 12 }, (_, index) =>
      visit(
        `manga-${index}`,
        `Chapter ${index}`,
        new Date(Date.UTC(2026, 6, 9, 12, index)).toISOString()
      )
    )

    expect(recentDistinctMangaVisits(manyVisits)).toHaveLength(10)
  })
})

function visit(
  mangaId: string,
  chapterLabel: string,
  visitedAt: string
): VisitedRelease {
  return {
    id: `${mangaId}-${chapterLabel}`,
    sourceId: "source",
    releaseUrl: `https://example.com/${mangaId}/${chapterLabel}`,
    mangaId,
    mangaTitle: mangaId,
    chapterLabel,
    visitedAt,
  }
}
