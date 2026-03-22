import { EquipmentSlot, system } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { SUPER_REPAIR_CHANCE_PER_LEVEL, REPAIR_XP_PER_USE } from "../../data/SkillConstants.js";
export class RepairSkill extends BaseSkill {
    constructor() {
        super(...arguments);
        this.skillType = SkillType.Repair;
        this.name = "Repair";
        // Tracks durability snapshots when a player opens an anvil
        this.anvilSnapshots = new Map();
    }
    onAnvilOpen(player) {
        // Snapshot current mainhand damage value
        try {
            const equipment = player.getComponent("minecraft:equippable");
            const mainhand = equipment?.getEquipment(EquipmentSlot.Mainhand);
            if (mainhand) {
                const durability = mainhand.getComponent("minecraft:durability");
                if (durability && durability.damage > 0) {
                    this.anvilSnapshots.set(player.id, durability.damage);
                    // Check after a delay if durability changed (player completed a repair)
                    system.runTimeout(() => {
                        this.checkRepairComplete(player);
                    }, 20); // 1 second
                    // Also check at longer intervals in case player takes time
                    system.runTimeout(() => {
                        this.checkRepairComplete(player);
                    }, 100); // 5 seconds
                    system.runTimeout(() => {
                        this.checkRepairComplete(player);
                    }, 200); // 10 seconds
                    return;
                }
            }
        }
        catch { }
    }
    checkRepairComplete(player) {
        const snapshot = this.anvilSnapshots.get(player.id);
        if (snapshot === undefined)
            return;
        try {
            const equipment = player.getComponent("minecraft:equippable");
            const mainhand = equipment?.getEquipment(EquipmentSlot.Mainhand);
            if (!mainhand) {
                this.anvilSnapshots.delete(player.id);
                return;
            }
            const durability = mainhand.getComponent("minecraft:durability");
            if (!durability) {
                this.anvilSnapshots.delete(player.id);
                return;
            }
            // Durability decreased = item was repaired
            if (durability.damage < snapshot) {
                this.anvilSnapshots.delete(player.id);
                this.addXp(player, REPAIR_XP_PER_USE);
                // Super Repair: chance to grant bonus durability
                if (this.chanceCheck(player, SUPER_REPAIR_CHANCE_PER_LEVEL)) {
                    player.sendMessage("§a§lSuper Repair! §7Bonus durability restored.");
                    const bonusRepair = Math.floor(durability.maxDurability * 0.1);
                    durability.damage = Math.max(0, durability.damage - bonusRepair);
                    equipment.setEquipment(EquipmentSlot.Mainhand, mainhand);
                }
            }
        }
        catch { }
    }
}
