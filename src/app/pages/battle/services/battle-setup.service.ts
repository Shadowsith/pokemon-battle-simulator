import { Injectable, inject } from '@angular/core';
import { freshBoosts, freshStatus } from '../../../core/models/pokemon.model';
import { toBattlePokemon } from '../../../core/models/battle-pokemon';
import { BattleFormat } from '../../../core/battle/battle-format';
import {
  BattleBackground,
  SceneId,
  background,
  randomOutdoorScene,
  sceneForGymType,
  timeOfDay
} from '../../../core/battle/battle-background';
import { CustomBattleConfig, configToNpcOptions } from '../../../core/models/custom-battle.model';
import type { GymLeader, RunMember } from '../../../core/models/trainer-run.model';
import { AudioService } from '../../../core/services/audio.service';
import { CustomBattleService } from '../../../core/services/custom-battle.service';
import { EliteFourRunService } from '../../../core/services/elite-four-run.service';
import { GymRunService } from '../../../core/services/gym-run.service';
import { NpcPokemon, NpcTeamService } from '../../../core/services/npc-team.service';
import { SettingsService } from '../../../core/services/settings.service';
import { TrainerRosterService } from '../../../core/services/trainer-roster.service';
import { RunCarry, TrainerRunService } from '../../../core/services/trainer-run.service';
import { fallbackOpponentMoves, makeGlurak, movesByIds } from '../battle-defaults';
import { BattleStageService } from './battle-stage.service';
import { BattleStateService } from './battle-state.service';

/** VS-intro length before the send-out starts on its own. */
const INTRO_MS = 2400;

/**
 * Where this battle comes from (random, Custom Battle, a run leg, debug) and
 * how both parties are built for it.
 */
@Injectable()
export class BattleSetupService {
  private readonly state = inject(BattleStateService);
  private readonly stage = inject(BattleStageService);
  private readonly settings = inject(SettingsService);
  private readonly roster = inject(TrainerRosterService);
  private readonly npcTeam = inject(NpcTeamService);
  private readonly audio = inject(AudioService);
  private readonly e4Svc = inject(EliteFourRunService);
  private readonly gymSvc = inject(GymRunService);

  /** Set when this battle was launched from the Custom Battle config page. */
  readonly customBattle: CustomBattleConfig | null = inject(CustomBattleService).take();

  /** Set when this battle is one leg of a run (Top-Vier or Arenaleiter). */
  readonly challenge: { svc: TrainerRunService; member: RunMember } | null = this.takeChallenge();
  /** "Arenaleiter" / "Arenaleiterin" for a gym leader's VS intro, else null. */
  readonly gymTitle = (this.challenge?.member as GymLeader | undefined)?.badge
    ? this.challenge!.member.title.split(' ')[0]
    : null;

  /** The in-flight NPC-team roll; the send-out waits on it. */
  opponentRoll: Promise<void> | null = null;

  private takeChallenge(): { svc: TrainerRunService; member: RunMember } | null {
    for (const svc of [this.e4Svc, this.gymSvc] as TrainerRunService[]) {
      const member = svc.takePending();
      if (member) return { svc, member };
    }
    return null;
  }

  /**
   * Fresh battle: pick the format, heal the player team, set up the NPC trainer
   * + party and start the music. Resolves with how long the VS intro should
   * stay up before the send-out.
   */
  async prepare(): Promise<number> {
    const s = this.state;
    s.format.set(this.pickFormat());
    s.background.set(this.pickBackground());
    this.resetTeams();
    s.outcome.set(null);
    s.log.set('');
    s.phase.set('intro');
    // Gym leader / Elite Four fights get their generation's theme; others a random one.
    const challengeGen = this.challenge?.svc.region()?.gen;
    this.audio.startBattleMusic(
      this.challenge && challengeGen ? { theme: this.challenge.svc.musicTheme, gen: challengeGen } : undefined,
    );

    if (s.debug) {
      s.playerTeam.set([s.derivePlayerTeam()[0]]);
      s.activePlayer.set([0]);
      s.opponentTeam.set([makeGlurak((d) => s.hp(d))]);
      s.activeOpponent.set([0]);
      this.opponentRoll = null;
      return 0; // no VS intro, straight to send-out
    }

    if (this.customBattle) {
      const cfg = this.customBattle;
      if (cfg.mode === 'team') {
        this.setOpponentMons(cfg.team);
        this.opponentRoll = Promise.resolve();
      } else {
        this.opponentRoll = this.rollOpponentTeam(cfg);
      }
      const [avatarId] = await Promise.all([
        cfg.avatarId ? Promise.resolve(cfg.avatarId) : this.roster.randomId(),
        this.opponentRoll
      ]);
      s.npcAvatarId.set(avatarId);
      return INTRO_MS;
    }

    if (this.challenge) {
      const member = this.challenge.member;
      this.setOpponentMons(member.team);
      this.opponentRoll = Promise.resolve();
      s.npcAvatarId.set(member.trainerId);
      s.npcNameOverride.set(member.name);
      return INTRO_MS;
    }

    this.opponentRoll = this.rollOpponentTeam();
    const [avatarId] = await Promise.all([this.roster.randomId(), this.opponentRoll]);
    s.npcAvatarId.set(avatarId);
    return INTRO_MS;
  }

  /** Singles or doubles for this battle. Doubles needs 2+ Pokémon in the player's team. */
  private pickFormat(): BattleFormat {
    if (this.state.debug || this.state.playerTeam().length < 2) return 'singles';
    if (this.customBattle) return this.customBattle.format;
    if (this.challenge) return this.challenge.svc.run()?.format ?? 'singles';
    return this.settings.allowDoubleBattles() && Math.random() < 0.5 ? 'doubles' : 'singles';
  }

  /**
   * Scene for this battle (day/night from the device clock). The debug battle
   * keeps whatever the debug panel last chose.
   */
  private pickBackground(): BattleBackground {
    if (this.state.debug) return this.state.background();
    return background(this.pickScene(), timeOfDay(new Date()));
  }

  private pickScene(): SceneId {
    const custom = this.customBattle?.background;
    if (custom) return custom === 'random' ? randomOutdoorScene() : custom;
    if (this.challenge) {
      // Gym leaders fight on their type's scene, the Elite Four in their hall.
      return this.challenge.svc === this.gymSvc
        ? sceneForGymType((this.challenge.member as GymLeader).type)
        : 'elite-four';
    }
    return randomOutdoorScene();
  }

  /**
   * Puts an exact, pre-built party on the opponent's side (Top 4, custom
   * "team" mode). `moves` are @pkmn/sim ids resolved against MOVE_LIBRARY.
   */
  private setOpponentMons(mons: { speciesNum: number; name: string; types: string[]; moves: string[] }[]): void {
    const s = this.state;
    s.opponentTeam.set(mons.map((m) => toBattlePokemon(m, (d) => s.hp(d))));
    s.opponentMovesets.set(mons.map((m) => movesByIds(m.moves)));
    s.activeOpponent.set(s.initialActive(mons.length));
  }

  /** Roll a fresh NPC party. Size and type constraints come from a Custom Battle
   *  config when given, otherwise the party mirrors the player's team size
   *  (at least two in doubles). Falls back to a lone Glurak if generation yields nothing. */
  private async rollOpponentTeam(cfg?: CustomBattleConfig): Promise<void> {
    const s = this.state;
    const minSize = s.isDoubles() ? 2 : 1;
    const size = Math.max(minSize, cfg?.opponentCount ?? s.playerTeam().length);
    let rolled: NpcPokemon[] = [];
    try {
      rolled = await this.npcTeam.generate(size, cfg ? configToNpcOptions(cfg) : undefined);
    } catch {
      rolled = [];
    }

    if (!rolled.length) {
      s.opponentTeam.set([makeGlurak((d) => s.hp(d))]);
      s.opponentMovesets.set([fallbackOpponentMoves()]);
    } else {
      s.opponentTeam.set(
        rolled.map((r) => {
          const maxHp = s.hp(r.dexId);
          return {
            dexId: r.dexId,
            name: r.name,
            maxHp,
            currentHp: maxHp,
            types: r.types.map((t) => t.toLowerCase()),
            status: freshStatus(),
            boosts: freshBoosts(),
            item: r.item,
            itemRevealed: false
          };
        })
      );
      s.opponentMovesets.set(rolled.map((r) => r.moves));
    }
    s.activeOpponent.set(s.initialActive(s.opponentTeam().length));
  }

  private resetTeams(): void {
    const s = this.state;
    // Heal whatever NPC party is still on the field; rollOpponentTeam() replaces it.
    s.opponentTeam.update((team) =>
      team.map((p) => ({ ...p, currentHp: p.maxHp, status: freshStatus(), boosts: freshBoosts() }))
    );
    s.activeOpponent.set(s.initialActive(s.opponentTeam().length));
    s.playerTeam.set(s.derivePlayerTeam());
    s.activePlayer.set(s.initialActive(s.playerTeam().length));
    s.movePp.set({});
    this.applyRunCarry();
    s.charge.set({});
    s.substitutes.set({});
    s.cursed = new Set();
    s.destinyBonds = new Set();
    s.lastMoves = {};
    s.encores = {};
    s.protectStreak = {};
    s.choiceLocks.set({});
    s.clearTurnVolatiles();
    s.commands.set([]);
    s.commandHistory.set([]);
    s.pendingMove.set(null);
    s.replacingPos.set(null);
    s.actingPos.set(0);
    s.menuState.set('main');
    s.isAnimating.set(false);
    s.faintDone = {};
    this.stage.resetSprites();
  }

  /**
   * Run leg: in a fresh (full-HP) team, restore the spent PP and lingering
   * major status carried over from the previous won fight.
   */
  private applyRunCarry(): void {
    if (!this.challenge) return;
    const carry = this.challenge.svc.run()?.carry;
    if (!carry) return;
    this.state.playerTeam.update((team) =>
      team.map((p, i) => (carry.status[i] ? { ...p, status: { ...freshStatus(), ...carry.status[i] } } : p))
    );
    this.state.movePp.set({ ...carry.pp });
  }

  /** Snapshot the player team's status + PP for the next leg of a run. */
  snapshotRunCarry(): RunCarry {
    return {
      status: this.state.playerTeam().map((p) =>
        p.currentHp <= 0
          ? { major: null, toxicTurns: 0, sleepTurns: 0 }
          : { major: p.status.major, toxicTurns: p.status.toxicTurns, sleepTurns: p.status.sleepTurns }
      ),
      pp: { ...this.state.movePp() }
    };
  }
}
