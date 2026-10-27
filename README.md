# CodersCollaboration (Next.js)

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Lucide · Motion.
`frontend/` is the original static prototype, kept untouched as the design reference (excluded from lint/tsc).

## Run
    cp .env.example .env.local
    npm install
    npm run lint && npm run typecheck && npm run build
    npm run dev

## Routes
- `/` landing: navbar, hero, features, use cases, how it works, FAQ, CTA band, footer
- `/code/[room]` editor with five panes (HTML, CSS, JS, Console, Output)
- `/new` is not needed: "Start a session" calls `API.createRoom()`, plays the circle wipe, then routes to `/code/<id>`

## Backend (src/lib/collab.ts, the only file that talks to a server)
| Hook | Real backend | Fallback (env vars empty) |
|---|---|---|
| `API.createRoom()` | `POST $NEXT_PUBLIC_API_URL/api/rooms` -> `{ id }` | random 10-char id |
| `API.join(room)` / `API.onChange(room, files)` | socket.io at `$NEXT_PUBLIC_SOCKET_URL`: emit `join-room` (id), emit `code-change` `{ room, files }` | BroadcastChannel (tabs of one browser) |
| `API.onRemote(cb)` | listens for `code-change` (`files` or `{ files }`) | BroadcastChannel |

`files` is `{ html, css, js }`. If your server uses different event names or payloads, change them in `openSocket()` only.

## Structure
- Server Components: page, hero, sections, footer. Client only where needed: navbar, hero typing animation, scroll reveal, accordion, session provider (circle-wipe overlay lives in the root layout so it survives the route change), editor.
- `prefers-reduced-motion`: Motion `reducedMotion="user"`, the hero shows final code, the wipe is skipped, CSS animations disabled.
