import { world, system, EntityDamageCause, EquipmentSlot } from "@minecraft/server";
import { SkillType } from "../types/index.js";
// Skills
import { MiningSkill } from "../skills/gathering/MiningSkill.js";
import { WoodcuttingSkill } from "../skills/gathering/WoodcuttingSkill.js";
import { ExcavationSkill } from "../skills/gathering/ExcavationSkill.js";
import { HerbalismSkill } from "../skills/gathering/HerbalismSkill.js";
import { FishingSkill } from "../skills/gathering/FishingSkill.js";
import { SwordsSkill } from "../skills/combat/SwordsSkill.js";
import { AxesSkill } from "../skills/combat/AxesSkill.js";
import { ArcherySkill } from "../skills/combat/ArcherySkill.js";
import { UnarmedSkill } from "../skills/combat/UnarmedSkill.js";
import { TamingSkill } from "../skills/combat/TamingSkill.js";
import { AcrobaticsSkill } from "../skills/other/AcrobaticsSkill.js";
import { RepairSkill } from "../skills/other/RepairSkill.js";
import { MINING_BLOCKS, WOODCUTTING_BLOCKS, EXCAVATION_BLOCKS, HERBALISM_BLOCKS } from "../data/BlockXpValues.js";
// Item type helpers
const SWORD_ITEMS = new Set([
    "minecraft:wooden_sword", "minecraft:stone_sword", "minecraft:iron_sword",
    "minecraft:golden_sword", "minecraft:diamond_sword", "minecraft:netherite_sword",
]);
const AXE_ITEMS = new Set([
    "minecraft:wooden_axe", "minecraft:stone_axe", "minecraft:iron_axe",
    "minecraft:golden_axe", "minecraft:diamond_axe", "minecraft:netherite_axe",
]);
const PICKAXE_ITEMS = new Set([
    "minecraft:wooden_pickaxe", "minecraft:stone_pickaxe", "minecraft:iron_pickaxe",
    "minecraft:golden_pickaxe", "minecraft:diamond_pickaxe", "minecraft:netherite_pickaxe",
]);
const SHOVEL_ITEMS = new Set([
    "minecraft:wooden_shovel", "minecraft:stone_shovel", "minecraft:iron_shovel",
    "minecraft:golden_shovel", "minecraft:diamond_shovel", "minecraft:netherite_shovel",
]);
const HOE_ITEMS = new Set([
    "minecraft:wooden_hoe", "minecraft:stone_hoe", "minecraft:iron_hoe",
    "minecraft:golden_hoe", "minecraft:diamond_hoe", "minecraft:netherite_hoe",
]);
export class SkillManager {
    constructor(playerData, abilityManager, antiExploit, feedback) {
        this.playerData = playerData;
        this.abilityManager = abilityManager;
        this.antiExploit = antiExploit;
        this.feedback = feedback;
        // Track sneaking state
        this.sneakingPlayers = new Set();
        const ctx = { playerData, abilityManager, antiExploit, feedback };
        this.mining = new MiningSkill(ctx);
        this.woodcutting = new WoodcuttingSkill(ctx);
        this.excavation = new ExcavationSkill(ctx);
        this.herbalism = new HerbalismSkill(ctx);
        this.fishing = new FishingSkill(ctx);
        this.swords = new SwordsSkill(ctx);
        this.axes = new AxesSkill(ctx);
        this.archery = new ArcherySkill(ctx);
        this.unarmed = new UnarmedSkill(ctx);
        this.taming = new TamingSkill(ctx);
        this.acrobatics = new AcrobaticsSkill(ctx);
        this.repair = new RepairSkill(ctx);
    }
    init() {
        this.subscribeBlockBreak();
        this.subscribeBlockPlace();
        this.subscribeCombat();
        this.subscribeSneaking();
        this.subscribeFishing();
        this.subscribeRepair();
    }
    subscribeBlockBreak() {
        world.afterEvents.playerBreakBlock.subscribe((event) => {
            const { player, brokenBlockPermutation, block } = event;
            if (this.antiExploit.isCreativeMode(player))
                return;
            const blockTypeId = brokenBlockPermutation.type.id;
            // Check anti-exploit
            if (this.antiExploit.isPlayerPlaced(block)) {
                this.antiExploit.removeEntry(block);
                return;
            }
            // Check sneaking for ability activation
            const isSneaking = player.isSneaking;
            if (MINING_BLOCKS.has(blockTypeId)) {
                if (isSneaking)
                    this.abilityManager.tryActivate(player, SkillType.Mining);
                this.mining.onBlockBreak(player, block, brokenBlockPermutation);
            }
            else if (WOODCUTTING_BLOCKS.has(blockTypeId)) {
                if (isSneaking)
                    this.abilityManager.tryActivate(player, SkillType.Woodcutting);
                this.woodcutting.onBlockBreak(player, block, brokenBlockPermutation);
            }
            else if (EXCAVATION_BLOCKS.has(blockTypeId)) {
                if (isSneaking)
                    this.abilityManager.tryActivate(player, SkillType.Excavation);
                this.excavation.onBlockBreak(player, block, brokenBlockPermutation);
            }
            else if (HERBALISM_BLOCKS.has(blockTypeId)) {
                if (isSneaking)
                    this.abilityManager.tryActivate(player, SkillType.Herbalism);
                this.herbalism.onBlockBreak(player, block, brokenBlockPermutation);
            }
        });
    }
    subscribeBlockPlace() {
        world.afterEvents.playerPlaceBlock.subscribe((event) => {
            this.antiExploit.trackPlacement(event.block);
        });
    }
    subscribeCombat() {
        world.afterEvents.entityHurt.subscribe((event) => {
            const { hurtEntity, damage, damageSource } = event;
            const cause = damageSource.cause;
            // Fall damage → acrobatics
            if (cause === EntityDamageCause.fall && hurtEntity.typeId === "minecraft:player") {
                this.acrobatics.onFallDamage(hurtEntity, damage);
                return;
            }
            // Entity attack
            const attacker = damageSource.damagingEntity;
            if (!attacker)
                return;
            // Projectile (archery)
            if (damageSource.damagingProjectile && attacker.typeId === "minecraft:player") {
                this.archery.onArrowHit(attacker, hurtEntity, damage);
                return;
            }
            // Wolf attack → taming
            if (attacker.typeId === "minecraft:wolf") {
                this.taming.onWolfAttack(attacker, hurtEntity, damage);
                return;
            }
            // Player melee
            if (attacker.typeId === "minecraft:player" && cause === EntityDamageCause.entityAttack) {
                const player = attacker;
                const equipment = player.getComponent("minecraft:equippable");
                const mainhand = equipment?.getEquipment(EquipmentSlot.Mainhand);
                const itemId = mainhand?.typeId ?? "";
                if (SWORD_ITEMS.has(itemId)) {
                    if (player.isSneaking)
                        this.abilityManager.tryActivate(player, SkillType.Swords);
                    this.swords.onHit(player, hurtEntity, damage);
                }
                else if (AXE_ITEMS.has(itemId)) {
                    if (player.isSneaking)
                        this.abilityManager.tryActivate(player, SkillType.Axes);
                    this.axes.onHit(player, hurtEntity, damage);
                }
                else if (!mainhand || itemId === "") {
                    if (player.isSneaking)
                        this.abilityManager.tryActivate(player, SkillType.Unarmed);
                    this.unarmed.onHit(player, hurtEntity, damage);
                }
            }
            // Player gets hit → counter attack / acrobatics checks
            if (hurtEntity.typeId === "minecraft:player" && cause === EntityDamageCause.entityAttack) {
                const victim = hurtEntity;
                const equipment = victim.getComponent("minecraft:equippable");
                const mainhand = equipment?.getEquipment(EquipmentSlot.Mainhand);
                const itemId = mainhand?.typeId ?? "";
                if (SWORD_ITEMS.has(itemId)) {
                    this.swords.onDefend(victim, attacker, damage);
                }
                // Unarmed arrow deflect
                if (damageSource.damagingProjectile && (!mainhand || itemId === "")) {
                    this.unarmed.onArrowDefend(victim, damage);
                }
            }
        });
    }
    subscribeSneaking() {
        // Poll sneaking state every 4 ticks
        system.runInterval(() => {
            for (const player of world.getAllPlayers()) {
                const wasSneaking = this.sneakingPlayers.has(player.id);
                const isSneaking = player.isSneaking;
                if (isSneaking && !wasSneaking) {
                    // Player just started sneaking - determine which ability to ready
                    this.onStartSneak(player);
                    this.sneakingPlayers.add(player.id);
                }
                else if (!isSneaking && wasSneaking) {
                    this.sneakingPlayers.delete(player.id);
                }
            }
        }, 4);
    }
    onStartSneak(player) {
        const equipment = player.getComponent("minecraft:equippable");
        const mainhand = equipment?.getEquipment(EquipmentSlot.Mainhand);
        const itemId = mainhand?.typeId ?? "";
        if (PICKAXE_ITEMS.has(itemId)) {
            this.abilityManager.notifySneakReady(player, SkillType.Mining);
        }
        else if (AXE_ITEMS.has(itemId)) {
            this.abilityManager.notifySneakReady(player, SkillType.Woodcutting);
        }
        else if (SHOVEL_ITEMS.has(itemId)) {
            this.abilityManager.notifySneakReady(player, SkillType.Excavation);
        }
        else if (HOE_ITEMS.has(itemId)) {
            this.abilityManager.notifySneakReady(player, SkillType.Herbalism);
        }
        else if (SWORD_ITEMS.has(itemId)) {
            this.abilityManager.notifySneakReady(player, SkillType.Swords);
        }
        else if (!mainhand || itemId === "") {
            this.abilityManager.notifySneakReady(player, SkillType.Unarmed);
        }
        // Note: Axes uses Skull Splitter but shares the axe tool with Woodcutting
        // Woodcutting takes priority since Tree Feller is triggered on log break
    }
    subscribeFishing() {
        // Fishing uses itemUse on fishing rod
        world.afterEvents.playerInteractWithBlock.subscribe((event) => {
            // Placeholder - fishing is detected differently
        });
    }
    subscribeRepair() {
        // Repair is detected via playerInteractWithBlock on anvil
        world.afterEvents.playerInteractWithBlock.subscribe((event) => {
            const { player, block } = event;
            if (block.typeId === "minecraft:anvil" || block.typeId === "minecraft:damaged_anvil" || block.typeId === "minecraft:chipped_anvil") {
                this.repair.onAnvilUse(player);
            }
        });
    }
}
