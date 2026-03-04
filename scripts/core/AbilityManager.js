import { system, world } from "@minecraft/server";
import { SkillType } from "../types/index.js";
const ABILITY_DEFS = {
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
export class AbilityManager {
    constructor(feedback, playerData) {
        this.feedback = feedback;
        this.playerData = playerData;
        this.activeAbilities = new Map();
        this.readyStates = new Map();
        this.lastSneakAction = new Map();
    }
    init() {
        system.runInterval(() => {
            this.tickAbilities();
        }, 20); // Check every second
    }
    getAbilityDef(abilityId) {
        return ABILITY_DEFS[abilityId];
    }
    getAbilityIdForSkill(skill) {
        for (const [id, def] of Object.entries(ABILITY_DEFS)) {
            if (def.skill === skill)
                return id;
        }
        return undefined;
    }
    /** Called when player sneaks - marks them as "ready" for their next tool action */
    notifySneakReady(player, skill) {
        const data = this.playerData.getData(player);
        if (!data.abilityToggle)
            return;
        const abilityId = this.getAbilityIdForSkill(skill);
        if (!abilityId)
            return;
        const def = ABILITY_DEFS[abilityId];
        // Check cooldown
        const playerAbilities = this.activeAbilities.get(player.id);
        const existing = playerAbilities?.get(abilityId);
        if (existing) {
            if (existing.active)
                return;
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
    tryActivate(player, skill) {
        const ready = this.readyStates.get(player.id);
        if (!ready || ready.skill !== skill)
            return false;
        // Ready state expires after 4 seconds
        if (system.currentTick - ready.readyAt > 80) {
            this.readyStates.delete(player.id);
            return false;
        }
        const abilityId = this.getAbilityIdForSkill(skill);
        if (!abilityId)
            return false;
        const def = ABILITY_DEFS[abilityId];
        const skillData = this.playerData.getSkill(player, skill);
        const duration = def.baseDuration + skillData.level * def.durationPerLevel;
        // Cap at 30 seconds (600 ticks)
        const cappedDuration = Math.min(duration, 600);
        const state = {
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
        this.activeAbilities.get(player.id).set(abilityId, state);
        this.readyStates.delete(player.id);
        this.feedback.showAbilityActivated(player, def.name, cappedDuration);
        this.applyAbilityEffects(player, abilityId, true);
        return true;
    }
    isAbilityActive(player, skill) {
        const abilityId = this.getAbilityIdForSkill(skill);
        if (!abilityId)
            return false;
        const state = this.activeAbilities.get(player.id)?.get(abilityId);
        return state?.active ?? false;
    }
    tickAbilities() {
        const currentTick = system.currentTick;
        for (const [playerId, abilities] of this.activeAbilities) {
            for (const [abilityId, state] of abilities) {
                if (!state.active)
                    continue;
                if (currentTick - state.activatedAt >= state.duration) {
                    state.active = false;
                    const def = ABILITY_DEFS[abilityId];
                    state.cooldownUntil = currentTick + def.cooldownTicks;
                    // Find player and notify
                    const player = world
                        .getAllPlayers()
                        .find((p) => p.id === playerId);
                    if (player) {
                        this.feedback.showAbilityExpired(player, def.name);
                        this.applyAbilityEffects(player, abilityId, false);
                    }
                }
            }
        }
    }
    applyAbilityEffects(player, abilityId, activate) {
        if (activate) {
            switch (abilityId) {
                case "superBreaker":
                case "gigaDrillBreaker":
                    player.addEffect("haste", this.getActiveState(player, abilityId).duration, { amplifier: 2 });
                    break;
                case "berserk":
                    player.addEffect("strength", this.getActiveState(player, abilityId).duration, { amplifier: 0 });
                    break;
            }
        }
        else {
            switch (abilityId) {
                case "superBreaker":
                case "gigaDrillBreaker":
                    try {
                        player.removeEffect("haste");
                    }
                    catch { }
                    break;
                case "berserk":
                    try {
                        player.removeEffect("strength");
                    }
                    catch { }
                    break;
            }
        }
    }
    getActiveState(player, abilityId) {
        return this.activeAbilities.get(player.id)?.get(abilityId);
    }
    clearPlayer(playerId) {
        this.activeAbilities.delete(playerId);
        this.readyStates.delete(playerId);
        this.lastSneakAction.delete(playerId);
    }
}
