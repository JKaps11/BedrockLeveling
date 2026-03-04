import { world } from "@minecraft/server";
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
        // Try to find the taming player
        const owner = tameable.tamedToPlayer;
        if (!owner)
            return;
        const player = world.getAllPlayers().find(p => p.name === owner || p.id === owner);
        if (!player)
            return;
        const xp = getEntityXp(target.typeId);
        this.addXp(player, Math.floor(xp * 0.5)); // Reduced XP from wolf kills
        const level = this.getLevel(player);
        // Gore: bonus bleed damage
        if (Math.random() * 100 < level * TAMING_GORE_CHANCE_PER_LEVEL) {
            try {
                target.applyDamage(damage * 0.5, { cause: "entityAttack" });
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
    }
    applyPetBuffs(player, wolf) {
        const level = this.getLevel(player);
        // Thick Fur - fire resistance
        if (level >= TAMING_THICK_FUR_LEVEL) {
            try {
                wolf.addEffect("fire_resistance", 1200, { amplifier: 0 });
            }
            catch { }
        }
        // Holy Hound - regeneration
        if (level >= TAMING_HOLY_HOUND_LEVEL) {
            try {
                wolf.addEffect("regeneration", 1200, { amplifier: 0 });
            }
            catch { }
        }
    }
}
