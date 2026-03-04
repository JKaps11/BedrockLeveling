import { ItemStack, system } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { getBlockXpEntry } from "../../data/BlockXpValues.js";
import { DOUBLE_DROP_CHANCE_PER_LEVEL, GREEN_THUMB_CHANCE_PER_LEVEL, TRIPLE_DROP_MULTIPLIER } from "../../data/SkillConstants.js";
const REPLANTABLE_CROPS = {
    "minecraft:wheat": "minecraft:wheat_seeds",
    "minecraft:carrots": "minecraft:carrot",
    "minecraft:potatoes": "minecraft:potato",
    "minecraft:beetroot": "minecraft:beetroot_seeds",
    "minecraft:nether_wart": "minecraft:nether_wart",
};
export class HerbalismSkill extends BaseSkill {
    constructor() {
        super(...arguments);
        this.skillType = SkillType.Herbalism;
        this.name = "Herbalism";
    }
    onBlockBreak(player, block, brokenPermutation) {
        const blockType = brokenPermutation.type.id;
        const entry = getBlockXpEntry(blockType);
        if (!entry)
            return;
        this.addXp(player, entry.xp);
        const abilityActive = this.isAbilityActive(player);
        // Double/Triple drops
        const dropMult = abilityActive ? TRIPLE_DROP_MULTIPLIER : 1;
        if (abilityActive || this.chanceCheck(player, DOUBLE_DROP_CHANCE_PER_LEVEL)) {
            const itemId = this.getCropDrop(blockType);
            if (itemId) {
                try {
                    const count = abilityActive ? TRIPLE_DROP_MULTIPLIER : 1;
                    const item = new ItemStack(itemId, count);
                    block.dimension.spawnItem(item, block.location);
                }
                catch { }
            }
        }
        // Green Thumb auto-replant
        if (REPLANTABLE_CROPS[blockType]) {
            const replantChance = abilityActive ? 100 : this.getLevel(player) * GREEN_THUMB_CHANCE_PER_LEVEL;
            if (Math.random() * 100 < replantChance) {
                // Replant after a tick (block needs to be air first)
                const loc = block.location;
                const dim = block.dimension;
                const cropType = blockType;
                system.runTimeout(() => {
                    try {
                        const b = dim.getBlock(loc);
                        if (b && b.typeId === "minecraft:air") {
                            b.setType(cropType);
                        }
                    }
                    catch { }
                }, 2);
            }
        }
    }
    getCropDrop(blockTypeId) {
        const map = {
            "minecraft:wheat": "minecraft:wheat",
            "minecraft:carrots": "minecraft:carrot",
            "minecraft:potatoes": "minecraft:potato",
            "minecraft:beetroot": "minecraft:beetroot",
            "minecraft:nether_wart": "minecraft:nether_wart",
            "minecraft:melon_block": "minecraft:melon_slice",
            "minecraft:pumpkin": "minecraft:pumpkin",
            "minecraft:sugar_cane": "minecraft:sugar_cane",
            "minecraft:cactus": "minecraft:cactus",
            "minecraft:cocoa": "minecraft:cocoa_beans",
            "minecraft:sweet_berry_bush": "minecraft:sweet_berries",
        };
        return map[blockTypeId];
    }
}
