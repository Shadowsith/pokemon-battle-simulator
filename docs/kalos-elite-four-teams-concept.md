# Concept: six-Pokémon teams for the Kalos Top Vier

**Status:** implemented in [elite-four.model.ts](../src/app/core/models/elite-four.model.ts) (`KALOS`) · **Scope:** Top-Vier-Herausforderung, Kalos (Gen 6)

## Context
The Top Vier of Kanto through Einall field five or six Pokémon each. The Kalos Top Vier have no rematch teams in X / Y, so their only sets have **four** Pokémon. This concept gives each member two more, so Kalos plays like the other regions.

## Selection rules
These are the same rules as in the [gym-leader concept](kalos-gym-teams-concept.md), applied in this order:

1. **The X / Y core stays,** with its species, its moves and its order. The ace stays last.
2. **Gen 6 first.** Fully evolved, non-legendary species from #650–721 that have the member's type in either slot.
3. **The member's own Pokémon** from outside X / Y, such as their Pokémon Masters sync partner.
4. **Thematic Gen 1–5 picks** that fit the type and persona and cover the team's weak spots.
5. **No species twice** within the Kalos Top Vier, and none taken from the Kalos gym leaders, so the two run modes feel distinct.

**Moves:** four per Pokémon. Each move must exist in `MOVE_LIBRARY` and be legal per `public/assets/data/learnsets-gen6.json`.

**Items:** none. No Top-Vier region models held items.

**How much Gen 6 is left:**
- Steel: no unused Gen 6 species.
- Fire: only Fennexis, which Astrid already uses.
- Dragon: Viscogon, plus Monargoras, which Lino already uses.
- Water: only Quajutsu.

So Viscogon and Quajutsu are the two Gen 6 additions.

## Teams
The new Pokémon are **bold**. They sit in slots 4–5, before the X / Y ace.

### Thymelot (Meister der Stahl-Pokémon)
| Pokémon | Moves | Why |
|---|---|---|
| Clavion | Zauberschein, Lichtkanone, Folterknecht, Stachler | X / Y core |
| Voluminas | Erdkräfte, Juwelenkraft, Ladungsstoß, Lichtkanone | X / Y core |
| Scherox | Patronenhieb, Kreuzschere, Eisenschädel, Nachthieb | X / Y core |
| **Caesurio** | Eisenschädel, Nachthieb, Tiefschlag, Schwerttanz | Blade-wielding Pokémon for the knight; Dark typing against Ghost and Psychic |
| **Panzaeron** | Sturzflug, Eisenschädel, Ruheort, Tarnsteine | Armoured knight-bird; immune to Ground, the team's weak spot |
| Durengard | Königsschild, Sanctoklinge, Dunkelklaue, Eisenschädel | X / Y ace |

### Pachira (Meisterin der Feuer-Pokémon)
| Pokémon | Moves | Why |
|---|---|---|
| Pyroleo | Schallwelle, Flammenwurf, Stromstoß, Kampfgebrüll | X / Y core |
| Qurtel | Fluch, Erdbeben, Steinkante, Flammenrad | X / Y core |
| Skelabra | Flammenwurf, Spukball, Konfusstrahl, Vertrauenssache | X / Y core |
| **Hundemon** | Flammenwurf, Finsteraura, Matschbombe, Ränkeschmied | Her Pokémon Masters sync partner; Mega-capable in Kalos |
| **Glurak** | Flammenwurf, Luftschnitt, Drachenpuls, Fokusstoß | Kalos' iconic Fire Pokémon (starter gift with both Megas); immune to Ground |
| Fiaro | Sturzflug, Ruckzuckhieb, Flammenblitz, Dreschflegel | X / Y ace |

### Dracena (Meisterin der Drachen-Pokémon)
| Pokémon | Moves | Why |
|---|---|---|
| Tandrak | Drachenpuls, Surfer, Matschbombe, Donnerblitz | X / Y core |
| Altaria | Mondgewalt, Drachenpuls, Watteschild, Gesang | X / Y core |
| Shardrago | Drachenrute, Vergeltung, Heimzahlung, Zermürben | X / Y core |
| **Viscogon** | Drachenpuls, Feuersturm, Donnerblitz, Eisstrahl | Gen 6; gentle dragon for the kind old lady; wide special coverage |
| **Dragoran** | Wutanfall, Turbotempo, Erdbeben, Drachentanz | Friendly physical dragon to balance her special attackers |
| UHaFnir | Luftschnitt, Drachenpuls, Flammenwurf, Superzahn | X / Y ace |

### Narcisse (Meister der Wasser-Pokémon)
| Pokémon | Moves | Why |
|---|---|---|
| Wummer | Aquawelle, Finsteraura, Drachenpuls, Aurasphäre | X / Y core |
| Garados | Kaskade, Eiszahn, Erdbeben, Drachentanz | X / Y core |
| Starmie | Zauberschein, Psychokinese, Surfer, Lichtschild | X / Y core |
| **Quajutsu** | Surfer, Finsteraura, Eisstrahl, Kehrtwende | Gen 6 Kalos starter; Dark typing |
| **Milotic** | Siedewasser, Eisstrahl, Genesung, Einrollen | The most beautiful Pokémon, for the artist and chef; bulky |
| Thanathora | Kreuzhieb, Steinkante, Kalkklinge, Kreuzschere | X / Y ace |

## Alternatives considered
- **Fennexis for Pachira, Monargoras for Dracena:** they are the last unused Gen 6 picks of these types. Both were rejected because they are prominent members of Astrid's and Lino's gym teams.
- **Cavalanzas for Thymelot:** a literal lance knight, but it has the same Bug/Steel typing as Scherox. Panzaeron adds a Ground immunity instead.
- **Seedraking for Dracena:** fitting, but Dragoran gives her the physical attacker her team lacked.

## How it's verified
[elite-four-run.service.spec.ts](../src/app/core/services/elite-four-run.service.spec.ts) checks:
- Every Kalos member has six Pokémon with four moves each.
- Each X / Y ace (Durengard, Fiaro, UHaFnir, Thanathora) is still last.
- No species repeats within the Kalos Top Vier.
- Every move is one the battle engine knows.

During authoring, a script also checked each new move against the Gen 6 learnsets.
