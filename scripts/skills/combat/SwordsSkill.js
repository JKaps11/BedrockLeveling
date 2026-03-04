import { system } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { getEntityXp } from "../../data/CombatXpValues.js";
import { BLEED_CHANCE_PER_LEVEL, BLEED_TICKS, BLEED_DAMAGE, BLEED_INTERVAL, COUNTER_ATTACK_CHANCE_PER_LEVEL, COUNTER_ATTACK_DAMAGE_MULT, SERRATED_STRIKES_AOE_RADIUS } from "../../data/SkillConstants.js";
export class SwordsSkill extends BaseSkill {
    constructor() {
        super(...arguments);
        this.skillType = SkillType.Swords;
        this.name = "Swords";
        this.bleedingEntities = new Map();
    }
    onHit(player, target, damage) {
        const xp = getEntityXp(target.typeId);
        this.addXp(player, xp);
        const abilityActive = this.isAbilityActive(player);
        // Bleed
        if (abilityActive || this.chanceCheck(player, BLEED_CHANCE_PER_LEVEL)) {
            this.applyBleed(target);
        }
        // Serrated Strikes AoE
        if (abilityActive) {
            const nearby = target.dimension.getEntities({
                location: target.location,
                maxDistance: SERRATED_STRIKES_AOE_RADIUS,
                excludeTypes: ["minecraft:player", "minecraft:item"],
            });
            for (const entity of nearby) {
                if (entity.id === target.id)
                    continue;
                try {
                    entity.applyDamage(damage * 0.5, { cause: "entityAttack" });
                    this.applyBleed(entity);
                }
                catch { }
            }
        }
    }
    onDefend(player, attacker, damage) {
        // Counter Attack
        if (this.chanceCheck(player, COUNTER_ATTACK_CHANCE_PER_LEVEL)) {
            try {
                const counterDamage = damage * COUNTER_ATTACK_DAMAGE_MULT;
                attacker.applyDamage(counterDamage, { cause: "entityAttack" });
                player.sendMessage("§6Counter Attack!");
            }
            catch { }
        }
    }
    applyBleed(entity) {
        const entityId = entity.id;
        // Clear existing bleed
        const existing = this.bleedingEntities.get(entityId);
        if (existing) {
            system.clearRun(existing.intervalId);
        }
        let ticksRemaining = BLEED_TICKS;
        const intervalId = system.runInterval(() => {
            try {
                if (ticksRemaining <= 0 || !entity.isValid) {
                    system.clearRun(intervalId);
                    this.bleedingEntities.delete(entityId);
                    return;
                }
                entity.applyDamage(BLEED_DAMAGE, { cause: "magic" });
                ticksRemaining--;
            }
            catch {
                system.clearRun(intervalId);
                this.bleedingEntities.delete(entityId);
            }
        }, BLEED_INTERVAL);
        this.bleedingEntities.set(entityId, { ticksRemaining, intervalId });
    }
}
