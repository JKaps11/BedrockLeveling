import { ItemStack, system } from "@minecraft/server";
import { SkillType } from "../../types/index.js";
import { BaseSkill } from "../BaseSkill.js";
import { getBlockXpEntry, LOG_BLOCKS, LEAF_BLOCKS } from "../../data/BlockXpValues.js";
import { DOUBLE_DROP_CHANCE_PER_LEVEL, TREE_FELLER_MAX_BLOCKS, TREE_FELLER_BLOCKS_PER_TICK } from "../../data/SkillConstants.js";
export class WoodcuttingSkill extends BaseSkill {
    constructor() {
        super(...arguments);
        this.skillType = SkillType.Woodcutting;
        this.name = "Woodcutting";
    }
    onBlockBreak(player, block, brokenPermutation) {
        const entry = getBlockXpEntry(brokenPermutation.type.id);
        if (!entry)
            return;
        this.addXp(player, entry.xp);
        // Double drops
        if (this.chanceCheck(player, DOUBLE_DROP_CHANCE_PER_LEVEL)) {
            try {
                const item = new ItemStack(brokenPermutation.type.id, 1);
                block.dimension.spawnItem(item, block.location);
            }
            catch { }
        }
        // Tree Feller
        if (this.isAbilityActive(player)) {
            this.treeFeller(player, block, brokenPermutation.type.id);
        }
    }
    treeFeller(player, startBlock, logType) {
        const dimension = startBlock.dimension;
        const visited = new Set();
        const toProcess = [];
        // BFS to find all connected logs
        const queue = [startBlock.location];
        visited.add(this.posKey(startBlock.location));
        while (queue.length > 0 && visited.size < TREE_FELLER_MAX_BLOCKS) {
            const pos = queue.shift();
            toProcess.push(pos);
            // Check 26 neighbors (3x3x3 cube)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        if (dx === 0 && dy === 0 && dz === 0)
                            continue;
                        const np = { x: pos.x + dx, y: pos.y + dy, z: pos.z + dz };
                        const key = this.posKey(np);
                        if (visited.has(key))
                            continue;
                        visited.add(key);
                        try {
                            const neighborBlock = dimension.getBlock(np);
                            if (!neighborBlock)
                                continue;
                            if (LOG_BLOCKS.has(neighborBlock.typeId) || LEAF_BLOCKS.has(neighborBlock.typeId)) {
                                queue.push(np);
                            }
                        }
                        catch { }
                    }
                }
            }
        }
        // Process in batches per tick
        let index = 0;
        const processInterval = system.runInterval(() => {
            let count = 0;
            while (index < toProcess.length && count < TREE_FELLER_BLOCKS_PER_TICK) {
                const pos = toProcess[index];
                try {
                    const b = dimension.getBlock(pos);
                    if (b && (LOG_BLOCKS.has(b.typeId) || LEAF_BLOCKS.has(b.typeId))) {
                        const isLog = LOG_BLOCKS.has(b.typeId);
                        if (isLog) {
                            const xpEntry = getBlockXpEntry(b.typeId);
                            if (xpEntry)
                                this.addXp(player, xpEntry.xp);
                            // Spawn the log item
                            try {
                                const item = new ItemStack(b.typeId, 1);
                                dimension.spawnItem(item, pos);
                            }
                            catch { }
                        }
                        b.setType("minecraft:air");
                    }
                }
                catch { }
                index++;
                count++;
            }
            if (index >= toProcess.length) {
                system.clearRun(processInterval);
            }
        }, 1);
    }
    posKey(pos) {
        return `${pos.x},${pos.y},${pos.z}`;
    }
}
