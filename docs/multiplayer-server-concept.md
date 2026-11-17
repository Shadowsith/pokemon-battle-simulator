# Technical concept: online multiplayer with a dedicated server

**Status:** concept; not implemented yet · **Scope:** native apps and the web build · **Connection:** internet, WebSocket (`wss://`) to one dedicated server · **Builds on:** [multiplayer-concept.md](multiplayer-concept.md) (local multiplayer)

This document describes how the modes from the local multiplayer concept (PvP 1 vs 1, 2 vs 2, coop vs NPC, coop runs) can be played over the internet through a dedicated server, and how much work that server is.

## Context
The local concept is host-authoritative: one device runs the only `BattleEngine`, the others send commands and render the event stream. A dedicated server fits that design directly: **the server is a headless host.** It takes the host role from the local concept, and every device becomes a client.

What a server adds over local play:
- Play over the internet, not only between nearby devices.
- The web build can take part (WebSocket works in every browser); no native plugin, no OS permissions, no Android ↔ iOS hotspot workaround.
- No device is trusted: the server validates teams and commands and runs the randomness, so nobody can cheat by modifying their app.
- If one player drops out, the battle keeps running on the server; there is no "host left, battle gone" case.

What it costs:
- A server that has to be hosted, kept up to date and paid for.
- Server and app versions have to match (protocol version check, see below).
- Legal / privacy: the server processes IP addresses and player names, so the privacy notes need an update (GDPR).

## Current state of the code (relevant for the server)
- The battle loop has already moved from the page into services in `src/app/pages/battle/services/`: `battle-flow.service.ts` (~590 lines), `move-resolver.service.ts` (~950), `battle-state.service.ts` (~300), `battle-setup.service.ts`.
- These services still mix rules with presentation: about 170 `await` calls on `MoveAnimationService` / `AudioService` / `BattleStageService`, and `BattleStateService` reads `ActivatedRoute`.
- The rule services (`damage-calc`, `status`, `stat-change`) are Angular `@Injectable`s, but have no browser dependencies.
- `Math.random` is still called directly in many files.
- `@pkmn/sim` and the generated JSON in `public/assets/data` are plain JS / JSON and run in Node.js unchanged.

So the server needs exactly what phase 1 of the local concept produces: a headless `BattleEngine` that emits events instead of awaiting animations, with an injected `rng`. On top of that, the engine has to be **free of Angular** (plain classes, constructor parameters instead of `inject()`), so that Node.js can load it without the Angular runtime.

## Platform choice

The decisive point is **where the battle rules live**. They are TypeScript, built on `@pkmn/sim` data, and they grow with almost every commit (new item effects, new move mechanics such as Substitute, Encore, Future Sight, Pain Split …).

| | Node.js + TypeScript | Python (FastAPI / websockets) | ASP.NET Core (SignalR) |
|---|---|---|---|
| Runs the existing engine | **yes, the same source files** | no, the rules have to be ported | no, the rules have to be ported |
| `@pkmn/sim` data | direct import | export to JSON, own loaders | export to JSON, own loaders |
| Rule changes | made once, app and server share them | made twice, in two languages | made twice, in two languages |
| Risk | low | app and server drift apart (different damage, different results) | same as Python |
| WebSocket / rooms | `ws` (mature, small) | good | very good (SignalR groups, reconnect) |
| Hosting | any VPS / container, ~50 MB image | same | same, somewhat larger image |

**Recommendation: Node.js + TypeScript**, with the plain `ws` library (no framework). Python and ASP.NET are both good server platforms in general, but here they would mean writing and maintaining a second battle engine. Every new move or item would have to be built twice, and the smallest difference (rounding, order of effects, a random roll) would make the server's battle differ from what the single-player app does. With Node.js the server imports the same engine files as the app, and the existing engine specs cover both.

ASP.NET (or Python) would only make sense for a **pure relay server** (variant A below) that never looks into the battle. Even then there is little reason to add a second language and toolchain to the project.

Not chosen:
- **Colyseus / Socket.IO:** bring their own state sync and rooms, but the protocol from the local concept already defines rooms, events and reconnects. `ws` plus the existing protocol is less code to understand.
- **Firebase / Supabase realtime:** no place to run the authoritative engine; it would be a relay with extra vendor lock-in.

## Two variants

### Variant A: relay (small, no engine on the server)
One player's device stays the host exactly as in the local concept; the server only forwards frames between room members.
- Server: room codes, joining, forwarding, ping / timeouts. About **200–300 lines**.
- Can be built right after phase 2 of the local concept (session + protocol), before any native plugin.
- Downsides: the host device is trusted (cheating possible), and if the host's app is closed or loses its connection, the battle ends.

### Variant B: authoritative server (recommended target)
The server runs the `BattleEngine` and plays the host role from the local concept.
- Server: everything from A, plus the session host logic (team validation, engine, requests, commands, reconnect with snapshot). About **1,000–1,500 lines** of server-specific code, most of it the lobby / room handling; the battle logic itself is shared.
- Fixes the downsides of A: no trusted client, battles survive any single disconnect.

Variant A is a cheap first step; B replaces it later without changing the client, because the client always speaks the same protocol to "the host", whether that is a phone or the server.

## Architecture

```
┌──────── Dedicated server (Node.js) ────────┐          ┌──── Client (app / web) ────┐
│ WebSocket gateway (ws, wss via proxy)      │  events  │ Session ─ EventPlayer       │
│   │                                        │ ───────▶ │    │        ▼               │
│ RoomManager ─ Room (code, seats, mode)     │ ◀─────── │ BattlePage (render +        │
│                 │                          │ commands │  own-slot input)            │
│           SessionHost ─ BattleEngine (rng) │          │ WebSocketTransport          │
│           Controllers: remote | npc        │          └─────────────────────────────┘
└────────────────────────────────────────────┘
```

### A. Shared engine
- The engine lives in `src/app/core/battle/engine/` as planned in the local concept, with the extra rule that nothing in it imports `@angular/*`, `@capacitor/*` or the DOM. An ESLint `no-restricted-imports` rule for that folder enforces it.
- The rule services the engine needs (`damage-calc`, `status`, `stat-change`) become plain classes; the Angular services stay as thin wrappers (or `providedIn` factories) for the app.
- Dex data: the app loads `public/assets/data/*.json` over HTTP today (`DexDataService`); the engine gets that data through a small `DexSource` interface, implemented with `fetch` in the app and `fs` on the server.
- The **session host logic** from the local concept (`SessionService` in host role: team validation, seats, requests, commands, snapshots) is written in the same Angular-free style, so the local host and the server run the same code.

### B. Server: `server/` (new, separate package)
```
server/
  package.json        # ws, tsx / esbuild; no Angular
  tsconfig.json       # path alias to ../src/app/core/battle/engine and ../src/app/core/multiplayer/host
  src/
    main.ts           # HTTP server, /healthz, WebSocket upgrade
    gateway.ts        # one connection = one player; frame decode, size limit, rate limit
    room-manager.ts   # create / join / leave, room codes, cleanup of idle rooms
    room.ts           # seats, lobby state, wraps the shared SessionHost
  Dockerfile
```
- **Rooms in memory.** No database for v1. A server restart ends running battles (acceptable for a hobby server; deploys happen when nobody is playing).
- **Room codes** (6 characters, no ambiguous letters such as O / 0) instead of public matchmaking. The host shares the code; friends type it in.
- **No accounts.** On join, the server gives the client a random `resumeToken`; with it the client can rejoin its seat after a reconnect. Names and avatars are chosen per session, as in the local lobby.
- **Coop runs:** the run state (`TrainerRunService` save) stays on the room creator's device. The server sends `runState` after each fight; to continue a run later, the creator uploads it again when creating the room. The server validates it like a team (it is only trusted as much as the local host is today).

### C. Client: one more transport
- `WebSocketTransport` implements the existing `MultiplayerTransport` interface. `advertise` / `discover` map to "create room" / "join by code".
- The multiplayer screen gets a third option, **"Online"**, next to "Gleiches WLAN / Hotspot" and "Bluetooth / Direkt". It is the only option in the web build.
- The server URL is a build-time setting (`environment.ts`), with a dev default of `ws://localhost:8787`.

### D. Protocol
The JSON protocol from the local concept (section E) is reused unchanged: `hello` / `welcome`, `lobby`, `setTeam`, `ready`, `events`, `request`, `command`, `snapshot`, `ack`, `ping` / `pong`. Additions:

| Phase | Server → client | Client → server |
|---|---|---|
| Room | `roomCreated { code }`, `roomError { reason: 'notFound' \| 'full' \| 'started' }` | `createRoom { mode, format, run? }`, `joinRoom { code, resumeToken? }` |
| Session | `welcome { …, resumeToken }` | — |

- WebSocket already delivers whole messages, so the 4-byte length framing of the LAN back end is not needed here.
- Reconnect, `ack` resending, idempotent `requestId`, the 30 s grace period, the NPC taking over in coop and the optional turn timer all work as in the local concept; the server applies them.
- `protocol` in `hello` is checked strictly. The server rejects older apps with `reject { reason: 'outdated' }` ("Bitte die App aktualisieren"). After a protocol change the server keeps accepting the previous version for a while, because app-store updates arrive with a delay.

## Security and abuse
The server is reachable from the internet, so the client is never trusted:
- **Validation** as in the local host: teams through `sanitizeMon`, `knownItemId`, learnset legality, ≤ 6 Pokémon; commands only from the engine's `options`; requests only answered by the seat they belong to.
- **Limits:** maximum message size (e.g. 64 KB), messages per second per connection, rooms per IP, idle rooms closed after 10 minutes, finished rooms after 2 minutes.
- **Names:** length limit, control characters stripped; they are only shown to the other players in the same room.
- **Transport:** `wss://` only (required by browsers on https and by iOS App Transport Security). TLS ends at a reverse proxy (Caddy with automatic Let's Encrypt certificates).
- **Origin check** for browser connections (only the app's own web origin and the Capacitor origins).
- **Privacy:** no persistent storage of names or teams. Logs keep IP addresses only briefly (e.g. 7 days) or truncated. The legal notes in the app get a short section on the online mode.

## Hosting and operations
- One small VPS (1 vCPU, 1–2 GB RAM, a few euros per month) is plenty: a battle turn is a few milliseconds of CPU, and an idle room costs almost nothing. One Node.js process can handle hundreds of parallel rooms.
- Deployment: Docker image (`node:22-alpine`), `docker compose` with Caddy in front. A GitHub Actions workflow builds and deploys on a tag.
- Monitoring: `/healthz` endpoint, a simple uptime check, and log lines per room (created, started, finished, errors).
- Scaling beyond one process is not planned. If it is ever needed, rooms can be pinned to processes by room code; there is no shared state between rooms.

## Complexity estimate
Rough effort, assuming phase 1 and 2 of the local concept are done (they are needed for local multiplayer anyway):

| Part | Size | Notes |
|---|---|---|
| Engine without Angular (on top of local phase 1) | small–medium | Plain classes for the rule services, `DexSource`, lint rule. Most work is in local phase 1 itself. |
| Session host logic Angular-free | small | Written that way from the start, no extra cost. |
| Relay server (variant A) | small | 200–300 lines, 1–2 days. |
| Authoritative server (variant B) | medium | Rooms, gateway, limits, reconnect; ~1,000–1,500 lines, about 1–2 weeks. |
| `WebSocketTransport` + "Online" UI | small | The transport interface and lobby exist from the local concept. |
| Hosting, TLS, deploy, privacy notes | small | One-time setup, then occasional updates. |

**Conclusion:** the server itself is not the hard part. With Node.js it is a thin room layer around code that the local multiplayer needs anyway. The real cost is the engine extraction (local phase 1), and that is shared by single player tests, local multiplayer and the server. Choosing Python or ASP.NET would turn the server from the smallest piece into the largest one (a second engine), which is why Node.js is recommended.

## Implementation phases
Run after phase 2 of the local concept (the order relative to local phases 3–6 is free; online can even come first, because it needs no native plugin):
1. **Engine without Angular:** plain rule classes, `DexSource`, lint rule; a Node.js script runs a seeded battle headless and prints the event stream.
2. **Server, relay (optional) or directly authoritative:** `server/` package, rooms, gateway, `SessionHost` in the room, Docker image.
3. **Client:** `WebSocketTransport`, "Online" option, room code UI, reconnect with `resumeToken`.
4. **Operations:** VPS, Caddy, deploy workflow, privacy notes, version check.
5. **Coop and 2 vs 2 online:** follow from local phases 5 and 6 with no server-specific work beyond seat counts.

## Verification
- **Unit:** the engine specs run in Node.js as well as in Karma (same seed and commands, same event stream on both). Room manager: codes, joining full / started rooms, cleanup.
- **Integration:** start the server in-process on a random port, connect two or four `WebSocketTransport` clients from a spec, play a full PvP battle; drop a client mid-turn and rejoin with its `resumeToken`; let the grace period run out in coop and check that the NPC takes over.
- **Abuse:** oversized messages, invalid teams, commands for foreign slots, flooding: the server rejects or disconnects without affecting other rooms.
- **E2E:** Playwright with two browser contexts against a local server (`ws://localhost:8787`): create room → join by code → battle → result, both views showing the same HP and log.
- **Devices (manual):** Android ↔ iOS ↔ web over mobile data and Wi-Fi, switching from Wi-Fi to mobile data mid-battle (reconnect).
