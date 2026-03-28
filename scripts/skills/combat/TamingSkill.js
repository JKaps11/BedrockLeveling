import { EntityDamageCause } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { getEntityXp } from "../../data/CombatXpValues.js";
import { TAMING_GORE_CHANCE_PER_LEVEL, TAMING_THICK_FUR_LEVEL, TAMING_HOLY_HOUND_LEVEL, TAMING_FAST_FOOD_LEVEL, TAMING_FAST_FOOD_CHANCE } from "../../data/SkillConstants.js";
export class TamingSkill extends BaseSkill {
    constructor() {
        super(...arguments);
        this.skillType = SkillType.Taming;
        this.name = "Taming";
    }
    onWolfAttack(wolf, target, damage) {
        // Find owner
        const tameable = wolf.getComponent("minecraft:tameable");
        if (!tameable)
            return;
        const player = tameable.tamedToPlayer;
        if (!player)
            return;
        const xp = getEntityXp(target.typeId);
        this.addXp(player, Math.floor(xp * 0.5)); // Reduced XP from wolf kills
        const level = this.getLevel(player);
        // Gore: bonus bleed damage
        if (Math.random() * 100 < level * TAMING_GORE_CHANCE_PER_LEVEL) {
            try {
                target.applyDamage(damage * 0.5, { cause: EntityDamageCause.entityAttack });
            }
            catch { }
        }
        // Fast Food Service: heal wolf
        if (level >= TAMING_FAST_FOOD_LEVEL && Math.random() * 100 < TAMING_FAST_FOOD_CHANCE) {
            try {
                const health = wolf.getComponent("minecraft:health");
                if (health) {
                    health.setCurrentValue(Math.min(health.currentValue + 2, health.effectiveMax));
                }
            }
            catch { }
        }
        // Apply passive pet buffs (fire res, regen) on each attack
        this.applyPetBuffs(player, wolf);
    }
    needsRefresh(wolf, effectId, threshold = 40) {
        try {
            const effect = wolf.getEffect(effectId);
            return !effect || effect.duration < threshold;
        }
        catch (err) {
            console.warn(`[Taming] needsRefresh failed for effect "${effectId}":`, err);
            return true;
        }
    }
    applyPetBuffs(player, wolf) {
        const level = this.getLevel(player);
        // Thick Fur - fire resistance
        if (level >= TAMING_THICK_FUR_LEVEL && this.needsRefresh(wolf, "fire_resistance")) {
            try {
                wolf.addEffect("fire_resistance", 1200, { amplifier: 0 });
            }
            catch { }
        }
        // Holy Hound - regeneration
        if (level >= TAMING_HOLY_HOUND_LEVEL && this.needsRefresh(wolf, "regeneration")) {
            try {
                wolf.addEffect("regeneration", 1200, { amplifier: 0 });
            }
            catch { }
        }
    }
}
