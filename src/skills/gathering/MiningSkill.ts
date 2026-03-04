import { Player, Block, BlockPermutation, ItemStack } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { getBlockXpEntry } from "../../data/BlockXpValues.js";
import { DOUBLE_DROP_CHANCE_PER_LEVEL } from "../../data/SkillConstants.js";

export class MiningSkill extends BaseSkill {
  readonly skillType = SkillType.Mining;
  readonly name = "Mining";

  onBlockBreak(player: Player, block: Block, brokenPermutation: BlockPermutation): void {
    const entry = getBlockXpEntry(brokenPermutation.type.id);
    if (!entry) return;

    this.addXp(player, entry.xp);

    // Double drops
    if (this.chanceCheck(player, DOUBLE_DROP_CHANCE_PER_LEVEL)) {
      this.spawnExtraDrops(block, brokenPermutation);
    }
  }

  private spawnExtraDrops(block: Block, permutation: BlockPermutation): void {
    // Spawn a duplicate of the mined block's item at the block location
    const typeId = permutation.type.id;
    const itemId = this.getDropItem(typeId);
    if (!itemId) return;

    try {
      const item = new ItemStack(itemId, 1);
      block.dimension.spawnItem(item, block.location);
    } catch {
      // Block may not have a simple item equivalent
    }
  }

  private getDropItem(blockTypeId: string): string | undefined {
    const dropMap: Record<string, string> = {
      "minecraft:coal_ore": "minecraft:coal",
      "minecraft:deepslate_coal_ore": "minecraft:coal",
      "minecraft:iron_ore": "minecraft:raw_iron",
      "minecraft:deepslate_iron_ore": "minecraft:raw_iron",
      "minecraft:copper_ore": "minecraft:raw_copper",
      "minecraft:deepslate_copper_ore": "minecraft:raw_copper",
      "minecraft:gold_ore": "minecraft:raw_gold",
      "minecraft:deepslate_gold_ore": "minecraft:raw_gold",
      "minecraft:redstone_ore": "minecraft:redstone",
      "minecraft:deepslate_redstone_ore": "minecraft:redstone",
      "minecraft:lapis_ore": "minecraft:lapis_lazuli",
      "minecraft:deepslate_lapis_ore": "minecraft:lapis_lazuli",
      "minecraft:diamond_ore": "minecraft:diamond",
      "minecraft:deepslate_diamond_ore": "minecraft:diamond",
      "minecraft:emerald_ore": "minecraft:emerald",
      "minecraft:deepslate_emerald_ore": "minecraft:emerald",
      "minecraft:nether_gold_ore": "minecraft:gold_nugget",
      "minecraft:nether_quartz_ore": "minecraft:quartz",
      "minecraft:glowstone": "minecraft:glowstone_dust",
    };
    // For stone/cobblestone, drop cobblestone
    if (blockTypeId === "minecraft:stone") return "minecraft:cobblestone";
    return dropMap[blockTypeId] ?? blockTypeId;
  }
}
