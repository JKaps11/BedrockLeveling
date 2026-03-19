import { world, system, ItemStack } from "@minecraft/server";
const PENIS_MOBS = {
    "minecraft:cow": "leveling:cow_penis",
    "minecraft:pig": "leveling:pig_penis",
    "minecraft:sheep": "leveling:sheep_penis",
    "minecraft:chicken": "leveling:chicken_penis",
    "minecraft:zombie": "leveling:zombie_penis",
    "minecraft:skeleton": "leveling:skeleton_penis",
    "minecraft:creeper": "leveling:creeper_penis",
    "minecraft:spider": "leveling:spider_penis",
};
const MOB_DISPLAY = {
    "minecraft:cow": "Cow",
    "minecraft:pig": "Pig",
    "minecraft:sheep": "Sheep",
    "minecraft:chicken": "Chicken",
    "minecraft:zombie": "Zombie",
    "minecraft:skeleton": "Skeleton",
    "minecraft:creeper": "Creeper",
    "minecraft:spider": "Spider",
};
const DROP_CHANCE = 0.10;
const KNOCKBACK_STRENGTH = 10.0;
const KNOCKBACK_VERTICAL = 3.0;
const COOLDOWN_TICKS = 10;
const trackedSnowballs = new Set();
const announcedPlayers = new Set();
const cooldowns = new Map();
export class PenisCollector {
    init() {
        this.subscribeMobDeaths();
        this.subscribeSnowballHit();
        this.pollForCraftAnnouncement();
    }
    subscribeMobDeaths() {
        world.afterEvents.entityDie.subscribe((event) => {
            const dead = event.deadEntity;
            const killer = event.damageSource.damagingEntity;
            if (!killer || killer.typeId !== "minecraft:player")
                return;
            const itemId = PENIS_MOBS[dead.typeId];
            if (!itemId)
                return;
            if (Math.random() > DROP_CHANCE)
                return;
            try {
                const item = new ItemStack(itemId, 1);
                dead.dimension.spawnItem(item, dead.location);
                const mobName = MOB_DISPLAY[dead.typeId];
                killer.sendMessage(`\u00a7d\u00a77A \u00a7d${mobName} Penis \u00a77dropped!`);
            }
            catch {
                // Entity location may be invalid after death
            }
        });
    }
    subscribeSnowballHit() {
        world.afterEvents.projectileHitEntity.subscribe((event) => {
            if (event.projectile.typeId !== "minecraft:snowball")
                return;
            const snowballId = event.projectile.id;
            if (!trackedSnowballs.has(snowballId))
                return;
            trackedSnowballs.delete(snowballId);
            const hitInfo = event.getEntityHit();
            const hitEntity = hitInfo?.entity;
            if (!hitEntity)
                return;
            const owner = event.source;
            if (!owner)
                return;
            try {
                const dx = hitEntity.location.x - owner.location.x;
                const dz = hitEntity.location.z - owner.location.z;
                const dist = Math.sqrt(dx * dx + dz * dz) || 1;
                hitEntity.applyKnockback({ x: (dx / dist) * KNOCKBACK_STRENGTH, z: (dz / dist) * KNOCKBACK_STRENGTH }, KNOCKBACK_VERTICAL);
            }
            catch {
                // Entity may not support knockback
            }
        });
    }
    pollForCraftAnnouncement() {
        system.runInterval(() => {
            for (const player of world.getAllPlayers()) {
                if (announcedPlayers.has(player.id))
                    continue;
                const inventory = player.getComponent("minecraft:inventory");
                if (!inventory?.container)
                    continue;
                const container = inventory.container;
                for (let i = 0; i < container.size; i++) {
                    const item = container.getItem(i);
                    if (item && item.typeId === "leveling:penis_bow") {
                        announcedPlayers.add(player.id);
                        world.sendMessage(`\u00a7d\u00a7l${player.name} has unlocked the ultimate weapon. Prepare yourselves.`);
                        break;
                    }
                }
            }
        }, 20);
    }
    static onBowUse(player) {
        // Cooldown check
        const now = system.currentTick;
        const lastUse = cooldowns.get(player.id) ?? 0;
        if (now - lastUse < COOLDOWN_TICKS)
            return;
        const inventory = player.getComponent("minecraft:inventory");
        if (!inventory?.container)
            return;
        const container = inventory.container;
        // Find and consume a snowball
        let foundSlot = -1;
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item && item.typeId === "minecraft:snowball") {
                foundSlot = i;
                break;
            }
        }
        if (foundSlot === -1) {
            player.sendMessage("\u00a7c\u00a77You need snowballs to fire the Penis Bow!");
            return;
        }
        const snowball = container.getItem(foundSlot);
        if (snowball.amount > 1) {
            snowball.amount -= 1;
            container.setItem(foundSlot, snowball);
        }
        else {
            container.setItem(foundSlot, undefined);
        }
        cooldowns.set(player.id, now);
        // Spawn snowball projectile in front of player
        const viewDir = player.getViewDirection();
        const spawnLoc = {
            x: player.location.x + viewDir.x * 1.5,
            y: player.location.y + 1.5 + viewDir.y * 1.5,
            z: player.location.z + viewDir.z * 1.5,
        };
        const speed = 2.0;
        const projectile = player.dimension.spawnEntity("minecraft:snowball", spawnLoc);
        projectile.applyImpulse({
            x: viewDir.x * speed,
            y: viewDir.y * speed,
            z: viewDir.z * speed,
        });
        trackedSnowballs.add(projectile.id);
    }
}
