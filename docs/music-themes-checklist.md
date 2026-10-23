# Checklist: free / self-made battle music

**Goal:** replace all 18 tracks under `public/assets/sounds/music/` with free (CC0 / CC-BY) or self-made music. The current files are game rips.

## Rules
- **File name:** keep the names below. `MUSIC_TRACKS` in [audio.service.ts](../src/app/core/services/audio.service.ts) lists them, because the browser cannot read the folder.
- **Loop:** every track plays on loop. The end has to flow back into the start without a gap or click. Trim silence at both ends.
- **Format:** mp3, 128–192 kbps, normalized loudness (about −14 LUFS), 1–3 min. The current files are 5–9 MB each, so this also shrinks the app.
- **Fallback:** a missing `arena_gen<N>` / `elite4_gen<N>` falls back to `battle_gen<N>`, then to a random battle theme. You can replace tracks one by one.
- **Licence:** note the source and licence of every track you did not make yourself in a `CREDITS.md` next to the files. CC-BY needs attribution; avoid non-commercial (NC) licences if the app may ever be sold.
- **Sources:** opengameart.org, freemusicarchive.org, incompetech.com (Kevin MacLeod, CC-BY), pixabay.com/music, or your own (LMMS, BeepBox, FamiStudio, Bosca Ceoil).
- **Style hint:** each generation can have its own sound, e.g. Gen 1 chiptune, Gen 2 brighter chiptune, Gen 3 GBA synth, Gen 4 / 5 orchestral synth, Gen 6 modern orchestral / rock.
- Tick the box when the new file is in place, the loop sounds clean, and the credit is written down.

## Normal battles (`battle_gen<N>.mp3`)
One is picked at random for every normal battle.

- [ ] `battle_gen1.mp3` — Gen 1 / Kanto
- [ ] `battle_gen2.mp3` — Gen 2 / Johto
- [ ] `battle_gen3.mp3` — Gen 3 / Hoenn
- [ ] `battle_gen4.mp3` — Gen 4 / Sinnoh
- [ ] `battle_gen5.mp3` — Gen 5 / Einall
- [ ] `battle_gen6.mp3` — Gen 6 / Kalos

## Gym leader battles (`arena_gen<N>.mp3`)
Plays in the Arenaleiter-Herausforderung for the region's generation.

- [ ] `arena_gen1.mp3` — Kanto
- [ ] `arena_gen2.mp3` — Johto
- [ ] `arena_gen3.mp3` — Hoenn
- [ ] `arena_gen4.mp3` — Sinnoh
- [ ] `arena_gen5.mp3` — Einall
- [ ] `arena_gen6.mp3` — Kalos

## Elite Four battles (`elite4_gen<N>.mp3`)
Plays in the Top-Vier-Herausforderung for the region's generation.

- [ ] `elite4_gen1.mp3` — Kanto
- [ ] `elite4_gen2.mp3` — Johto
- [ ] `elite4_gen3.mp3` — Hoenn
- [ ] `elite4_gen4.mp3` — Sinnoh
- [ ] `elite4_gen5.mp3` — Einall
- [ ] `elite4_gen6.mp3` — Kalos

## Done
- [ ] `CREDITS.md` lists every track with author, source link and licence.
- [ ] Every track tested in the app with the music volume slider.
