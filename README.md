# Scan Release List

Scan Release List aggregates manga and webtoon releases from configurable
websites. Define a source with CSS selectors, scan it, and browse the latest
chapters in a compact responsive dashboard. Source configuration, favorites,
hidden entries, delayed releases, and reading state stay in the browser.

## Features

- Create, edit, duplicate, enable, disable, and delete scan sources
- Configure title, cover, manga link, chapter, timestamp, and cleanup selectors
- Preview a source configuration while editing it
- Parse relative, compact-duration, ISO, and date-fns-compatible dates
- Merge enabled sources and sort manga by their latest parsed release
- Mark manga as favorites for quick visual recognition
- Hide/unhide entries with a short undo window
- Delay a manga's releases for a configurable number of hours
- Track visited chapters and show recent distinct manga history
- Render large lists incrementally with window virtualization
- Fetch source pages either through the TanStack Start server or directly from
  the browser when CORS allows it
- Optionally proxy covers that require a referer header
- Selectively import/export sources, favorites, hidden entries, delayed
  releases, and visit history as JSON
- French and English UI; persistent dark and light themes

## How it works

The browser stores source configurations, favorite and hidden identities,
release delay rules, and visit history in IndexedDB through Dexie. Scanning uses
the source's fetch mode:

- **Server** calls a TanStack Start server function, which downloads the
  configured page with a desktop-like user agent.
- **Browser** fetches the page directly from the browser, which only works when
  the target site permits CORS.

Both modes accept HTML/XHTML responses up to 4 MB. The browser then parses the
HTML with the source's CSS selectors. Results are transient and refreshed when
sources change or when the user scans again.

Because remote pages are fetched server-side, this application requires a
TanStack Start server runtime; it is not a static-only site.

## Getting started

Requirements:

- Node.js 22 or newer
- [pnpm](https://pnpm.io/)

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Add a source manually or
use **Example** to insert the bundled Natomanga configuration, then select
**Scan**. Site markup changes over time, so example selectors may eventually
need adjustment.

## Configuring a source

A source contains:

- a display name, source color, enabled state, and base page URL;
- a parent selector identifying release cards/rows;
- optional selectors for nodes to remove before parsing;
- selectors for the title, cover image, and manga link;
- one to three chapter definitions, each containing a link selector, one or
  more text selectors whose values are concatenated, and an optional timestamp
  selector;
- date rules such as `relative-en`, `compact-duration`, `iso`, or a
  [date-fns parse format](https://date-fns.org/docs/parse);
- a fetch mode, either server-side or browser-side;
- an optional image proxy switch for hosts requiring a referer.

Relative links and image URLs are resolved against the source URL. A malformed
or incomplete release is skipped; an invalid CSS selector is reported on that
source.

## Local data and backups

The IndexedDB database is named `scan-release-list` and contains:

| Store              | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `sources`          | User-defined scraper configurations      |
| `favoriteReleases` | Favorite manga identities                |
| `hiddenReleases`   | Reversible hidden manga identities       |
| `releaseLocks`     | Per-manga release delay rules            |
| `visitedReleases`  | Visited chapter links and recent history |

Use **Export** to choose sources and data categories, and **Import** to merge a
versioned JSON backup into the current database. Imports validate URLs, ISO
dates, selector counts, string lengths, and list sizes before upserting matching
IDs; they do not replace the whole database. Scan results are not exported
because they are not persisted.

Browser storage is local to the current origin and browser profile. Clearing
site data removes it, so export a backup before doing so.

## Development

```bash
pnpm test       # Vitest suite
pnpm typecheck  # strict TypeScript
pnpm lint       # ESLint
pnpm check      # Prettier check
pnpm format     # apply Prettier
pnpm build      # production build
NITRO_PRESET=vercel pnpm build  # Vercel build output
pnpm preview    # preview the build
```

## Vercel deployment

The app uses TanStack Start server functions and is deployed through Nitro's
Vercel preset. Vercel is configured by `vercel.json` to run:

```bash
pnpm install --frozen-lockfile
NITRO_PRESET=vercel pnpm build
```

The Vercel build writes the Build Output API files to `.vercel/output`.

Main directories:

```text
src/components/       Feature and shadcn/ui components
src/hooks/            Reactive data hooks
src/lib/db/           Dexie schema and import/export
src/lib/scanner/      Remote fetch functions and HTML/date parsers
src/lib/i18n/         French/English translations
src/lib/*-releases/   Favorite, hidden, and visited repositories
src/lib/release-locks/ Release delay repository and time adjustment
src/routes/           TanStack Router routes
src/types/            Shared domain types
```

See [AGENTS.md](AGENTS.md) for architecture conventions, verification rules,
and the project Git workflow.

## Security and deployment

Treat source URLs and imported backups as trusted-user input in the current
version. The server fetch endpoints accept arbitrary HTTP(S) destinations and
do not yet block private or metadata-network addresses. Do not expose the app
to untrusted users without SSRF protection, redirect/DNS validation, request
timeouts, and rate limiting.

The proxied-image endpoint only accepts HTTP(S), limits responses to 2 MB, and
allows common image content types (`avif`, `gif`, `jpeg`, `png`, and `webp`).
It still depends on the same destination-trust assumptions as page fetching.

No credentials are required or intended to be stored by the application.
