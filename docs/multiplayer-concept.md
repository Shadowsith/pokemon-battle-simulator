# Technical concept: local multiplayer (PvP + coop)

**Status:** concept; not implemented yet · **Scope:** native apps only (Android / iOS via Capacitor) · **Connection:** Wi-Fi / hotspot / Bluetooth, no server

This document describes how local multiplayer between nearby devices can be built: PvP (1 vs 1, 2 vs 2) and coop (multi battles against the NPC, coop Top-Vier / Arenaleiter runs). The implementation happens in the phases described below, each one separately.

## Context
All battles today are single-player against the NPC. The goal is local multiplayer between nearby devices, without a server and without internet:
- **PvP:** 1 vs 1 (singles or doubles), and 2 vs 2 with four devices.
- **Coop:** two players fight an NPC together as a multi battle (random, custom, or a coop Top-Vier / Arenaleiter run).

It only exists in the native Capacitor apps (Android and iOS, mixed pairs included); the web build hides it.

**Constraints from the current code:**
- The whole battle (state, turn order, damage, items, AI) lives in [battle.page.ts](../src/app/pages/battle/battle.page.ts), about 1,786 lines, mixed with about 26 `await animation / audio` calls.
- Randomness (`Math.random`) is spread over about 10 engine files: damage-calc, status, stat-change, npc-ai, battle-format, item-effects …
- So two devices can't run the battle side by side and stay in sync (no lockstep). One device has to be authoritative.
- `android/` and `ios/` don't exist yet (`npx cap add` is still to be run).

## Core decisions
1. **Host-authoritative.** One device (the host) runs the only battle engine. The others send **commands** and get back an ordered **event stream**, which they only render. No device-to-device desyncs, and clients never calculate damage.
2. **Prerequisite: pull the engine out of the page.** A headless `BattleEngine` produces events; `BattlePage` only plays them back. Single player then runs through exactly the same path (a local controller), and gets testable, without the DOM.
3. **One transport interface, several native back ends:**
   - LAN (same Wi-Fi or a phone hotspot) is the **cross-platform** path, including iOS ↔ Android.
   - Bluetooth / Wi-Fi Direct come from the OS frameworks: Google Nearby (Android ↔ Android) and MultipeerConnectivity (iOS ↔ iOS).
   - There is no shared offline P2P stack between iOS and Android. Mixed pairs without a router use one phone's **hotspot**, which is again the LAN path. Cross-platform BLE GATT is deliberately left out of v1: it needs peripheral mode, has a small MTU and is unreliable.

## Architecture

```
┌──────────── Host device ─────────────┐          ┌──── Client device ────┐
│ Lobby/Session ─ BattleEngine (rng)   │  events  │ Session ─ EventPlayer │
│      │            ▲ commands         │ ───────▶ │      │      ▼         │
│ Controllers: local | remote | npc    │ ◀─────── │ BattlePage (render +  │
│      │                               │ commands │  own-slot input)      │
│ Transport (LAN | Nearby | Multipeer) │          │ Transport             │
└──────────────────────────────────────┘          └───────────────────────┘
```

### A. `BattleEngine`: `src/app/core/battle/engine/` (new)
- **State:**
  - sides → **parties per owner** (multi battles: two parties per side);
  - active slots with their owner;
  - per-turn volatiles, charge, choice locks, PP and items, all already modelled in the page today;
  - `rng: () => number` injected (seedable for tests and replays).
- **API:**
  - `start(config)`;
  - `requests(): Request[]` — `{ kind: 'command' | 'replacement', slot, owner, options }`, where `options` holds the allowed moves (PP, choice lock, Offensivweste), targets and switches;
  - `submit(owner, slot, command)`;
  - `resolveTurn(): BattleEvent[]`.
  - The engine checks every command against `options`, so a remote client can't send invalid moves.
- **`BattleEvent`** (serialisable, with `seq`):
  - `log`, `moveUsed`, `hit` (slot, damage, effectiveness), `miss`, `hp`, `status`, `boosts`;
  - `itemUsed` / `itemReveal`, `protect`, `faint`, `sendOut`, `recall`;
  - `turnEnd`, `battleEnd`.
- **Moved out of the page (not rewritten):** performMove / performSupportMove / performSelfMove, executeTurn, finishRound, residuals and replacements. The `await animation` / `wait` calls become `emit(event)`. The building blocks in [battle-format.ts](../src/app/core/battle/battle-format.ts), [npc-ai.ts](../src/app/core/battle/npc-ai.ts), [item-effects.ts](../src/app/core/battle/item-effects.ts), the damage, status and stat-change services, and the trainer-run carry-over all stay as they are.
- **Randomness:** `Math.random` in damage-calc, status, stat-change, item-effects and battle-format is replaced by the injected `rng` (a parameter with `Math.random` as default; `orderActions` already works this way).

### B. `EventPlayer` + slimmer `BattlePage`
- The `EventPlayer` plays events one after another and maps each to the existing [move-animation.service.ts](../src/app/core/services/move-animation.service.ts) / [audio.service.ts](../src/app/core/services/audio.service.ts) calls, waits and log lines. That reuses what's there today, including the "last line stays readable" pauses.
- `BattlePage` binds the HUD and menus to an engine **view state** and offers input only for slots it owns (`owner === me`). Other slots show "Warte auf {Name} …".
- **Controllers per slot:** `LocalController` (menu input), `NpcController` (`chooseNpcMove`), `RemoteController` (waits for network commands). Single player is local plus NPC, so the page only changes inside, not in behaviour.

### C. Session / lobby: `src/app/core/multiplayer/` (new)
- `SessionService` (host or client role), seats (owner index → side / position), ready state, mode config.
- **Host:**
  - validates incoming teams with the existing sanitizers (`sanitizeMon`, `knownItemId`), plus legality checks: learnset moves via `DexDataService.legalMoves`, ≤ 6 Pokémon, known items;
  - starts the engine; sends `events` and `request`s to the right owner; collects `command`s;
  - autosaves coop runs (the existing `TrainerRunService`, with one carry-over per player).
- **Client:** shows the lobby, sends its team, plays the events, answers requests.

### D. Transport: `MultiplayerTransport` + one Capacitor plugin `LocalMultiplayer`
```ts
interface MultiplayerTransport {
  advertise(session: SessionInfo): Promise<void>;          // host
  discover(): Observable<SessionInfo[]>;                    // client
  connect(sessionId: string): Promise<PeerId>;
  send(peer: PeerId | 'all', msg: Uint8Array): void;
  messages(): Observable<{ peer: PeerId; msg: Uint8Array }>;
  peerEvents(): Observable<{ peer: PeerId; state: 'connected' | 'lost' }>;
  close(): Promise<void>;
}
```
| Back end | Platform | How | Range / use |
|---|---|---|---|
| **LAN** (default, cross-platform) | Android + iOS, mixed | DNS-SD/Bonjour `_pbsim._tcp` for discovery; the host opens a TCP server; frames are a 4-byte length plus JSON. Android: `NsdManager` + `ServerSocket`. iOS: Network.framework `NWListener` / `NWBrowser`. | Same Wi-Fi **or a phone hotspot** (offline, mixed pairs) |
| **Nearby** | Android ↔ Android | Google Nearby Connections, `P2P_STAR` (host plus up to 3 clients); Bluetooth / BLE / Wi-Fi Direct picked automatically | Offline, no router |
| **Multipeer** | iOS ↔ iOS | `MCNearbyServiceAdvertiser` / `Browser`, `MCSession` (reliable) | Offline, no router |

- The plugin lives in `plugins/local-multiplayer/` (Kotlin + Swift) and is wired in through `npx cap sync`.
- The UI offers "Gleiches WLAN / Hotspot" (always) and "Bluetooth / Direkt" (only between devices with the same OS).
- **Dev / test without devices:**
  - `LoopbackTransport`, in memory, for unit and integration tests;
  - `BroadcastChannelTransport`, for two browser tabs during development (`ng serve`). The feature stays hidden in production web builds.
- **Permissions:**
  - Android: `NEARBY_WIFI_DEVICES` (13+), `BLUETOOTH_SCAN` / `ADVERTISE` / `CONNECT` (12+), `ACCESS_FINE_LOCATION` (≤ 12), `CHANGE_WIFI_MULTICAST_STATE`, `INTERNET`.
  - iOS: `NSLocalNetworkUsageDescription`, `NSBonjourServices: ["_pbsim._tcp"]`, `NSBluetoothAlwaysUsageDescription`.
  - Each permission is requested with German explanatory text when the user enters the multiplayer screen.

### E. Protocol (JSON, versioned, `protocol: 1`)
| Phase | Host → client | Client → host |
|---|---|---|
| Handshake | `welcome { sessionId, seat }` / `reject { reason }` | `hello { protocol, appVersion, name, avatarId }` |
| Lobby | `lobby { mode, format, seats[{ name, avatar, teamPreview, ready }] }`, `teamRejected { reason }`, `start { config }` | `setTeam { team: TeamPokemon[] }`, `ready { on }` |
| Battle | `events { fromSeq, events[] }`, `request { requestId, slot, options }`, `snapshot { seq, view }` | `command { requestId, slot, cmd }`, `ack { seq }` |
| Run (coop) | `runState { run, carry }` | — |
| Always | `ping` / `pong` every 2 s | `pong` |

- **Reliability:**
  - Events carry sequence numbers; after a reconnect the host sends a `snapshot` plus the missing events.
  - If no `ack` arrives after 5 s, the host sends again.
  - Requests are idempotent through `requestId`.
- **Disconnects:** 30 s grace period, shown as "Verbindung verloren – warte …". After that, in PvP the absent player loses; in coop, an NPC (`npc-ai`) takes over that player's slot.
- **Turn timer:** optional (off by default; 60 s when on). When time runs out, the move is chosen automatically by the NPC AI.

## Modes
| Mode | Devices | Battle | Teams |
|---|---|---|---|
| PvP 1 vs 1 | 2 | singles or doubles (existing format) | Each player's active team, up to 6 |
| PvP 2 vs 2 | 4 | doubles; each player owns one slot (a multi battle) | Each player brings 3 (the games' multi-battle rule) |
| Coop vs NPC | 2 | multi battle: players on positions 0 / 1, against an NPC pair | 3 each; NPC: random roll or custom config |
| Coop run | 2 | Top-Vier / Arenaleiter as multi battles | 3 each; one carry-over per player; progress saved on the host |

- **Engine extension for multi battles:** a side has `parties[owner]`, and each position is bound to an owner. Replacements only come from the owner's own party, and only the owner chooses targets for its slot. Doubles targeting, spread, Helping Hand, redirection and Protect are reused unchanged.
- Coop runs in Top-Vier / Arenaleiter mode use `TrainerRunService` with a `players` field. The NPC side uses its authored team in doubles format (the existing doubles path).

## UI
- New page `/multiplayer`, linked from the hub with a "Mehrspieler" button that is only shown when `Capacitor.isNativePlatform()` is true (and in dev builds):
  1. **Host / join:** "Spiel erstellen" / "Spiel beitreten", plus a transport choice (WLAN/Hotspot, Bluetooth).
  2. **Lobby:** a seat list showing name, trainer avatar, team preview (sprites, item icons, Pokémon count) and ready state. The host chooses the mode, format and NPC options.
  3. **Battle:** the normal battle page in multiplayer mode: whose turn it is, "Warte auf …", connection status (a dot in the header), and no "Reset" or "Nochmal". The result screen offers "Revanche" (PvP) or "Weiter" (coop run).

## Implementation phases (each one ships separately and is tested)
1. **Engine extraction** (no network):
   - `BattleEngine`, `EventPlayer`, controllers, injected `rng`.
   - Single player has to play exactly as before: all existing specs plus the Playwright flows (singles, doubles, items, Top-Vier, Arenaleiter).
   - New engine specs with a seeded `rng`, run headless.
2. **Session + protocol + dev transports:** `SessionService`, codec and validation, `LoopbackTransport`, `BroadcastChannelTransport`. PvP 1 vs 1 works between two browser tabs (dev only).
3. **`LocalMultiplayer` plugin, LAN back end** (Android + iOS): `npx cap add android` / `ios`, permissions, DNS-SD and TCP. First real-device PvP, including Android ↔ iOS.
4. **Nearby (Android) and Multipeer (iOS)** back ends.
5. **Coop:** multi-battle engine extension (`parties[owner]`), coop vs NPC, coop runs.
6. **PvP 2 vs 2** with four devices (Nearby `P2P_STAR`, Multipeer, LAN with 3 clients).

## Risks / open points
- **The engine extraction is the biggest piece of work.** That's why it comes first, behind the existing test and Playwright safety net.
- **Mixed Android ↔ iOS without a router** only works over a hotspot. That's documented, and the UI explains it ("Ein Gerät startet einen Hotspot …").
- **iOS local network permission:** the system prompts on first discovery. If the user denies it, LAN discovery stops working. The UI detects this and links to Settings.
- **Cheating:** the host is trusted, which is fine for local play between friends. Clients are validated (teams, commands).
- **Version mismatch:** `protocol` / `appVersion` in `hello`; a rejection shows "Bitte beide Apps aktualisieren".

## Verification
- **Unit:**
  - Engine specs with a seeded `rng`: the same seed and commands produce the same event stream.
  - Command validation (choice lock, PP, bad targets), multi-battle ownership, protocol codec and frame splitting / joining.
- **Integration:**
  - `LoopbackTransport` with a host and two clients in one test: a full PvP battle, a coop battle where the NPC takes over a disconnected player, reconnecting with a snapshot plus the missing events.
- **Dev E2E:** Playwright with two browser contexts over BroadcastChannel: lobby → battle → result, with both views showing the same HP and log.
- **Device matrix** (manual, phases 3–6):
  - Android ↔ Android: WLAN and Bluetooth;
  - iOS ↔ iOS: WLAN and Multipeer;
  - Android ↔ iOS: WLAN and hotspot;
  - 4 devices, 2 vs 2;
  - Wi-Fi drop mid-battle (grace period and reconnect).
- **Regression:** after phase 1, all 83+ existing specs and the existing Playwright flows still pass.
