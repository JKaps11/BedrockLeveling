import { SkillType } from "../types/index.js";

interface BlockXpEntry {
  skill: SkillType;
  xp: number;
}

export const BLOCK_XP_VALUES: Record<string, BlockXpEntry> = {
  // Mining - Ores
  "minecraft:coal_ore": { skill: SkillType.Mining, xp: 100 },
  "minecraft:deepslate_coal_ore": { skill: SkillType.Mining, xp: 100 },
  "minecraft:iron_ore": { skill: SkillType.Mining, xp: 250 },
  "minecraft:deepslate_iron_ore": { skill: SkillType.Mining, xp: 250 },
  "minecraft:copper_ore": { skill: SkillType.Mining, xp: 200 },
  "minecraft:deepslate_copper_ore": { skill: SkillType.Mining, xp: 200 },
  "minecraft:gold_ore": { skill: SkillType.Mining, xp: 350 },
  "minecraft:deepslate_gold_ore": { skill: SkillType.Mining, xp: 350 },
  "minecraft:redstone_ore": { skill: SkillType.Mining, xp: 150 },
  "minecraft:deepslate_redstone_ore": { skill: SkillType.Mining, xp: 150 },
  "minecraft:lapis_ore": { skill: SkillType.Mining, xp: 400 },
  "minecraft:deepslate_lapis_ore": { skill: SkillType.Mining, xp: 400 },
  "minecraft:diamond_ore": { skill: SkillType.Mining, xp: 750 },
  "minecraft:deepslate_diamond_ore": { skill: SkillType.Mining, xp: 750 },
  "minecraft:emerald_ore": { skill: SkillType.Mining, xp: 1000 },
  "minecraft:deepslate_emerald_ore": { skill: SkillType.Mining, xp: 1000 },
  "minecraft:nether_gold_ore": { skill: SkillType.Mining, xp: 250 },
  "minecraft:ancient_debris": { skill: SkillType.Mining, xp: 1000 },
  "minecraft:nether_quartz_ore": { skill: SkillType.Mining, xp: 200 },
  // Mining - Stone
  "minecraft:stone": { skill: SkillType.Mining, xp: 30 },
  "minecraft:cobblestone": { skill: SkillType.Mining, xp: 10 },
  "minecraft:deepslate": { skill: SkillType.Mining, xp: 30 },
  "minecraft:cobbled_deepslate": { skill: SkillType.Mining, xp: 10 },
  "minecraft:granite": { skill: SkillType.Mining, xp: 30 },
  "minecraft:diorite": { skill: SkillType.Mining, xp: 30 },
  "minecraft:andesite": { skill: SkillType.Mining, xp: 30 },
  "minecraft:tuff": { skill: SkillType.Mining, xp: 30 },
  "minecraft:calcite": { skill: SkillType.Mining, xp: 30 },
  "minecraft:netherrack": { skill: SkillType.Mining, xp: 10 },
  "minecraft:basalt": { skill: SkillType.Mining, xp: 30 },
  "minecraft:blackstone": { skill: SkillType.Mining, xp: 30 },
  "minecraft:end_stone": { skill: SkillType.Mining, xp: 50 },
  "minecraft:obsidian": { skill: SkillType.Mining, xp: 150 },
  "minecraft:glowstone": { skill: SkillType.Mining, xp: 80 },
  "minecraft:sandstone": { skill: SkillType.Mining, xp: 30 },
  "minecraft:red_sandstone": { skill: SkillType.Mining, xp: 30 },

  // Woodcutting - Logs
  "minecraft:oak_log": { skill: SkillType.Woodcutting, xp: 70 },
  "minecraft:spruce_log": { skill: SkillType.Woodcutting, xp: 80 },
  "minecraft:birch_log": { skill: SkillType.Woodcutting, xp: 90 },
  "minecraft:jungle_log": { skill: SkillType.Woodcutting, xp: 100 },
  "minecraft:acacia_log": { skill: SkillType.Woodcutting, xp: 90 },
  "minecraft:dark_oak_log": { skill: SkillType.Woodcutting, xp: 90 },
  "minecraft:mangrove_log": { skill: SkillType.Woodcutting, xp: 90 },
  "minecraft:cherry_log": { skill: SkillType.Woodcutting, xp: 90 },
  "minecraft:crimson_stem": { skill: SkillType.Woodcutting, xp: 100 },
  "minecraft:warped_stem": { skill: SkillType.Woodcutting, xp: 100 },
  "minecraft:stripped_oak_log": { skill: SkillType.Woodcutting, xp: 70 },
  "minecraft:stripped_spruce_log": { skill: SkillType.Woodcutting, xp: 80 },
  "minecraft:stripped_birch_log": { skill: SkillType.Woodcutting, xp: 90 },
  "minecraft:stripped_jungle_log": { skill: SkillType.Woodcutting, xp: 100 },
  "minecraft:stripped_acacia_log": { skill: SkillType.Woodcutting, xp: 90 },
  "minecraft:stripped_dark_oak_log": { skill: SkillType.Woodcutting, xp: 90 },
  "minecraft:stripped_mangrove_log": { skill: SkillType.Woodcutting, xp: 90 },
  "minecraft:stripped_cherry_log": { skill: SkillType.Woodcutting, xp: 90 },
  "minecraft:stripped_crimson_stem": { skill: SkillType.Woodcutting, xp: 100 },
  "minecraft:stripped_warped_stem": { skill: SkillType.Woodcutting, xp: 100 },

  // Excavation
  "minecraft:dirt": { skill: SkillType.Excavation, xp: 40 },
  "minecraft:grass_block": { skill: SkillType.Excavation, xp: 40 },
  "minecraft:sand": { skill: SkillType.Excavation, xp: 40 },
  "minecraft:red_sand": { skill: SkillType.Excavation, xp: 40 },
  "minecraft:gravel": { skill: SkillType.Excavation, xp: 40 },
  "minecraft:clay": { skill: SkillType.Excavation, xp: 80 },
  "minecraft:soul_sand": { skill: SkillType.Excavation, xp: 40 },
  "minecraft:soul_soil": { skill: SkillType.Excavation, xp: 40 },
  "minecraft:mycelium": { skill: SkillType.Excavation, xp: 80 },
  "minecraft:podzol": { skill: SkillType.Excavation, xp: 80 },
  "minecraft:rooted_dirt": { skill: SkillType.Excavation, xp: 40 },
  "minecraft:mud": { skill: SkillType.Excavation, xp: 40 },
  "minecraft:snow_layer": { skill: SkillType.Excavation, xp: 20 },

  // Herbalism - Crops
  "minecraft:wheat": { skill: SkillType.Herbalism, xp: 50 },
  "minecraft:carrots": { skill: SkillType.Herbalism, xp: 50 },
  "minecraft:potatoes": { skill: SkillType.Herbalism, xp: 50 },
  "minecraft:beetroot": { skill: SkillType.Herbalism, xp: 50 },
  "minecraft:nether_wart": { skill: SkillType.Herbalism, xp: 50 },
  "minecraft:melon_block": { skill: SkillType.Herbalism, xp: 100 },
  "minecraft:pumpkin": { skill: SkillType.Herbalism, xp: 100 },
  "minecraft:sugar_cane": { skill: SkillType.Herbalism, xp: 30 },
  "minecraft:cactus": { skill: SkillType.Herbalism, xp: 50 },
  "minecraft:brown_mushroom": { skill: SkillType.Herbalism, xp: 50 },
  "minecraft:red_mushroom": { skill: SkillType.Herbalism, xp: 50 },
  "minecraft:tall_grass": { skill: SkillType.Herbalism, xp: 10 },
  "minecraft:short_grass": { skill: SkillType.Herbalism, xp: 10 },
  "minecraft:fern": { skill: SkillType.Herbalism, xp: 10 },
  "minecraft:sweet_berry_bush": { skill: SkillType.Herbalism, xp: 50 },
  "minecraft:cocoa": { skill: SkillType.Herbalism, xp: 80 },
};

export function getBlockXpEntry(blockTypeId: string): BlockXpEntry | undefined {
  return BLOCK_XP_VALUES[blockTypeId];
}

// Sets of block type IDs per skill for quick lookups
export const MINING_BLOCKS = new Set(
  Object.entries(BLOCK_XP_VALUES)
    .filter(([, e]) => e.skill === SkillType.Mining)
    .map(([k]) => k)
);

export const WOODCUTTING_BLOCKS = new Set(
  Object.entries(BLOCK_XP_VALUES)
    .filter(([, e]) => e.skill === SkillType.Woodcutting)
    .map(([k]) => k)
);

export const EXCAVATION_BLOCKS = new Set(
  Object.entries(BLOCK_XP_VALUES)
    .filter(([, e]) => e.skill === SkillType.Excavation)
    .map(([k]) => k)
);

export const HERBALISM_BLOCKS = new Set(
  Object.entries(BLOCK_XP_VALUES)
    .filter(([, e]) => e.skill === SkillType.Herbalism)
    .map(([k]) => k)
);

// Logs for tree feller detection
export const LOG_BLOCKS = new Set([
  "minecraft:oak_log", "minecraft:spruce_log", "minecraft:birch_log",
  "minecraft:jungle_log", "minecraft:acacia_log", "minecraft:dark_oak_log",
  "minecraft:mangrove_log", "minecraft:cherry_log",
  "minecraft:crimson_stem", "minecraft:warped_stem",
  "minecraft:stripped_oak_log", "minecraft:stripped_spruce_log",
  "minecraft:stripped_birch_log", "minecraft:stripped_jungle_log",
  "minecraft:stripped_acacia_log", "minecraft:stripped_dark_oak_log",
  "minecraft:stripped_mangrove_log", "minecraft:stripped_cherry_log",
  "minecraft:stripped_crimson_stem", "minecraft:stripped_warped_stem",
]);

export const LEAF_BLOCKS = new Set([
  "minecraft:oak_leaves", "minecraft:spruce_leaves", "minecraft:birch_leaves",
  "minecraft:jungle_leaves", "minecraft:acacia_leaves", "minecraft:dark_oak_leaves",
  "minecraft:mangrove_leaves", "minecraft:cherry_leaves",
  "minecraft:azalea_leaves", "minecraft:azalea_leaves_flowered",
  "minecraft:nether_wart_block", "minecraft:warped_wart_block",
]);
