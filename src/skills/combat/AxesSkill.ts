import { Player, Entity } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { getEntityXp } from "../../data/CombatXpValues.js";
import {
  CRITICAL_STRIKE_CHANCE_PER_LEVEL, CRITICAL_STRIKE_DAMAGE_MULT,
  SKULL_SPLITTER_AOE_RADIUS, SKULL_SPLITTER_DAMAGE_MULT
} from "../../data/SkillConstants.js";

export class AxesSkill extends BaseSkill {
  readonly skillType = SkillType.Axes;
  readonly name = "Axes";

  onHit(player: Player, target: Entity, damage: number): void {
    const xp = getEntityXp(target.typeId);
    this.addXp(player, xp);

    // Critical Strike
    if (this.chanceCheck(player, CRITICAL_STRIKE_CHANCE_PER_LEVEL)) {
      const bonusDamage = damage * (CRITICAL_STRIKE_DAMAGE_MULT - 1);
      try {
        target.applyDamage(bonusDamage, { cause: "entityAttack" as any });
        player.sendMessage("§c§lCRITICAL HIT!");
      } catch {}
    }

    // Skull Splitter AoE
    if (this.isAbilityActive(player)) {
      const nearby = target.dimension.getEntities({
        location: target.location,
        maxDistance: SKULL_SPLITTER_AOE_RADIUS,
        excludeTypes: ["minecraft:player", "minecraft:item"],
      });
      for (const entity of nearby) {
        if (entity.id === target.id) continue;
        try {
          entity.applyDamage(damage * SKULL_SPLITTER_DAMAGE_MULT, { cause: "entityAttack" as any });
        } catch {}
      }
    }
  }
}
