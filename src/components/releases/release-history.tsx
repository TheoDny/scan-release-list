import { HistoryIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { VisitedRelease } from "@/types/visited-release.type"

type ReleaseHistoryProps = {
  visits: VisitedRelease[]
}

export function ReleaseHistory({ visits }: ReleaseHistoryProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HistoryIcon />
          Historique
        </CardTitle>
        <CardDescription>Dernières consultations</CardDescription>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucun chapitre consulté.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {visits.map((visit) => (
              <li className="min-w-0" key={visit.id}>
                <a
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 text-xs hover:underline"
                  href={visit.releaseUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="truncate font-medium">
                    {visit.mangaTitle}
                  </span>
                  <span className="max-w-28 truncate text-muted-foreground">
                    {visit.chapterLabel}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
