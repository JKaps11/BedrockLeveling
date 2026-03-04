import { Player } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { DODGE_CHANCE_PER_LEVEL, GRACEFUL_ROLL_MULTIPLIER, ACROBATICS_XP_PER_HALF_HEART } from "../../data/SkillConstants.js";

export class AcrobaticsSkill extends BaseSkill {
  readonly skillType = SkillType.Acrobatics;
  readonly name = "Acrobatics";

  onFallDamage(player: Player, damage: number): void {
    // XP from fall damage: 120 per half-heart
    const xp = Math.floor(damage * ACROBATICS_XP_PER_HALF_HEART);
    this.addXp(player, xp);

    const level = this.getLevel(player);
    let dodgeChance = level * DODGE_CHANCE_PER_LEVEL;

    // Graceful Roll: 2x dodge chance while sneaking
    if (player.isSneaking) {
      dodgeChance *= GRACEFUL_ROLL_MULTIPLIER;
    }

    dodgeChance = Math.min(dodgeChance, 50); // Cap at 50%

    if (Math.random() * 100 < dodgeChance) {
      // Heal back half the damage
      try {
        const health = player.getComponent("minecraft:health");
        if (health) {
          const healAmount = damage * 0.5;
          health.setCurrentValue(Math.min(health.currentValue + healAmount, health.effectiveMax));
          if (player.isSneaking) {
            player.sendMessage("§a§lGraceful Roll!");
          } else {
            player.sendMessage("§a§lDodge!");
          }
        }
      } catch {}
    }
  }
}
