import { Player, Entity, EquipmentSlot } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { getEntityXp } from "../../data/CombatXpValues.js";
import {
  IRON_ARM_DAMAGE_PER_LEVEL, IRON_ARM_MAX_BONUS,
  DISARM_CHANCE_PER_LEVEL, ARROW_DEFLECT_CHANCE_PER_LEVEL
} from "../../data/SkillConstants.js";

export class UnarmedSkill extends BaseSkill {
  readonly skillType = SkillType.Unarmed;
  readonly name = "Unarmed";

  onHit(player: Player, target: Entity, damage: number): void {
    const xp = getEntityXp(target.typeId);
    this.addXp(player, xp);

    const level = this.getLevel(player);
    const abilityActive = this.isAbilityActive(player);

    // Iron Arm bonus damage
    const bonusDamage = Math.min(level * IRON_ARM_DAMAGE_PER_LEVEL, IRON_ARM_MAX_BONUS);
    if (bonusDamage > 0) {
      try {
        target.applyDamage(bonusDamage, { cause: "entityAttack" as any });
      } catch {}
    }

    // Disarm (against players)
    if (target.typeId === "minecraft:player") {
      const disarmChance = abilityActive
        ? level * DISARM_CHANCE_PER_LEVEL * 2
        : level * DISARM_CHANCE_PER_LEVEL;

      if (Math.random() * 100 < disarmChance) {
        this.disarmPlayer(target as Player);
      }
    }
  }

  onArrowDefend(player: Player, damage: number): void {
    // Arrow Deflect
    if (this.chanceCheck(player, ARROW_DEFLECT_CHANCE_PER_LEVEL)) {
      // Heal back the damage to simulate deflection
      try {
        const health = player.getComponent("minecraft:health");
        if (health) {
          const current = health.currentValue;
          const max = health.effectiveMax;
          health.setCurrentValue(Math.min(current + damage, max));
          player.sendMessage("§a§lArrow Deflected!");
        }
      } catch {}
    }
  }

  private disarmPlayer(target: Player): void {
    try {
      const equipment = target.getComponent("minecraft:equippable");
      if (!equipment) return;
      const mainhand = equipment.getEquipment(EquipmentSlot.Mainhand);
      if (!mainhand) return;

      // Drop the item
      target.dimension.spawnItem(mainhand, target.location);
      equipment.setEquipment(EquipmentSlot.Mainhand, undefined);
      target.sendMessage("§c§lYou have been disarmed!");
    } catch {}
  }
}
