import { Player, ItemStack } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { FISHING_BASE_XP } from "../../data/SkillConstants.js";

interface FishingTreasure {
  itemId: string;
  minLevel: number;
  weight: number;
}

const FISHING_TREASURES: FishingTreasure[] = [
  { itemId: "minecraft:name_tag", minLevel: 100, weight: 10 },
  { itemId: "minecraft:saddle", minLevel: 100, weight: 8 },
  { itemId: "minecraft:nautilus_shell", minLevel: 200, weight: 6 },
  { itemId: "minecraft:iron_ingot", minLevel: 150, weight: 12 },
  { itemId: "minecraft:gold_ingot", minLevel: 250, weight: 8 },
  { itemId: "minecraft:diamond", minLevel: 500, weight: 3 },
  { itemId: "minecraft:emerald", minLevel: 400, weight: 4 },
  { itemId: "minecraft:enchanted_book", minLevel: 300, weight: 5 },
];

export class FishingSkill extends BaseSkill {
  readonly skillType = SkillType.Fishing;
  readonly name = "Fishing";

  onFishCaught(player: Player): void {
    this.addXp(player, FISHING_BASE_XP);

    // Treasure chance: 0.5% + 0.05% per level
    const level = this.getLevel(player);
    const treasureChance = 0.5 + level * 0.05;

    if (Math.random() * 100 < treasureChance) {
      this.spawnFishingTreasure(player, level);
    }
  }

  private spawnFishingTreasure(player: Player, level: number): void {
    const eligible = FISHING_TREASURES.filter((t) => level >= t.minLevel);
    if (eligible.length === 0) return;

    const totalWeight = eligible.reduce((sum, t) => sum + t.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const treasure of eligible) {
      roll -= treasure.weight;
      if (roll <= 0) {
        try {
          const item = new ItemStack(treasure.itemId, 1);
          player.dimension.spawnItem(item, player.location);
          player.sendMessage(`§6Fishing Treasure! §e${treasure.itemId.replace("minecraft:", "")}`);
        } catch {}
        return;
      }
    }
  }
}
