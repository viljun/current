import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
/**
 * Deterministic highland terrain with continuous ridges and rare fortresses.
 */
export class HighlandMap {
    static castleAt(coordinates) {
        var _a;
        const chunkX = Math.floor(coordinates.latitude / HighlandMap.CASTLE_CHUNK_SIZE);
        const chunkY = Math.floor(coordinates.longitude / HighlandMap.CASTLE_CHUNK_SIZE);
        const candidates = [];
        for (let y = chunkY - 1; y <= chunkY + 1; y++) {
            for (let x = chunkX - 1; x <= chunkX + 1; x++) {
                const castle = HighlandMap.castleForChunk(x, y);
                if (castle !== null
                    && HighlandMap.isInsideCastle(castle, coordinates)) {
                    candidates.push(castle);
                }
            }
        }
        candidates.sort((first, second) => HighlandMap.distanceSquared(first, coordinates)
            - HighlandMap.distanceSquared(second, coordinates)
            || first.seed - second.seed);
        return (_a = candidates[0]) !== null && _a !== void 0 ? _a : null;
    }
    static castleTitleAt(coordinates) {
        const castle = HighlandMap.castleAt(coordinates);
        if (castle === null) {
            return null;
        }
        const first = [
            "Briar", "Storm", "Moss", "Raven", "Thorn", "Ash",
            "Gloom", "Iron", "Cloud", "Root", "Wolf", "Rain",
        ];
        const second = [
            "glass", "watch", "crown", "spire", "ward", "keep",
            "hollow", "gate", "rest", "fall", "stone", "reach",
        ];
        return first[HighlandMap.hash(castle.seed, 0x31f90a7d) % first.length] + second[HighlandMap.hash(castle.seed, 0x8b7425e1) % second.length]
            + " Castle";
    }
    static hasWallAt(coordinates) {
        if (ItemType.isHighlandEntranceSeed(coordinates.getSeed())) {
            return false;
        }
        const castle = HighlandMap.castleAt(coordinates);
        if (castle !== null) {
            return HighlandMap.isCastleWall(castle, coordinates);
        }
        return HighlandMap.elevationAt(coordinates) > .55;
    }
    static terrainAt(coordinates) {
        const castle = HighlandMap.castleAt(coordinates);
        if (castle !== null) {
            return "highland castle floor";
        }
        if (HighlandMap.hasWallAt(coordinates)) {
            return "highland mountain ground";
        }
        const jungle = HighlandMap.noise2d(coordinates.latitude, coordinates.longitude, 19, 0x4c792e13) * .65 + HighlandMap.noise2d(coordinates.latitude, coordinates.longitude, 47, 0xa105d86f) * .35;
        return jungle > .04
            ? "highland jungle ground"
            : "highland rugged ground";
    }
    static decorationAt(coordinates) {
        const seed = HighlandMap.hash(coordinates.latitude, coordinates.longitude, 0x715c4a29);
        const castle = HighlandMap.castleAt(coordinates);
        if (castle !== null) {
            if (HighlandMap.isCastleWall(castle, coordinates)) {
                return HighlandMap.castleWallDecoration(castle, coordinates);
            }
            return seed % 47 === 0 ? "dungeon candle shrine" : null;
        }
        if (HighlandMap.hasWallAt(coordinates)) {
            return seed % 3 === 0 ? "highland mountain crag" : null;
        }
        if (HighlandMap.terrainAt(coordinates) === "highland jungle ground") {
            return seed % 4 === 0 ? "tree" : null;
        }
        return seed % 29 === 0 ? "rock formation" : null;
    }
    static itemAt(coordinates) {
        const seed = coordinates.getSeed();
        if (ItemType.isHighlandEntranceSeed(seed)) {
            return new ItemType("stairs up");
        }
        if (HighlandMap.hasWallAt(coordinates)) {
            return null;
        }
        const castle = HighlandMap.castleAt(coordinates);
        if (castle !== null) {
            const chamber = HighlandMap.magicianChamber(castle);
            if (coordinates.latitude === chamber.x
                && coordinates.longitude === chamber.y) {
                const spells = [
                    "magician selling force spell",
                    "magician selling mending spell",
                    "magician selling warding spell",
                ];
                return new ItemType(spells[HighlandMap.hash(castle.seed, 0x62bd31f7)
                    % spells.length]);
            }
            const castleSeed = HighlandMap.cellSeed(castle, coordinates);
            if (castleSeed % 173 === 0) {
                return new ItemType("treasure");
            }
            if (castleSeed % 61 === 0) {
                return new ItemType("coin");
            }
            return null;
        }
        const placement = HighlandMap.hash(coordinates.latitude, coordinates.longitude, 0x9e5f1743);
        if (placement % 257 === 0) {
            return new ItemType("troll");
        }
        if (placement % 131 === 0) {
            return new ItemType("chest");
        }
        if (placement % 71 === 0) {
            return new ItemType("yarrow");
        }
        if (placement % 43 === 0) {
            return new ItemType("root");
        }
        if (placement % 37 === 0) {
            return new ItemType("stone");
        }
        return null;
    }
    static allowsItemAt(coordinates, itemType) {
        if (itemType.name === "stairs up"
            || itemType.name.startsWith("magician selling ")) {
            return true;
        }
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (HighlandMap.hasWallAt(new Coordinates(coordinates.latitude + x, coordinates.longitude + y))) {
                    return false;
                }
            }
        }
        return true;
    }
    static castleForChunk(chunkX, chunkY) {
        const seed = HighlandMap.hash(chunkX, chunkY, 0x27d4eb2f);
        if (seed % 5 !== 0) {
            return null;
        }
        const half = HighlandMap.CASTLE_CHUNK_SIZE / 2;
        return {
            centerX: chunkX * HighlandMap.CASTLE_CHUNK_SIZE + half
                + HighlandMap.signedRange(HighlandMap.hash(seed, 0xc2138a75), 19),
            centerY: chunkY * HighlandMap.CASTLE_CHUNK_SIZE + half
                + HighlandMap.signedRange(HighlandMap.hash(seed, 0x5f906d31), 19),
            radiusX: 18 + HighlandMap.hash(seed, 0x48a2f917) % 8,
            radiusY: 21 + HighlandMap.hash(seed, 0xbd31e467) % 10,
            seed,
        };
    }
    static isInsideCastle(castle, coordinates) {
        const x = Math.abs(coordinates.latitude - castle.centerX);
        const y = Math.abs(coordinates.longitude - castle.centerY);
        if (x > castle.radiusX || y > castle.radiusY) {
            return false;
        }
        return !(x > castle.radiusX - 4 && y > castle.radiusY - 4);
    }
    static isCastleWall(castle, coordinates) {
        if (!HighlandMap.isInsideCastle(castle, coordinates)) {
            return false;
        }
        const localX = coordinates.latitude - castle.centerX;
        const localY = coordinates.longitude - castle.centerY;
        const gate = (Math.abs(localX) <= 1
            && Math.abs(localY) >= castle.radiusY - 1) || (Math.abs(localY) <= 1
            && Math.abs(localX) >= castle.radiusX - 1);
        if (gate) {
            return false;
        }
        const neighbours = [
            new Coordinates(coordinates.latitude - 1, coordinates.longitude),
            new Coordinates(coordinates.latitude + 1, coordinates.longitude),
            new Coordinates(coordinates.latitude, coordinates.longitude - 1),
            new Coordinates(coordinates.latitude, coordinates.longitude + 1),
        ];
        if (neighbours.some(neighbour => !HighlandMap.isInsideCastle(castle, neighbour))) {
            return true;
        }
        if (localX === 0 || localY === 0) {
            return false;
        }
        const chamber = HighlandMap.magicianChamber(castle);
        if (Math.abs(coordinates.latitude - chamber.x) <= 3
            && Math.abs(coordinates.longitude - chamber.y) <= 3) {
            return false;
        }
        if (coordinates.longitude === chamber.y
            && HighlandMap.between(coordinates.latitude, castle.centerX, chamber.x)) {
            return false;
        }
        if (coordinates.latitude === castle.centerX
            && HighlandMap.between(coordinates.longitude, castle.centerY, chamber.y)) {
            return false;
        }
        const gridX = localX + castle.radiusX;
        const gridY = localY + castle.radiusY;
        if (HighlandMap.positiveModulo(gridX, 5) === 0) {
            const opening = HighlandMap.hash(castle.seed, Math.floor(gridX / 5), Math.floor(gridY / 5), 0x3d12e8b7) % 5;
            if (HighlandMap.positiveModulo(gridY, 5) !== opening) {
                return true;
            }
        }
        if (HighlandMap.positiveModulo(gridY, 5) === 0) {
            const opening = HighlandMap.hash(castle.seed, Math.floor(gridX / 5), Math.floor(gridY / 5), 0xa83f61c9) % 5;
            if (HighlandMap.positiveModulo(gridX, 5) !== opening) {
                return true;
            }
        }
        return false;
    }
    static castleWallDecoration(castle, coordinates) {
        const horizontal = [
            new Coordinates(coordinates.latitude - 1, coordinates.longitude),
            new Coordinates(coordinates.latitude + 1, coordinates.longitude),
        ].filter(neighbour => HighlandMap.isCastleWall(castle, neighbour)).length;
        const vertical = [
            new Coordinates(coordinates.latitude, coordinates.longitude - 1),
            new Coordinates(coordinates.latitude, coordinates.longitude + 1),
        ].filter(neighbour => HighlandMap.isCastleWall(castle, neighbour)).length;
        return horizontal >= vertical
            ? "highland castle wall horizontal"
            : "highland castle wall vertical";
    }
    static magicianChamber(castle) {
        const xDirection = HighlandMap.hash(castle.seed, 0x6b42d819) % 2
            === 0 ? -1 : 1;
        const yDirection = HighlandMap.hash(castle.seed, 0xe1734a2d) % 2
            === 0 ? -1 : 1;
        return {
            x: castle.centerX + xDirection * (castle.radiusX - 7),
            y: castle.centerY + yDirection * (castle.radiusY - 7),
        };
    }
    static elevationAt(coordinates) {
        return HighlandMap.noise2d(coordinates.latitude, coordinates.longitude, 17, 0x37a1f4d9) * .62 + HighlandMap.noise2d(coordinates.latitude, coordinates.longitude, 53, 0x84cb2761) * .38;
    }
    static noise2d(x, y, step, salt) {
        const gridX = Math.floor(x / step);
        const gridY = Math.floor(y / step);
        const fractionX = HighlandMap.smooth((x - gridX * step) / step);
        const fractionY = HighlandMap.smooth((y - gridY * step) / step);
        const top = HighlandMap.interpolate(HighlandMap.noiseCorner(gridX, gridY, salt), HighlandMap.noiseCorner(gridX + 1, gridY, salt), fractionX);
        const bottom = HighlandMap.interpolate(HighlandMap.noiseCorner(gridX, gridY + 1, salt), HighlandMap.noiseCorner(gridX + 1, gridY + 1, salt), fractionX);
        return HighlandMap.interpolate(top, bottom, fractionY);
    }
    static noiseCorner(x, y, salt) {
        return HighlandMap.hash(x, y, salt) / 0xffffffff * 2 - 1;
    }
    static interpolate(from, to, value) {
        return from + (to - from) * value;
    }
    static smooth(value) {
        return value * value * (3 - 2 * value);
    }
    static cellSeed(castle, coordinates) {
        return HighlandMap.hash(castle.seed, coordinates.latitude, coordinates.longitude, 0x91e64b2d);
    }
    static distanceSquared(castle, coordinates) {
        return Math.pow(coordinates.latitude - castle.centerX, 2)
            + Math.pow(coordinates.longitude - castle.centerY, 2);
    }
    static between(value, first, second) {
        return value >= Math.min(first, second)
            && value <= Math.max(first, second);
    }
    static positiveModulo(value, divisor) {
        return ((value % divisor) + divisor) % divisor;
    }
    static signedRange(seed, span) {
        return seed % (span * 2 + 1) - span;
    }
    static hash(...values) {
        let hash = 0x811c9dc5;
        for (const input of values) {
            hash ^= input >>> 0;
            hash = Math.imul(hash, 0x01000193) >>> 0;
            hash ^= hash >>> 16;
        }
        hash = Math.imul(hash ^ (hash >>> 15), 0x85ebca6b) >>> 0;
        hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35) >>> 0;
        return (hash ^ (hash >>> 16)) >>> 0;
    }
}
HighlandMap.CASTLE_CHUNK_SIZE = 112;
