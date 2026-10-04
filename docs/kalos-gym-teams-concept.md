# Concept: six-Pokémon teams for the Kalos gym leaders

**Status:** implemented in [gym-leader.model.ts](../src/app/core/models/gym-leader.model.ts) (`KALOS`) · **Scope:** Arenaleiter-Herausforderung, Kalos (Gen 6)

## Context
The gym leaders of Kanto through Einall use their first Schwarz 2 / Weiß 2 PWT team: six Pokémon with held items each. X / Y has no PWT. The closest source is the **Kampfschloss** (Battle Chateau), where each leader fields only **two** Pokémon per battle and holds no items.

The first Kalos version used every species a leader fields across all Kampfschloss ranks, with the moveset of its highest-level entry. That gave 2–3 Pokémon per leader. This concept fills every team up to six, so Kalos plays like the other regions.

## Selection rules
Applied in this order:

1. **The Kampfschloss core stays.** It keeps its species and its highest-rank moves.
2. **Gen 6 first.** Fully evolved, non-legendary species from #650–721 that have the leader's type in either slot.
3. **The leader's own Pokémon.** These come from the X / Y gym battle or the anime, evolved to their final stage. Examples: Connie's Mienfoo becomes Wie-Shu; Citro has Emolga in his gym and Luxtra in the anime; Valerie has Pantimos in her gym.
4. **Thematic Gen 1–5 picks.** They have to fit the leader's type and persona, and should cover the team's weak spots.
5. **No species is used twice among the eight Kalos leaders.**

**Moves:** four per Pokémon. Each move must exist in `MOVE_LIBRARY` and be legal per `public/assets/data/learnsets-gen6.json`. The sets are about as strong as the Lv 60–70 Kampfschloss sets. One exception is Psiaugon's Seher (Future Sight). It comes from the Kampfschloss source and is legal for the female form, but the learnset data only covers the male form.

**Items:** every Pokémon, old and new, holds an item that existed in X / Y. X / Y dropped all type gems except the Normaljuwel, so Kalos uses no gems. The pool:
- Resist berries, including the Gen 6 Hibisbeere.
- Sitrus / Lum.
- Leftovers, Life Orb, Choice items, Assault Vest.
- Eviolite: Magneton is not fully evolved.
- Rocky Helmet, Focus Sash.
- Power Herb: for charge moves.
- White Herb: after Shell Smash / Leaf Storm.
- Wide Lens: for inaccurate moves.

The NPC follows Choice locks and the Assault Vest's ban on status moves (`itemLockReason` in `battle.page.ts`).

**How much Gen 6 is left:**
- Rock, Fighting, Grass, Electric, Psychic and Ice have no Gen 6 candidates left after this concept.
- Bug has none at all besides Vivillon.
- For Fairy, only Clavion remains. Clavion is Thymelot's Top-Vier Pokémon and has the same Steel/Fairy typing as Flunkifer, so Valerie takes Pantimos from her real gym team instead.

Gen 6 Pokémon per leader:

| Viola | Lino | Connie | Amaro | Citro | Valerie | Astrid | Galantho |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 3 | 3 | 2 | 4 | 3 | 1 |

## Teams
The Kampfschloss core comes first, then the additions (**bold**).

### Viola (Bug): Krabbelorden
| Pokémon | Moves | Item | Why |
|---|---|---|---|
| Maskeregen | Falterreigen, Luftschnitt, Käfergebrumm, Wirbelwind | Chiaribeere | Kampfschloss; the berry softens its 4× Rock weakness |
| Vivillon | Bodyguard, Falterreigen, Pulverschleuder, Orkan | Überreste | Kampfschloss |
| **Ramoth** | Falterreigen, Feuerreigen, Käfergebrumm, Gigasauger | Leben-Orb | Showy, butterfly-like moth that fits the photographer; Fire typing |
| **Skaraborn** | Vielender, Nahkampf, Steinkante, Erdbeben | Wahlschal | Fighting coverage against the Rock attacks Viola's team fears |
| **Cerapendra** | Vielender, Gifthieb, Erdbeben, Schwerttanz | Fokusgurt | Ground move as an answer to Rock and Steel types |
| **Voltula** | Donner, Käfergebrumm, Gigasauger, Voltwechsel | Großlinse | Electric coverage; the lens helps Donner hit |

### Lino (Rock): Wallorden
| Pokémon | Moves | Item | Why |
|---|---|---|---|
| Amagarga | Zugabe, Lichtschild, Eisstrahl, Hyperstrahl | Überreste | Kampfschloss |
| Monargoras | Erdbeben, Hornbohrer, Kopfstoß, Steinhagel | Leben-Orb | Kampfschloss |
| **Rocara** | Juwelenkraft, Mondgewalt, Reflektor, Tarnsteine | Beulenhelm | Gen 6, defensive Rock/Fairy |
| **Thanathora** | Steinkante, Kalkklinge, Kreuzhieb, Hausbruch | Schlohkraut | Gen 6; clings to rocks, which suits the climber |
| **Aerodactyl** | Steinkante, Erdbeben, Knirscher, Eisenschädel | Fokusgurt | Fossil Pokémon, the theme of his Kampfschloss Pokémon |
| **Rihornior** | Felswerfer, Erdbeben, Vielender, Hammerarm | Offensivweste | Raw physical power; all four moves attack, so the vest fits |

### Connie (Fighting): Rauforden
| Pokémon | Moves | Item | Why |
|---|---|---|---|
| Resladero | Turmkick, Himmelsfeger, Freier Fall, Schwerttanz | Energiekraut | Kampfschloss; the herb skips Himmelsfeger's charge turn |
| Machomei | Wuchtschlag, Grimasse, Weckruf, Kreuzhieb | Großlinse | Kampfschloss; the lens props up Wuchtschlag's accuracy |
| Lucario | Heilwoge, Drachenpuls, Turbotempo, Nahkampf | Leben-Orb | Kampfschloss (Mega Evolution isn't modelled) |
| **Brigaron** | Holzhammer, Ableithieb, Steinkante, Schutzstacheln | Beulenhelm | Gen 6 Grass/Fighting starter |
| **Pandagro** | Hammerarm, Knirscher, Steinkante, Abgangstirade | Hibisbeere | Gen 6; the berry covers its 4× Fairy weakness |
| **Wie-Shu** | Turmkick, Kehrtwende, Steinkante, Mogelhieb | Fokusgurt | Final stage of the Mienfoo from her X / Y gym team |

### Amaro (Grass): Blattorden
| Pokémon | Moves | Item | Why |
|---|---|---|---|
| Papungha | Sorgensamen, Baumwollsaat, Gigasauger, Kehrtwende | Tsitrubeere | Kampfschloss |
| Chevrumm | Erdbeben, Laubklinge, Aero-Ass, Milchgetränk | Prunusbeere | Kampfschloss |
| Sarzenia | Grasmixer, Rasierblatt, Blättersturm, Laubklinge | Schlohkraut | Kampfschloss; the herb undoes Blättersturm's drop |
| **Trombork** | Holzgeweih, Dunkelklaue, Holzhammer, Irrlicht | Koakobeere | Gen 6 tree Pokémon for the old gardener |
| **Pumpdjinn** | Samenbomben, Phantomkraft, Egelsamen, Irrlicht | Beulenhelm | Gen 6 pumpkin from his vegetable patch |
| **Tentantel** | Blattgeißel, Gyroball, Egelsamen, Stachler | Überreste | Thorny Grass/Steel plant; patches Fire/Ice/Poison holes |

### Citro (Electric): Ampere-Orden
| Pokémon | Moves | Item | Why |
|---|---|---|---|
| Magneton | Ladungsstoß, Zielschuss, Lichtkanone, Kreideschrei | Evolith | Kampfschloss; Eviolite because it can still evolve |
| Elezard | Donner, Ruckzuckhieb, Parabolladung, Ladevorgang | Expertengurt | Kampfschloss |
| Magnezone | Ladungsstoß, Zielschuss, Magnetflug, Gyroball | Schukebeere | Kampfschloss |
| **Dedenne** | Parabolladung, Knuddler, Superzahn, Donnerwelle | Tsitrubeere | Gen 6; the anime companion of Citro's family |
| **Emolga** | Donnerblitz, Akrobatik, Voltwechsel, Zugabe | Prunusbeere | From his X / Y gym team |
| **Luxtra** | Stromstoß, Knirscher, Eiszahn, Feuerzahn | Wahlband | His anime partner; fang coverage |

### Valerie (Fairy): Feenorden
| Pokémon | Moves | Item | Why |
|---|---|---|---|
| Flunkifer | Knuddler, Eisenschädel, Entfessler, Verzehrer | Koakobeere | Kampfschloss |
| Feelinara | Mondgewalt, Lichtschild, Zuflucht, Psycho-Plus | Überreste | Kampfschloss |
| **Florges** | Mondgewalt, Blättertanz, Psychokinese, Gedankengut | Tsitrubeere | Gen 6 flower fairy that suits the fashion designer |
| **Parfinesse** | Mondgewalt, Psychokinese, Aromakur, Bizarroraum | Grarzbeere | Gen 6; her anime Spritzee, evolved |
| **Sabbaione** | Knuddler, Ableithieb, Bauchtrommel, Flammenwurf | Tsitrubeere | Gen 6; Bauchtrommel plus the berry make it a set-up threat |
| **Pantimos** | Psychokinese, Zauberschein, Reflektor, Lichtschild | Fokusgurt | From her X / Y gym team |

### Astrid (Psychic): Psi-Orden
| Pokémon | Moves | Item | Why |
|---|---|---|---|
| Symvolara | Psychokinese, Luftschnitt, Himmelsfeger, Kosmik-Kraft | Überreste | Kampfschloss |
| Psiaugon ♀ | Ampelleuchte, Tiefschlag, Seher, Kraftvorrat | Tsitrubeere | Kampfschloss |
| Laschoking | Psychokinese, Trumpfkarte, Psycho-Plus, Heilwoge | Burleobeere | Kampfschloss |
| **Fennexis** | Psychokinese, Flammenwurf, Strauchler, Gedankengut | Schlaubrille | Gen 6 Fire/Psychic starter, a witch-like mystic |
| **Calamanero** | Kraftkoloss, Psychoklinge, Nachthieb, Abschlag | Leben-Orb | Gen 6 Dark/Psychic; physical counterweight to the special attackers |
| **Morbitesse** | Psychokinese, Donnerblitz, Spukball, Gedankengut | Prunusbeere | Stargazing Pokémon that suits the seer |

### Galantho (Ice): Eisbergorden
| Pokémon | Moves | Item | Why |
|---|---|---|---|
| Frigometri | Genesung, Nachthieb, Solarstrahl, Konfusstrahl | Energiekraut | Kampfschloss; the herb fires Solarstrahl at once |
| Arktilas | Genesung, Risikotackle, Schädelwumme, Knirscher | Beulenhelm | Kampfschloss |
| Rexblisar | Verwurzler, Holzhammer, Blizzard, Eiseskälte | Koakobeere | Kampfschloss; the berry covers its 4× Fire weakness |
| **Mamutel** | Eiszapfhagel, Erdbeben, Eissplitter, Steinkante | Leben-Orb | Big beast like the burly leader; Ground typing |
| **Siberio** | Eiszapfhagel, Kraftkoloss, Wasserdüse, Schwerttanz | Muskelband | Polar bear, a perfect match for the bear-like man |
| **Walraisa** | Blizzard, Surfer, Erholung, Schlafrede | Überreste | Walrus and the bulky Water partner of the team |

## Alternatives considered
- **Clavion for Valerie:** the last unused Gen 6 Fairy. It was rejected because it duplicates Flunkifer's Steel/Fairy typing and is Thymelot's Top-Vier Pokémon. Pantimos is also from Valerie's real gym team.
- **Rotom for Citro:** fits the inventor, but it already appears for Volkner and Lamina, and appliance forms aren't modelled. Luxtra (his anime partner) was chosen instead.

## How it's verified
[gym-leader.model.spec.ts](../src/app/core/models/gym-leader.model.spec.ts) checks:
- Every leader has six Pokémon with four known moves.
- The Gen 6 count per leader matches the table above.
- No species appears twice among the Kalos leaders.
- Every Kalos Pokémon has a known held item, and none is a type gem.

During authoring, a script also checked each move against the Gen 6 learnsets (the only exception is the female-only Seher).
