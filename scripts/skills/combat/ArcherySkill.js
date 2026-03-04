import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { getEntityXp } from "../../data/CombatXpValues.js";
import { SKILL_SHOT_DAMAGE_PER_LEVEL, DAZE_CHANCE_PER_LEVEL, DAZE_DURATION_TICKS } from "../../data/SkillConstants.js";
export class ArcherySkill extends BaseSkill {
    constructor() {
        super(...arguments);
        this.skillType = SkillType.Archery;
        this.name = "Archery";
    }
    onArrowHit(player, target, damage) {
        const xp = getEntityXp(target.typeId);
        this.addXp(player, xp);
        // Skill Shot bonus damage
        const level = this.getLevel(player);
        const bonusDamagePercent = Math.min(level * SKILL_SHOT_DAMAGE_PER_LEVEL, 50); // Cap at 50%
        if (bonusDamagePercent > 0) {
            const bonusDamage = damage * (bonusDamagePercent / 100);
            try {
                target.applyDamage(bonusDamage, { cause: "projectile" });
            }
            catch { }
        }
        // Daze (nausea on players)
        if (target.typeId === "minecraft:player" && this.chanceCheck(player, DAZE_CHANCE_PER_LEVEL)) {
            try {
                target.addEffect("nausea", DAZE_DURATION_TICKS, { amplifier: 0 });
                player.sendMessage("§eDazed your target!");
            }
            catch { }
        }
    }
}
