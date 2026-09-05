# Pokémon Battle Simulator

Lokale Ionic 8 / Angular 20 / Capacitor 8 App fürs Testen animierter
Pokémon-Kämpfe gegen NPCs (Gen 1-5 Scope).

## Setup

```bash
npm install
npm run fetch:sprites   # laedt Showdown-Sprites (Gen 1-5) nach public/assets/sprites
npm start                # ng serve, http://localhost:4200
```

Eigene Sound-Dateien unter `public/assets/sounds/` ablegen, siehe
`public/assets/sounds/README.md` fuer die Namenskonvention.

## Native Build (Capacitor)

```bash
npm run cap:add:ios       # bzw. cap:add:android, einmalig
npm run cap:sync          # baut Angular + synct nach ios/ und android/
npx cap open ios          # oeffnet Xcode
npx cap open android       # oeffnet Android Studio
```

## Projektstruktur

- `src/app/core/models/` - Pokemon- und Move-Datenmodelle, inkl. der
  Move-Bibliothek mit den bisher prototypisierten Move-Archetypen
- `src/app/core/services/move-animation.service.ts` - die eigentliche
  Animations-Engine (Portierung der Chat-Prototypen), ein Archetyp pro
  visuellem Grundmuster (Nahkampf, Projektil, Strahl, Multi-Pulse,
  Target-Levitation, Direktentladung, Bodeneffekt)
- `src/app/core/services/audio.service.ts` - Sound-Hookpoints, no-op falls
  Datei noch fehlt
- `src/app/pages/battle/` - der eigentliche Kampf-Screen
- `src/app/pages/team-select/` - Platzhalter fuer den spaeteren Teamaufbau
- `scripts/fetch-sprites.mjs` - laedt alle Showdown-Sprites fuer Dex #1-649
  (Gen 1-5) von https://github.com/PokeAPI/sprites lokal herunter

## Naechste Schritte

- Teamaufbau-UI (PokeAPI-Datencache lokal, z.B. SQLite/IndexedDB)
- Kampf-Engine anbinden (empfohlen: `@pkmn/sim`) statt der aktuellen
  Platzhalter-Schadenswerte in `move.model.ts`
- NPC-Entscheidungslogik
- Move-Bibliothek auf den vollen Gen 1-5 Movepool erweitern und jedem Move
  einen der bestehenden Archetypen zuweisen
