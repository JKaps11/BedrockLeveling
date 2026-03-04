import { Player, system, world } from "@minecraft/server";
import { SkillType, AbilityState } from "../types/index.js";
import { FeedbackManager } from "./FeedbackManager.js";
import { PlayerDataManager } from "./PlayerDataManager.js";

interface AbilityDef {
  skill: SkillType;
  name: string;
  baseDuration: number; // ticks at level 0
  durationPerLevel: number; // extra ticks per level (usually 1 tick per level)
  cooldownTicks: number;
}

const ABILITY_DEFS: Record<string, AbilityDef> = {
  superBreaker: {
    skill: SkillType.Mining,
    name: "Super Breaker",
    baseDuration: 40,
    durationPerLevel: 1,
    cooldownTicks: 4800, // 4 minutes
  },
  treeFeller: {
    skill: SkillType.Woodcutting,
    name: "Tree Feller",
    baseDuration: 40,
    durationPerLevel: 1,
    cooldownTicks: 4800,
  },
  gigaDrillBreaker: {
    skill: SkillType.Excavation,
    name: "Giga Drill Breaker",
    baseDuration: 40,
    durationPerLevel: 1,
    cooldownTicks: 4800,
  },
  greenTerra: {
    skill: SkillType.Herbalism,
    name: "Green Terra",
    baseDuration: 40,
    durationPerLevel: 1,
    cooldownTicks: 4800,
  },
  serratedStrikes: {
    skill: SkillType.Swords,
    name: "Serrated Strikes",
    baseDuration: 40,
    durationPerLevel: 1,
    cooldownTicks: 4800,
  },
  skullSplitter: {
    skill: SkillType.Axes,
    name: "Skull Splitter",
    baseDuration: 40,
    durationPerLevel: 1,
    cooldownTicks: 4800,
  },
  berserk: {
    skill: SkillType.Unarmed,
    name: "Berserk",
    baseDuration: 40,
    durationPerLevel: 1,
    cooldownTicks: 4800,
  },
};

// Sneaking readiness tracking
interface ReadyState {
  skill: SkillType;
  readyAt: number;
}

export class AbilityManager {
  private activeAbilities: Map<string, Map<string, AbilityState>> = new Map();
  private readyStates: Map<string, ReadyState> = new Map();
  private lastSneakAction: Map<string, number> = new Map();

  constructor(
    private feedback: FeedbackManager,
    private playerData: PlayerDataManager
  ) {}

  init(): void {
    system.runInterval(() => {
      this.tickAbilities();
    }, 20); // Check every second
  }

  getAbilityDef(abilityId: string): AbilityDef | undefined {
    return ABILITY_DEFS[abilityId];
  }

  getAbilityIdForSkill(skill: SkillType): string | undefined {
    for (const [id, def] of Object.entries(ABILITY_DEFS)) {
      if (def.skill === skill) return id;
    }
    return undefined;
  }

  /** Called when player sneaks - marks them as "ready" for their next tool action */
  notifySneakReady(player: Player, skill: SkillType): void {
    const data = this.playerData.getData(player);
    if (!data.abilityToggle) return;

    const abilityId = this.getAbilityIdForSkill(skill);
    if (!abilityId) return;

    const def = ABILITY_DEFS[abilityId];

    // Check cooldown
    const playerAbilities = this.activeAbilities.get(player.id);
    const existing = playerAbilities?.get(abilityId);
    if (existing) {
      if (existing.active) return;
      if (existing.cooldownUntil > system.currentTick) {
        const secondsLeft = Math.ceil((existing.cooldownUntil - system.currentTick) / 20);
        this.feedback.showAbilityCooldown(player, def.name, secondsLeft);
        return;
      }
    }

    this.readyStates.set(player.id, { skill, readyAt: system.currentTick });
    this.feedback.showAbilityReady(player, def.name);
  }

  /** Called when player performs an action (break/attack) while sneaking. Returns true if ability activated. */
  tryActivate(player: Player, skill: SkillType): boolean {
    const ready = this.readyStates.get(player.id);
    if (!ready || ready.skill !== skill) return false;

    // Ready state expires after 4 seconds
    if (system.currentTick - ready.readyAt > 80) {
      this.readyStates.delete(player.id);
      return false;
    }

    const abilityId = this.getAbilityIdForSkill(skill);
    if (!abilityId) return false;

    const def = ABILITY_DEFS[abilityId];
    const skillData = this.playerData.getSkill(player, skill);
    const duration = def.baseDuration + skillData.level * def.durationPerLevel;

    // Cap at 30 seconds (600 ticks)
    const cappedDuration = Math.min(duration, 600);

    const state: AbilityState = {
      skill,
      active: true,
      readyNotified: true,
      activatedAt: system.currentTick,
      duration: cappedDuration,
      cooldownUntil: 0,
    };

    if (!this.activeAbilities.has(player.id)) {
      this.activeAbilities.set(player.id, new Map());
    }
    this.activeAbilities.get(player.id)!.set(abilityId, state);
    this.readyStates.delete(player.id);

    this.feedback.showAbilityActivated(player, def.name, cappedDuration);
    this.applyAbilityEffects(player, abilityId, true);

    return true;
  }

  isAbilityActive(player: Player, skill: SkillType): boolean {
    const abilityId = this.getAbilityIdForSkill(skill);
    if (!abilityId) return false;
    const state = this.activeAbilities.get(player.id)?.get(abilityId);
    return state?.active ?? false;
  }

  private tickAbilities(): void {
    const currentTick = system.currentTick;
    for (const [playerId, abilities] of this.activeAbilities) {
      for (const [abilityId, state] of abilities) {
        if (!state.active) continue;
        if (currentTick - state.activatedAt >= state.duration) {
          state.active = false;
          const def = ABILITY_DEFS[abilityId];
          state.cooldownUntil = currentTick + def.cooldownTicks;

          // Find player and notify
          const player = world
            .getAllPlayers()
            .find((p: Player) => p.id === playerId);
          if (player) {
            this.feedback.showAbilityExpired(player, def.name);
            this.applyAbilityEffects(player, abilityId, false);
          }
        }
      }
    }
  }

  private applyAbilityEffects(player: Player, abilityId: string, activate: boolean): void {
    if (activate) {
      switch (abilityId) {
        case "superBreaker":
        case "gigaDrillBreaker":
          player.addEffect("haste", this.getActiveState(player, abilityId)!.duration, { amplifier: 2 });
          break;
        case "berserk":
          player.addEffect("strength", this.getActiveState(player, abilityId)!.duration, { amplifier: 0 });
          break;
      }
    } else {
      switch (abilityId) {
        case "superBreaker":
        case "gigaDrillBreaker":
          try { player.removeEffect("haste"); } catch {}
          break;
        case "berserk":
          try { player.removeEffect("strength"); } catch {}
          break;
      }
    }
  }

  private getActiveState(player: Player, abilityId: string): AbilityState | undefined {
    return this.activeAbilities.get(player.id)?.get(abilityId);
  }

  clearPlayer(playerId: string): void {
    this.activeAbilities.delete(playerId);
    this.readyStates.delete(playerId);
    this.lastSneakAction.delete(playerId);
  }
}
