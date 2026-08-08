import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";

export interface SurfaceRiverCell {
    channel: "river"|"tributary";
    depth: number;
    systemId: number;
}

export interface SurfaceRiverVisual {
    diameterInTiles: number;
    rotationDegrees: number;
    textureOffsetXInTiles: number;
    textureOffsetYInTiles: number;
}

export type SurfaceRoadSurface =
    | "sand"
    | "gravel"
    | "cobble"
    | "stone"
    | "dust"
    | "mud";

export interface SurfaceRoadCell {
    kind: "road"|"path";
    surface: SurfaceRoadSurface;
    routeId: number;
    depth: number;
    headingDegrees: number;
}

export interface SurfaceRoadVisual {
    diameterInTiles: number;
    rotationDegrees: number;
    offsetXInTiles: number;
    offsetYInTiles: number;
    textureSizeInTiles: number;
    textureOffsetXInTiles: number;
    textureOffsetYInTiles: number;
    grassOpacity: number;
    grassRotationDegrees: number;
    grassSizeInTiles: number;
}

export interface SurfacePathPatchVisual {
    diameterInTiles: number;
    offsetXInTiles: number;
    offsetYInTiles: number;
    opacity: number;
}

export interface SurfaceRoadCrossing {
    kind: "ford"|"bridge";
    bridgeAnchor: boolean;
    rotationDegrees: number;
}

/**
 * An infinite, coordinate-derived river network for the surface map.
 *
 * Each river system has a broad north/south channel and deterministic side
 * tributaries. Smooth value noise bends the main channels without breaking
 * them at viewport boundaries.
 */
export class SurfaceMap {
    private static readonly RIVER_SPACING = 120;
    private static readonly MEANDER_STEP = 24;
    private static readonly TRIBUTARY_STEP = 72;
    private static readonly HORIZONTAL_ROAD_SPACING = 94;
    private static readonly VERTICAL_ROAD_SPACING = 157;
    private static readonly ROAD_BEND_STEP = 30;
    private static readonly PATH_JUNCTION_STEP = 46;
    private static readonly WANDERING_PATH_BLOCK = 58;

    static riverAt(coordinates: Coordinates): SurfaceRiverCell|null {
        const x = coordinates.latitude;
        const y = coordinates.longitude;
        const nearbySystem = Math.floor(x / SurfaceMap.RIVER_SPACING);
        let closest: SurfaceRiverCell|null = null;

        for (
            let systemId = nearbySystem - 1;
            systemId <= nearbySystem + 1;
            systemId++
        ) {
            const center = SurfaceMap.riverCenter(systemId, y);
            const width = SurfaceMap.riverWidth(systemId);
            const distance = Math.abs(x - center);
            if (distance <= width) {
                const cell = {
                    channel: "river" as const,
                    depth: SurfaceMap.roundDepth(1 - distance / width),
                    systemId,
                };
                if (closest === null || cell.depth > closest.depth) {
                    closest = cell;
                }
            }
        }
        if (closest !== null) {
            return closest;
        }

        for (
            let systemId = nearbySystem - 1;
            systemId <= nearbySystem + 1;
            systemId++
        ) {
            const nearbyJunction = Math.floor(
                y / SurfaceMap.TRIBUTARY_STEP,
            );
            for (
                let junctionId = nearbyJunction - 1;
                junctionId <= nearbyJunction + 1;
                junctionId++
            ) {
                const tributary = SurfaceMap.tributaryAt(
                    coordinates,
                    systemId,
                    junctionId,
                );
                if (tributary !== null
                    && (closest === null || tributary.depth > closest.depth)
                ) {
                    closest = tributary;
                }
            }
        }

        return closest;
    }

    static isRiverAt(coordinates: Coordinates): boolean {
        return SurfaceMap.riverAt(coordinates) !== null;
    }

    static roadAt(coordinates: Coordinates): SurfaceRoadCell|null {
        const x = coordinates.latitude;
        const y = coordinates.longitude;
        let closest: SurfaceRoadCell|null = null;
        const horizontalSystem = Math.floor(
            y / SurfaceMap.HORIZONTAL_ROAD_SPACING,
        );
        for (
            let systemId = horizontalSystem - 1;
            systemId <= horizontalSystem + 1;
            systemId++
        ) {
            const center = SurfaceMap.horizontalRoadCenter(systemId, x);
            const width = .72 + SurfaceMap.hash(
                systemId,
                0x4f3a8d17,
            ) % 45 / 100;
            const distance = Math.abs(y - center);
            if (distance > width) {
                continue;
            }
            const derivative = (
                SurfaceMap.horizontalRoadCenter(systemId, x + 1)
                - SurfaceMap.horizontalRoadCenter(systemId, x - 1)
            ) / 2;
            closest = SurfaceMap.preferRoute(closest, {
                kind: "road",
                surface: SurfaceMap.roadSurface(
                    systemId * 2,
                    Math.floor(x / 28),
                ),
                routeId: systemId * 2,
                depth: SurfaceMap.roundDepth(1 - distance / width),
                headingDegrees: Math.atan2(derivative, 1) * 180 / Math.PI,
            });
        }

        const verticalSystem = Math.floor(
            x / SurfaceMap.VERTICAL_ROAD_SPACING,
        );
        for (
            let systemId = verticalSystem - 1;
            systemId <= verticalSystem + 1;
            systemId++
        ) {
            const center = SurfaceMap.verticalRoadCenter(systemId, y);
            const width = .66 + SurfaceMap.hash(
                systemId,
                0x821f95c3,
            ) % 39 / 100;
            const distance = Math.abs(x - center);
            if (distance > width) {
                continue;
            }
            const derivative = (
                SurfaceMap.verticalRoadCenter(systemId, y + 1)
                - SurfaceMap.verticalRoadCenter(systemId, y - 1)
            ) / 2;
            closest = SurfaceMap.preferRoute(closest, {
                kind: "road",
                surface: SurfaceMap.roadSurface(
                    systemId * 2 + 1,
                    Math.floor(y / 28),
                ),
                routeId: systemId * 2 + 1,
                depth: SurfaceMap.roundDepth(1 - distance / width),
                headingDegrees: Math.atan2(1, derivative) * 180 / Math.PI,
            });
        }
        if (closest !== null) {
            return closest;
        }

        const nearbyRoad = Math.floor(
            y / SurfaceMap.HORIZONTAL_ROAD_SPACING,
        );
        const nearbyJunction = Math.floor(
            x / SurfaceMap.PATH_JUNCTION_STEP,
        );
        for (
            let systemId = nearbyRoad - 1;
            systemId <= nearbyRoad + 1;
            systemId++
        ) {
            for (
                let junctionId = nearbyJunction - 1;
                junctionId <= nearbyJunction + 1;
                junctionId++
            ) {
                closest = SurfaceMap.preferRoute(
                    closest,
                    SurfaceMap.roadsidePathAt(
                        coordinates,
                        systemId,
                        junctionId,
                    ),
                );
            }
        }
        if (closest !== null) {
            return closest;
        }

        const blockX = Math.floor(x / SurfaceMap.WANDERING_PATH_BLOCK);
        const blockY = Math.floor(y / SurfaceMap.WANDERING_PATH_BLOCK);
        for (let nearbyX = blockX - 1; nearbyX <= blockX + 1; nearbyX++) {
            for (let nearbyY = blockY - 1; nearbyY <= blockY + 1; nearbyY++) {
                closest = SurfaceMap.preferRoute(
                    closest,
                    SurfaceMap.wanderingPathAt(
                        coordinates,
                        nearbyX,
                        nearbyY,
                    ),
                );
            }
        }

        return closest;
    }

    static roadVisualAt(
        coordinates: Coordinates,
        road: SurfaceRoadCell,
    ): SurfaceRoadVisual {
        const values = (
            salt: number,
        ) => SurfaceMap.hash(
            coordinates.latitude,
            coordinates.longitude,
            road.routeId,
            salt,
        );
        const routeWidthSeed = SurfaceMap.hash(
            road.routeId,
            road.kind === "road" ? 0x4b72e193 : 0x78c4a2df,
        );
        const roadPatchScale = 1.12 + values(0x6d26e251) % 49 / 100;
        const roadOnlyVariation = road.kind === "road";
        const rotationJitter = roadOnlyVariation
            ? (values(0x57a92c31) % 1601 - 800) / 100
            : 0;
        const offsetX = roadOnlyVariation
            ? (values(0x91d34e27) % 25 - 12) / 100
            : 0;
        const offsetY = roadOnlyVariation
            ? (values(0x2bc681f5) % 25 - 12) / 100
            : 0;
        const textureSize = 6.6 + values(0xe31a794d) % 421 / 100;
        const textureJitterX = roadOnlyVariation
            ? (values(0x4f82b6c9) % 601 - 300) / 100
            : 0;
        const textureJitterY = roadOnlyVariation
            ? (values(0xb7591d43) % 601 - 300) / 100
            : 0;
        const grassPlacementSeed = values(0x123da847);
        const grassPresent = grassPlacementSeed % (
            road.kind === "road" ? 7 : 13
        ) === 0;

        return {
            diameterInTiles: road.kind === "road"
                ? (1.72 + routeWidthSeed % 13 / 100) * roadPatchScale
                : 1.02 + routeWidthSeed % 9 / 100,
            rotationDegrees: road.headingDegrees - 90 + rotationJitter,
            offsetXInTiles: offsetX,
            offsetYInTiles: offsetY,
            textureSizeInTiles: textureSize,
            textureOffsetXInTiles: roadOnlyVariation
                ? -coordinates.longitude + textureJitterX
                : -coordinates.longitude,
            textureOffsetYInTiles: roadOnlyVariation
                ? coordinates.latitude + textureJitterY
                : coordinates.latitude,
            grassOpacity: grassPresent
                ? .12 + values(0x75d932ab) % 15 / 100
                : 0,
            grassRotationDegrees: values(0x24e180b7) % 360,
            grassSizeInTiles: .38 + values(0xe73c0a49) % 43 / 100,
        };
    }

    static pathPatchVisualsAt(
        coordinates: Coordinates,
        road: SurfaceRoadCell,
    ): readonly SurfacePathPatchVisual[] {
        if (road.kind !== "path") {
            return [];
        }
        const heading = (road.headingDegrees - 90) * Math.PI / 180;
        const alongX = Math.cos(heading);
        const alongY = Math.sin(heading);
        const acrossX = -alongY;
        const acrossY = alongX;
        const stableValue = (index: number, salt: number): number =>
            SurfaceMap.hash(
                coordinates.latitude,
                coordinates.longitude,
                road.routeId,
                index,
                salt,
            );

        const alongSlots = [-.48, -.32, -.16, 0, .16, .32, .48];

        return alongSlots.map((slot, index) => {
            const alongJitter = (
                stableValue(index, 0x18c2f457) % 19 - 9
            ) / 100;
            const acrossJitter = (
                stableValue(index, 0xa4d91e63) % 65 - 32
            ) / 100;
            const along = slot + alongJitter;
            const baseDiameter = slot === 0
                ? .92 + stableValue(index, 0x73ab5f21) % 31 / 100
                : .72 + stableValue(index, 0xc56e842d) % 25 / 100;
            const sizeMultiplier = 1
                + stableValue(index, 0x4d7c91a3) % 51 / 100;

            return {
                diameterInTiles: baseDiameter * sizeMultiplier,
                offsetXInTiles: alongX * along + acrossX * acrossJitter,
                offsetYInTiles: alongY * along + acrossY * acrossJitter,
                opacity: slot === 0
                    ? .34 + stableValue(index, 0x3fd812b7) % 16 / 100
                    : .26 + stableValue(index, 0x91ea64c3) % 16 / 100,
            };
        });
    }

    static crossingAt(
        coordinates: Coordinates,
        road: SurfaceRoadCell|null = SurfaceMap.roadAt(coordinates),
        river: SurfaceRiverCell|null = SurfaceMap.riverAt(coordinates),
    ): SurfaceRoadCrossing|null {
        if (road === null || river === null) {
            return null;
        }
        const riverHeading = river.channel === "river" ? 90 : 0;
        const crossingAngle = SurfaceMap.undirectedAngleDifference(
            road.headingDegrees,
            riverHeading,
        );
        const bridge = road.kind === "road"
            && crossingAngle >= 35
            && SurfaceMap.hash(
                road.routeId,
                river.systemId,
                0x4ca39d7f,
            ) % 4 === 0;

        return {
            kind: bridge ? "bridge" : "ford",
            bridgeAnchor: bridge && SurfaceMap.isBridgeAnchor(
                coordinates,
                road,
                river,
            ),
            rotationDegrees: road.headingDegrees - 180,
        };
    }

    static milestoneAt(coordinates: Coordinates): boolean {
        const routeId = SurfaceMap.milestoneRouteAt(coordinates);
        if (routeId === null) {
            return false;
        }
        const score = SurfaceMap.hash(
            coordinates.latitude,
            coordinates.longitude,
            routeId,
            0x7bd18e23,
        );
        if (score % 53 !== 0) {
            return false;
        }
        const radius = 3;
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                if (x === 0 && y === 0) {
                    continue;
                }
                const nearby = new Coordinates(
                    coordinates.latitude + x,
                    coordinates.longitude + y,
                );
                const nearbyRouteId = SurfaceMap.milestoneRouteAt(nearby);
                if (nearbyRouteId === null) {
                    continue;
                }
                const nearbyScore = SurfaceMap.hash(
                    nearby.latitude,
                    nearby.longitude,
                    nearbyRouteId,
                    0x7bd18e23,
                );
                if (
                    nearbyScore % 53 === 0
                    && (
                        nearbyScore < score
                        || (
                            nearbyScore === score
                            && (
                                nearby.latitude < coordinates.latitude
                                || (
                                    nearby.latitude === coordinates.latitude
                                    && nearby.longitude
                                        < coordinates.longitude
                                )
                            )
                        )
                    )
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    private static milestoneRouteAt(coordinates: Coordinates): number|null {
        if (
            SurfaceMap.riverAt(coordinates) !== null
            || SurfaceMap.roadAt(coordinates) !== null
            || SurfaceMap.itemAt(coordinates) !== null
        ) {
            return null;
        }
        const neighbouringRoads = SurfaceMap.cardinalNeighbours(coordinates)
            .map(neighbour => SurfaceMap.roadAt(neighbour))
            .filter(
                (road): road is SurfaceRoadCell =>
                    road !== null && road.kind === "road",
            )
            .sort((first, second) => first.routeId - second.routeId);
        const road = neighbouringRoads[0];
        if (road === undefined) {
            return null;
        }

        return road.routeId;
    }

    static itemAt(coordinates: Coordinates): ItemType|null {
        const river = SurfaceMap.riverAt(coordinates);
        if (river !== null) {
            if (SurfaceMap.roadAt(coordinates) !== null) {
                return null;
            }
            const placementSeed = SurfaceMap.hash(
                coordinates.latitude,
                coordinates.longitude,
                river.systemId,
                0x6c8e9cf5,
            );
            if (placementSeed % 17 !== 0) {
                return null;
            }
            const populationSeed = SurfaceMap.hash(
                coordinates.latitude,
                coordinates.longitude,
                river.systemId,
                0x53f27a19,
            );
            if (populationSeed % 10 >= 3) {
                return null;
            }
            const speciesSeed = SurfaceMap.hash(
                coordinates.latitude,
                coordinates.longitude,
                river.systemId,
                0x8f1bbcdc,
            );
            const fish = ItemType.RIVER_FISH_NAMES[
                speciesSeed % ItemType.RIVER_FISH_NAMES.length
            ];

            return fish === undefined ? null : new ItemType(fish);
        }

        const ordinaryItem = ItemType.getWithSeed(coordinates.getSeed(), 0);
        if (ordinaryItem !== null) {
            return ordinaryItem;
        }

        return SurfaceMap.isCampfireAt(coordinates)
            ? new ItemType("campfire")
            : null;
    }

    static isCampfireAt(coordinates: Coordinates): boolean {
        if (SurfaceMap.isRiverAt(coordinates)) {
            return false;
        }
        if (SurfaceMap.roadAt(coordinates) !== null) {
            return false;
        }
        if (ItemType.getWithSeed(coordinates.getSeed(), 0) !== null) {
            return false;
        }
        const placementSeed = SurfaceMap.hash(
            coordinates.latitude,
            coordinates.longitude,
            0x3e2f6a91,
        );
        if (placementSeed % 113 !== 0) {
            return false;
        }

        return SurfaceMap.neighbours(coordinates).some(neighbour =>
            SurfaceMap.isRiverAt(neighbour)
        );
    }

    static riverVisualAt(
        coordinates: Coordinates,
        river: SurfaceRiverCell,
    ): SurfaceRiverVisual {
        const rotationSeed = SurfaceMap.hash(
            coordinates.latitude,
            coordinates.longitude,
            river.systemId,
            0x491df3b7,
        );
        const sizeSeed = SurfaceMap.hash(
            coordinates.latitude,
            coordinates.longitude,
            river.systemId,
            0x7f4a7c15,
        );
        const textureXSeed = SurfaceMap.hash(
            coordinates.latitude,
            coordinates.longitude,
            river.systemId,
            0x2c1b3c6d,
        );
        const textureYSeed = SurfaceMap.hash(
            coordinates.latitude,
            coordinates.longitude,
            river.systemId,
            0x9e3779b9,
        );
        const minimumDiameter = river.channel === "river" ? 2.7 : 2.25;
        const diameterVariation = river.channel === "river" ? .35 : .3;

        return {
            diameterInTiles: minimumDiameter
                + sizeSeed % 101 / 100 * diameterVariation,
            rotationDegrees: rotationSeed % 36_000 / 100,
            textureOffsetXInTiles: -(textureXSeed % 800) / 100,
            textureOffsetYInTiles: -(textureYSeed % 800) / 100,
        };
    }

    private static roadsidePathAt(
        coordinates: Coordinates,
        systemId: number,
        junctionId: number,
    ): SurfaceRoadCell|null {
        const enabledSeed = SurfaceMap.hash(
            systemId,
            junctionId,
            0xc93f21a5,
        );
        if (enabledSeed % 3 === 0) {
            return null;
        }
        const startX = junctionId * SurfaceMap.PATH_JUNCTION_STEP
            + SurfaceMap.signedRange(
                SurfaceMap.hash(systemId, junctionId, 0x1459b8d3),
                10,
            );
        const startY = SurfaceMap.horizontalRoadCenter(systemId, startX);
        const direction = SurfaceMap.hash(
            systemId,
            junctionId,
            0xe41a6709,
        ) % 2 === 0 ? -1 : 1;
        const length = 12 + SurfaceMap.hash(
            systemId,
            junctionId,
            0x59dc8f27,
        ) % 25;
        const progress = (
            (coordinates.longitude - startY) * direction
        ) / length;
        if (progress < 0 || progress > 1) {
            return null;
        }
        const bend = SurfaceMap.signedRange(
            SurfaceMap.hash(systemId, junctionId, 0x837ce215),
            7,
        );
        const wiggle = SurfaceMap.signedRange(
            SurfaceMap.hash(systemId, junctionId, 0x31a4d96b),
            4,
        );
        const drift = SurfaceMap.signedRange(
            SurfaceMap.hash(systemId, junctionId, 0xb75e2c41),
            5,
        );
        const centerX = startX
            + progress * drift
            + Math.sin(Math.PI * progress) * bend
            + Math.sin(Math.PI * 2 * progress) * wiggle;
        const width = .62 + SurfaceMap.hash(
            systemId,
            junctionId,
            0x6e29f53d,
        ) % 21 / 100;
        const distance = Math.abs(coordinates.latitude - centerX);
        if (distance > width) {
            return null;
        }
        const routeId = SurfaceMap.hash(
            systemId,
            junctionId,
            0xfd817a63,
        );
        const tangentX = drift / length
            + Math.cos(Math.PI * progress) * Math.PI * bend / length
            + Math.cos(Math.PI * 2 * progress)
                * Math.PI * 2 * wiggle / length;

        return {
            kind: "path",
            surface: SurfaceMap.pathSurface(routeId),
            routeId,
            depth: SurfaceMap.roundDepth(1 - distance / width),
            headingDegrees: Math.atan2(direction, tangentX) * 180 / Math.PI,
        };
    }

    private static wanderingPathAt(
        coordinates: Coordinates,
        blockX: number,
        blockY: number,
    ): SurfaceRoadCell|null {
        const routeId = SurfaceMap.hash(blockX, blockY, 0x26cb91e7);
        if (routeId % 5 !== 0) {
            return null;
        }
        const blockSize = SurfaceMap.WANDERING_PATH_BLOCK;
        const startX = blockX * blockSize
            + SurfaceMap.signedRange(
                SurfaceMap.hash(blockX, blockY, 0x943b1df5),
                18,
            );
        const startY = blockY * blockSize
            + SurfaceMap.signedRange(
                SurfaceMap.hash(blockX, blockY, 0x4f7c28a1),
                18,
            );
        const angle = SurfaceMap.hash(
            blockX,
            blockY,
            0xa17d63c9,
        ) % 16 * Math.PI / 8;
        const directionX = Math.cos(angle);
        const directionY = Math.sin(angle);
        const relativeX = coordinates.latitude - startX;
        const relativeY = coordinates.longitude - startY;
        const length = 10 + SurfaceMap.hash(
            blockX,
            blockY,
            0x6b238fd1,
        ) % 19;
        const along = relativeX * directionX + relativeY * directionY;
        if (along < 0 || along > length) {
            return null;
        }
        const progress = along / length;
        const bend = SurfaceMap.signedRange(
            SurfaceMap.hash(blockX, blockY, 0xd4397e25),
            5,
        );
        const wiggle = SurfaceMap.signedRange(
            SurfaceMap.hash(blockX, blockY, 0x18e5b6f3),
            3,
        );
        const curve = Math.sin(Math.PI * progress) * bend
            + Math.sin(Math.PI * 2 * progress) * wiggle;
        const perpendicular = relativeX * -directionY
            + relativeY * directionX;
        const distance = Math.abs(perpendicular - curve);
        const width = .62 + SurfaceMap.hash(
            blockX,
            blockY,
            0x79bc42a7,
        ) % 19 / 100;
        if (distance > width) {
            return null;
        }

        return {
            kind: "path",
            surface: SurfaceMap.pathSurface(routeId),
            routeId,
            depth: SurfaceMap.roundDepth(1 - distance / width),
            headingDegrees: angle * 180 / Math.PI,
        };
    }

    private static preferRoute(
        current: SurfaceRoadCell|null,
        candidate: SurfaceRoadCell|null,
    ): SurfaceRoadCell|null {
        if (candidate === null) {
            return current;
        }
        if (
            current === null
            || candidate.depth > current.depth
            || (
                candidate.depth === current.depth
                && candidate.routeId < current.routeId
            )
        ) {
            return candidate;
        }

        return current;
    }

    private static undirectedAngleDifference(
        first: number,
        second: number,
    ): number {
        const difference = Math.abs(
            ((first - second + 180) % 360 + 360) % 360 - 180,
        );

        return Math.min(difference, 180 - difference);
    }

    private static isBridgeAnchor(
        coordinates: Coordinates,
        road: SurfaceRoadCell,
        river: SurfaceRiverCell,
    ): boolean {
        const score = SurfaceMap.crossingScore(coordinates, road, river);
        const radius = 6;
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                const neighbour = new Coordinates(
                    coordinates.latitude + x,
                    coordinates.longitude + y,
                );
                const neighbourRoad = SurfaceMap.roadAt(neighbour);
                const neighbourRiver = SurfaceMap.riverAt(neighbour);
                if (
                    neighbourRoad === null
                    || neighbourRiver === null
                    || neighbourRoad.routeId !== road.routeId
                    || neighbourRiver.systemId !== river.systemId
                    || SurfaceMap.undirectedAngleDifference(
                        neighbourRoad.headingDegrees,
                        neighbourRiver.channel === "river" ? 90 : 0,
                    ) < 35
                ) {
                    continue;
                }
                const neighbourScore = SurfaceMap.crossingScore(
                    neighbour,
                    neighbourRoad,
                    neighbourRiver,
                );
                if (
                    neighbourScore > score
                    || (
                        neighbourScore === score
                        && (
                            neighbour.latitude < coordinates.latitude
                            || (
                                neighbour.latitude === coordinates.latitude
                                && neighbour.longitude
                                    < coordinates.longitude
                            )
                        )
                    )
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    private static crossingScore(
        coordinates: Coordinates,
        road: SurfaceRoadCell,
        river: SurfaceRiverCell,
    ): number {
        return Math.round(road.depth * 1_000) * 2_000
            + Math.round(river.depth * 1_000)
            + SurfaceMap.hash(
                coordinates.latitude,
                coordinates.longitude,
                road.routeId,
                river.systemId,
                0x35a7c98d,
            ) % 3;
    }

    private static roadSurface(
        routeId: number,
        segment: number,
    ): SurfaceRoadSurface {
        const value = SurfaceMap.hash(routeId, segment, 0x8a61c3f5) % 100;
        if (value < 45) {
            return "gravel";
        }
        if (value < 73) {
            return "sand";
        }
        if (value < 89) {
            return "cobble";
        }

        return "stone";
    }

    private static pathSurface(routeId: number): SurfaceRoadSurface {
        const value = SurfaceMap.hash(routeId, 0x56df29a3) % 100;
        if (value < 46) {
            return "dust";
        }
        if (value < 76) {
            return "mud";
        }

        return "sand";
    }

    private static tributaryAt(
        coordinates: Coordinates,
        systemId: number,
        junctionId: number,
    ): SurfaceRiverCell|null {
        const junctionSeed = SurfaceMap.hash(
            systemId,
            junctionId,
            0x6d0f27bd,
        );
        const junctionY = junctionId * SurfaceMap.TRIBUTARY_STEP
            + SurfaceMap.signedRange(junctionSeed, 13);
        const junctionX = SurfaceMap.riverCenter(systemId, junctionY);
        const direction = SurfaceMap.hash(
            systemId,
            junctionId,
            0x3c81a2ef,
        ) % 2 === 0 ? -1 : 1;
        const length = 22 + SurfaceMap.hash(
            systemId,
            junctionId,
            0x947c35a1,
        ) % 27;
        const progress = (
            (coordinates.latitude - junctionX) * direction
        ) / length;
        if (progress < 0 || progress > 1) {
            return null;
        }

        const bend = SurfaceMap.signedRange(
            SurfaceMap.hash(systemId, junctionId, 0xa5829d43),
            9,
        );
        const wiggle = SurfaceMap.signedRange(
            SurfaceMap.hash(systemId, junctionId, 0x51b72f69),
            4,
        );
        const centerY = junctionY
            + Math.sin(Math.PI * progress) * bend
            + Math.sin(Math.PI * 2 * progress) * wiggle;
        const width = 1.05 + SurfaceMap.hash(
            systemId,
            junctionId,
            0x2e19c47b,
        ) % 61 / 100;
        const distance = Math.abs(coordinates.longitude - centerY);
        if (distance > width) {
            return null;
        }

        return {
            channel: "tributary",
            depth: SurfaceMap.roundDepth(1 - distance / width),
            systemId,
        };
    }

    private static neighbours(coordinates: Coordinates): Coordinates[] {
        return [
            new Coordinates(
                coordinates.latitude - 1,
                coordinates.longitude,
            ),
            new Coordinates(
                coordinates.latitude + 1,
                coordinates.longitude,
            ),
            new Coordinates(
                coordinates.latitude,
                coordinates.longitude - 1,
            ),
            new Coordinates(
                coordinates.latitude,
                coordinates.longitude + 1,
            ),
            new Coordinates(
                coordinates.latitude - 1,
                coordinates.longitude - 1,
            ),
            new Coordinates(
                coordinates.latitude - 1,
                coordinates.longitude + 1,
            ),
            new Coordinates(
                coordinates.latitude + 1,
                coordinates.longitude - 1,
            ),
            new Coordinates(
                coordinates.latitude + 1,
                coordinates.longitude + 1,
            ),
        ];
    }

    private static cardinalNeighbours(
        coordinates: Coordinates,
    ): Coordinates[] {
        return [
            new Coordinates(
                coordinates.latitude - 1,
                coordinates.longitude,
            ),
            new Coordinates(
                coordinates.latitude + 1,
                coordinates.longitude,
            ),
            new Coordinates(
                coordinates.latitude,
                coordinates.longitude - 1,
            ),
            new Coordinates(
                coordinates.latitude,
                coordinates.longitude + 1,
            ),
        ];
    }

    private static horizontalRoadCenter(systemId: number, x: number): number {
        const base = systemId * SurfaceMap.HORIZONTAL_ROAD_SPACING
            + SurfaceMap.signedRange(
                SurfaceMap.hash(systemId, 0x3d81a6f7),
                17,
            );
        const segment = Math.floor(x / SurfaceMap.ROAD_BEND_STEP);
        const progress = (
            x - segment * SurfaceMap.ROAD_BEND_STEP
        ) / SurfaceMap.ROAD_BEND_STEP;
        const smoothProgress = progress * progress * (3 - 2 * progress);
        const from = SurfaceMap.roadBend(systemId, segment, 0x712eb493);
        const to = SurfaceMap.roadBend(systemId, segment + 1, 0x712eb493);

        return base + from + (to - from) * smoothProgress;
    }

    private static verticalRoadCenter(systemId: number, y: number): number {
        const base = systemId * SurfaceMap.VERTICAL_ROAD_SPACING
            + SurfaceMap.signedRange(
                SurfaceMap.hash(systemId, 0xb43d9251),
                24,
            );
        const segment = Math.floor(y / SurfaceMap.ROAD_BEND_STEP);
        const progress = (
            y - segment * SurfaceMap.ROAD_BEND_STEP
        ) / SurfaceMap.ROAD_BEND_STEP;
        const smoothProgress = progress * progress * (3 - 2 * progress);
        const from = SurfaceMap.roadBend(systemId, segment, 0x2cf876ad);
        const to = SurfaceMap.roadBend(systemId, segment + 1, 0x2cf876ad);

        return base + from + (to - from) * smoothProgress;
    }

    private static roadBend(
        systemId: number,
        segment: number,
        salt: number,
    ): number {
        return SurfaceMap.signedRange(
            SurfaceMap.hash(systemId, segment, salt),
            8,
        );
    }

    private static riverCenter(systemId: number, y: number): number {
        const base = systemId * SurfaceMap.RIVER_SPACING
            + SurfaceMap.signedRange(
                SurfaceMap.hash(systemId, 0x71ae294d),
                19,
            );
        const segment = Math.floor(y / SurfaceMap.MEANDER_STEP);
        const progress = (
            y - segment * SurfaceMap.MEANDER_STEP
        ) / SurfaceMap.MEANDER_STEP;
        const smoothProgress = progress * progress * (3 - 2 * progress);
        const from = SurfaceMap.meanderOffset(systemId, segment);
        const to = SurfaceMap.meanderOffset(systemId, segment + 1);

        return base + from + (to - from) * smoothProgress;
    }

    private static meanderOffset(systemId: number, segment: number): number {
        return SurfaceMap.signedRange(
            SurfaceMap.hash(systemId, segment, 0x18c4b36f),
            15,
        );
    }

    private static riverWidth(systemId: number): number {
        return 1.55 + SurfaceMap.hash(systemId, 0xb9e1374d) % 145 / 100;
    }

    private static roundDepth(value: number): number {
        return Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
    }

    private static signedRange(seed: number, span: number): number {
        return seed % (span * 2 + 1) - span;
    }

    private static hash(...values: number[]): number {
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
