import { world, system, Entity, Player, Vector3 } from "@minecraft/server";

const DOOR_IDS = [
  "minecraft:wooden_door", "minecraft:spruce_door", "minecraft:birch_door",
  "minecraft:jungle_door", "minecraft:acacia_door", "minecraft:dark_oak_door",
  "minecraft:crimson_door", "minecraft:warped_door", "minecraft:mangrove_door",
  "minecraft:cherry_door", "minecraft:bamboo_door",
];

interface StandingCatState {
  standingEntityId: string;
  catId: string;
  dimensionId: string;
  revertTick: number;
}

export class CreepyCats {
  private cooldowns: Map<string, number> = new Map();
  private standingCats: StandingCatState[] = [];

  init(): void {
    system.runInterval(() => {
      this.tick();
    }, 200);

    // Faster tick for revert checks (every 1s)
    system.runInterval(() => {
      this.tickStandingCats();
    }, 20);
  }

  private tick(): void {
    const now = Date.now();
    for (const player of world.getAllPlayers()) {
      const cats = player.dimension.getEntities({
        type: "minecraft:cat",
        location: player.location,
        maxDistance: 16,
      });

      for (const cat of cats) {
        const tameable = cat.getComponent("minecraft:tameable");
        if (!tameable || !(tameable as any).tamedToPlayer) continue;
        if (cat.getTags().includes("standing_cat_hidden")) continue;

        const lastTrigger = this.cooldowns.get(cat.id) ?? 0;
        if (now - lastTrigger < 60000) continue;
        if (Math.random() > 0.08) continue;

        this.cooldowns.set(cat.id, now);
        this.triggerBehavior(cat, player);
      }
    }

    // Cleanup old cooldown entries
    for (const [id, time] of this.cooldowns) {
      if (now - time > 120000) this.cooldowns.delete(id);
    }
  }

  private triggerBehavior(cat: Entity, player: Player): void {
    const timeOfDay = world.getTimeOfDay();
    const isNight = timeOfDay >= 13000 && timeOfDay <= 23000;

    // Night sounds — rare extra chance
    if (isNight && Math.random() < 0.02) {
      cat.dimension.playSound("mob.cat.straymeow", cat.location);
    }

    const roll = Math.random();

    if (roll < 0.35) {
      // Stand up — spawn standing cat entity
      this.spawnStandingCat(cat);
    } else if (roll < 0.6) {
      // Stand up then open a nearby door
      const standingId = this.spawnStandingCat(cat);
      if (standingId) {
        const delay = 40 + Math.floor(Math.random() * 40); // 2-4s
        system.runTimeout(() => {
          this.openNearbyDoorByEntity(standingId, cat.dimension.id);
        }, delay);
      }
    } else if (roll < 0.85) {
      // Stare at player
      this.stareAt(cat, player);
    } else {
      // Stand up + stare combo
      this.spawnStandingCat(cat);
      this.stareAt(cat, player);
    }
  }

  private spawnStandingCat(cat: Entity): string | undefined {
    try {
      const catLocation = { ...cat.location };
      const dimension = cat.dimension;
      const dimensionId = dimension.id;

      // Tag and hide the cat above build limit
      cat.addTag("standing_cat_hidden");
      cat.teleport({ x: catLocation.x, y: 320, z: catLocation.z });

      // Spawn the standing cat entity at the cat's old location
      const standing = dimension.spawnEntity("bedrocklvl:standing_cat", catLocation);

      // Random revert time: 15-30s (300-600 ticks)
      const revertTick = system.currentTick + 300 + Math.floor(Math.random() * 301);

      this.standingCats.push({
        standingEntityId: standing.id,
        catId: cat.id,
        dimensionId,
        revertTick,
      });

      return standing.id;
    } catch {
      // If spawn fails, unhide the cat
      try {
        cat.removeTag("standing_cat_hidden");
        cat.teleport(cat.location);
      } catch { /* cat may be invalid */ }
      return undefined;
    }
  }

  private tickStandingCats(): void {
    const currentTick = system.currentTick;
    const toRemove: number[] = [];

    for (let i = 0; i < this.standingCats.length; i++) {
      const state = this.standingCats[i];
      if (currentTick < state.revertTick) continue;

      toRemove.push(i);

      try {
        const dimension = world.getDimension(state.dimensionId);

        // Find the standing entity
        let standingLocation: Vector3 | undefined;
        const entities = dimension.getEntities({ type: "bedrocklvl:standing_cat" });
        for (const e of entities) {
          if (e.id === state.standingEntityId) {
            standingLocation = { ...e.location };
            e.remove();
            break;
          }
        }

        // Find the hidden cat and teleport it back
        const cats = dimension.getEntities({
          type: "minecraft:cat",
          tags: ["standing_cat_hidden"],
        });
        for (const cat of cats) {
          if (cat.id === state.catId) {
            cat.removeTag("standing_cat_hidden");
            if (standingLocation) {
              cat.teleport(standingLocation);
            }
            break;
          }
        }
      } catch { /* dimension or entities may be unloaded */ }
    }

    // Remove processed entries in reverse order
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.standingCats.splice(toRemove[i], 1);
    }
  }

  private stareAt(cat: Entity, player: Player): void {
    const dx = player.location.x - cat.location.x;
    const dz = player.location.z - cat.location.z;
    const yaw = (Math.atan2(-dx, dz) * 180) / Math.PI;
    cat.setRotation({ x: 0, y: yaw });
  }

  private openNearbyDoorByEntity(standingEntityId: string, dimensionId: string): void {
    try {
      const dimension = world.getDimension(dimensionId);
      const entities = dimension.getEntities({ type: "bedrocklvl:standing_cat" });
      for (const e of entities) {
        if (e.id === standingEntityId) {
          this.openNearbyDoor(e);
          return;
        }
      }
    } catch { /* entity may be gone */ }
  }

  private openNearbyDoor(entity: Entity): void {
    const loc = entity.location;
    const dim = entity.dimension;

    for (let x = -5; x <= 5; x++) {
      for (let y = -2; y <= 2; y++) {
        for (let z = -5; z <= 5; z++) {
          const blockLoc: Vector3 = {
            x: Math.floor(loc.x) + x,
            y: Math.floor(loc.y) + y,
            z: Math.floor(loc.z) + z,
          };
          const block = dim.getBlock(blockLoc);
          if (!block) continue;
          if (!DOOR_IDS.includes(block.typeId)) continue;

          try {
            const perm = block.permutation;
            const isOpen = perm.getState("open_bit");
            if (isOpen === false) {
              block.setPermutation(perm.withState("open_bit", true));
              return; // Open one door only
            }
          } catch {
            // State name might differ — skip silently
          }
        }
      }
    }
  }
}
