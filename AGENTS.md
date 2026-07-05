# Project Agent Guide

## Product Goal

Build a React + TanStack Start application that lets a user configure scan release sources in the UI, persist them client-side, fetch and parse releases from configured sites, and display releases in a dense manga/webtoon release list.

## Architecture Rules

- Use SOLID principles for application code.
- Keep responsibilities separated:
  - UI components render data and dispatch user actions.
  - Hooks coordinate UI state and data access.
  - Services contain parsing, scraping, persistence, and import/export logic.
  - Dexie database setup lives under `src/lib/db`.
  - Domain types live in `src/types` and every type file must be named `*.type.ts`.
- Prefer small pure functions for DOM parsing and URL normalization.
- Keep external-site scraping defensive: selectors may be missing and should not crash the entire scan.
- Never store server secrets. The app is client-side first.

## TypeScript Rules

- Use explicit domain types for persisted records and parsed releases.
- Do not place shared domain types inside component files.
- Avoid `any`; use narrow types and safe parsing.
- Keep discriminated unions for UI states when a boolean is not expressive enough.

## UI Rules

- Use shadcn/ui components before custom controls.
- Use semantic Tailwind tokens and avoid raw color utility styling when component variants exist.
- Use icon buttons with tooltips for compact actions such as hide, unhide, refresh, edit, and delete.
- The release list should remain scannable, compact, and usable on desktop and mobile.
- Hidden releases are excluded by default and can be shown with a switch.

## Data Rules

- Dexie is the source of truth for configured sites and hidden release keys.
- Hidden release state must be reversible.
- A release identity should be stable across refreshes using source id, manga URL/title, and release URL/text.

## Git Workflow

- Start from `main`.
- Create `develop` from `main`.
- Create feature branches from `develop` using:
  - `feature/xxxxxxxxxxxxxxx`
  - `fix/xxxxxxxxxxxxxxxxxx`
  - `refactor/xxxxxxxxxxxxxxxxxxx`
- Merge feature, fix, and refactor branches back into `develop` with `--no-ff`.
- Make regular commits with focused messages.

## Verification

- Run typecheck and build before delivering.
- When UI behavior changes, run the local dev server and verify the main flow in browser when feasible.
