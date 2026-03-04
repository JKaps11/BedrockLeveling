import { Player, EquipmentSlot } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { SUPER_REPAIR_CHANCE_PER_LEVEL, REPAIR_XP_PER_USE } from "../../data/SkillConstants.js";

export class RepairSkill extends BaseSkill {
  readonly skillType = SkillType.Repair;
  readonly name = "Repair";

  onAnvilUse(player: Player): void {
    this.addXp(player, REPAIR_XP_PER_USE);

    // Super Repair: chance to double the repair amount
    if (this.chanceCheck(player, SUPER_REPAIR_CHANCE_PER_LEVEL)) {
      player.sendMessage("§a§lSuper Repair! §7Bonus durability restored.");
      // Note: In Bedrock Script API we can't directly intercept anvil repair amounts,
      // so we grant bonus durability to the main hand item after the fact
      try {
        const equipment = player.getComponent("minecraft:equippable");
        const mainhand = equipment?.getEquipment(EquipmentSlot.Mainhand);
        if (mainhand) {
          const durability = mainhand.getComponent("minecraft:durability");
          if (durability) {
            const bonusRepair = Math.floor(durability.maxDurability * 0.1);
            durability.damage = Math.max(0, durability.damage - bonusRepair);
            equipment!.setEquipment(EquipmentSlot.Mainhand, mainhand);
          }
        }
      } catch {}
    }
  }
}
