import { Player, Block, BlockPermutation, ItemStack } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { getBlockXpEntry } from "../../data/BlockXpValues.js";
import { DOUBLE_DROP_CHANCE_PER_LEVEL, EXCAVATION_TREASURE_BASE_CHANCE, EXCAVATION_TREASURE_PER_LEVEL, TRIPLE_DROP_MULTIPLIER } from "../../data/SkillConstants.js";

interface TreasureEntry {
  itemId: string;
  minLevel: number;
  weight: number;
}

const TREASURES: TreasureEntry[] = [
  { itemId: "minecraft:glowstone_dust", minLevel: 0, weight: 30 },
  { itemId: "minecraft:bone", minLevel: 0, weight: 25 },
  { itemId: "minecraft:string", minLevel: 0, weight: 25 },
  { itemId: "minecraft:gunpowder", minLevel: 50, weight: 20 },
  { itemId: "minecraft:iron_nugget", minLevel: 100, weight: 15 },
  { itemId: "minecraft:gold_nugget", minLevel: 150, weight: 12 },
  { itemId: "minecraft:iron_ingot", minLevel: 250, weight: 8 },
  { itemId: "minecraft:gold_ingot", minLevel: 350, weight: 6 },
  { itemId: "minecraft:diamond", minLevel: 500, weight: 3 },
  { itemId: "minecraft:emerald", minLevel: 600, weight: 2 },
  { itemId: "minecraft:name_tag", minLevel: 200, weight: 5 },
  { itemId: "minecraft:music_disc_cat", minLevel: 400, weight: 2 },
];

export class ExcavationSkill extends BaseSkill {
  readonly skillType = SkillType.Excavation;
  readonly name = "Excavation";

  onBlockBreak(player: Player, block: Block, brokenPermutation: BlockPermutation): void {
    const entry = getBlockXpEntry(brokenPermutation.type.id);
    if (!entry) return;

    this.addXp(player, entry.xp);

    // Double drops
    if (this.chanceCheck(player, DOUBLE_DROP_CHANCE_PER_LEVEL)) {
      try {
        const item = new ItemStack(brokenPermutation.type.id, 1);
        block.dimension.spawnItem(item, block.location);
      } catch {}
    }

    // Treasure finding
    const abilityActive = this.isAbilityActive(player);
    const treasureMultiplier = abilityActive ? TRIPLE_DROP_MULTIPLIER : 1;
    const level = this.getLevel(player);
    const chance = EXCAVATION_TREASURE_BASE_CHANCE + level * EXCAVATION_TREASURE_PER_LEVEL;

    if (Math.random() * 100 < chance * treasureMultiplier) {
      this.spawnTreasure(player, block);
    }
  }

  private spawnTreasure(player: Player, block: Block): void {
    const level = this.getLevel(player);
    const eligible = TREASURES.filter((t) => level >= t.minLevel);
    if (eligible.length === 0) return;

    const totalWeight = eligible.reduce((sum, t) => sum + t.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const treasure of eligible) {
      roll -= treasure.weight;
      if (roll <= 0) {
        try {
          const item = new ItemStack(treasure.itemId, 1);
          block.dimension.spawnItem(item, block.location);
          player.sendMessage(`§6Treasure Found! §e${treasure.itemId.replace("minecraft:", "")}`);
        } catch {}
        return;
      }
    }
  }
}
