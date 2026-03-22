import { Player, EquipmentSlot, system } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { SUPER_REPAIR_CHANCE_PER_LEVEL, REPAIR_XP_PER_USE } from "../../data/SkillConstants.js";

interface AnvilSnapshot {
  typeId: string;
  damage: number;
  token: number;
}

export class RepairSkill extends BaseSkill {
  readonly skillType = SkillType.Repair;
  readonly name = "Repair";

  // Tracks durability snapshots when a player opens an anvil
  private anvilSnapshots: Map<string, AnvilSnapshot> = new Map();
  private pendingTimeouts: Map<string, number[]> = new Map();
  private nextToken = 0;

  onAnvilOpen(player: Player): void {
    // Cancel any existing timeouts for this player
    this.clearPlayer(player.id);

    try {
      const equipment = player.getComponent("minecraft:equippable");
      const mainhand = equipment?.getEquipment(EquipmentSlot.Mainhand);
      if (mainhand) {
        const durability = mainhand.getComponent("minecraft:durability");
        if (durability && durability.damage > 0) {
          const token = this.nextToken++;
          this.anvilSnapshots.set(player.id, {
            typeId: mainhand.typeId,
            damage: durability.damage,
            token,
          });

          const handles: number[] = [];
          // Check after delays if durability changed (player completed a repair)
          for (const delay of [20, 100, 200]) {
            const handle = system.runTimeout(() => {
              this.checkRepairComplete(player, token);
            }, delay);
            handles.push(handle);
          }
          this.pendingTimeouts.set(player.id, handles);
          return;
        }
      }
    } catch (e) {
      console.warn(`[McMMO] RepairSkill.onAnvilOpen error: ${e}`);
    }
  }

  private checkRepairComplete(player: Player, token: number): void {
    const snapshot = this.anvilSnapshots.get(player.id);
    if (snapshot === undefined || snapshot.token !== token) return;

    try {
      if (!player.isValid) {
        this.clearPlayer(player.id);
        return;
      }

      const equipment = player.getComponent("minecraft:equippable");
      const mainhand = equipment?.getEquipment(EquipmentSlot.Mainhand);
      if (!mainhand) {
        this.clearPlayer(player.id);
        return;
      }

      // Verify item identity matches snapshot
      if (mainhand.typeId !== snapshot.typeId) {
        this.clearPlayer(player.id);
        return;
      }

      const durability = mainhand.getComponent("minecraft:durability");
      if (!durability) {
        this.clearPlayer(player.id);
        return;
      }

      // Durability decreased = item was repaired
      if (durability.damage < snapshot.damage) {
        this.clearPlayer(player.id);
        this.addXp(player, REPAIR_XP_PER_USE);

        // Super Repair: chance to grant bonus durability
        if (this.chanceCheck(player, SUPER_REPAIR_CHANCE_PER_LEVEL)) {
          player.sendMessage("§a§lSuper Repair! §7Bonus durability restored.");
          const bonusRepair = Math.floor(durability.maxDurability * 0.1);
          durability.damage = Math.max(0, durability.damage - bonusRepair);
          equipment!.setEquipment(EquipmentSlot.Mainhand, mainhand);
        }
      }
    } catch (e) {
      console.warn(`[McMMO] RepairSkill.checkRepairComplete error: ${e}`);
    }
  }

  clearPlayer(playerId: string): void {
    this.anvilSnapshots.delete(playerId);
    const handles = this.pendingTimeouts.get(playerId);
    if (handles) {
      for (const handle of handles) {
        system.clearRun(handle);
      }
      this.pendingTimeouts.delete(playerId);
    }
  }
}
