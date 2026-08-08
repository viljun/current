import { Coordinates } from "./Coordinates.js";
import { ItemType } from "./ItemType.js";
export interface SurfaceRiverCell {
    channel: "river" | "tributary";
    depth: number;
    systemId: number;
}
export interface SurfaceRiverVisual {
    diameterInTiles: number;
    rotationDegrees: number;
    textureOffsetXInTiles: number;
    textureOffsetYInTiles: number;
}
export type SurfaceRoadSurface = "sand" | "gravel" | "cobble" | "stone" | "dust" | "mud";
export interface SurfaceRoadCell {
    kind: "road" | "path";
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
    kind: "ford" | "bridge";
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
export declare class SurfaceMap {
    private static readonly RIVER_SPACING;
    private static readonly MEANDER_STEP;
    private static readonly TRIBUTARY_STEP;
    private static readonly HORIZONTAL_ROAD_SPACING;
    private static readonly VERTICAL_ROAD_SPACING;
    private static readonly ROAD_BEND_STEP;
    private static readonly PATH_JUNCTION_STEP;
    private static readonly WANDERING_PATH_BLOCK;
    static riverAt(coordinates: Coordinates): SurfaceRiverCell | null;
    static isRiverAt(coordinates: Coordinates): boolean;
    static roadAt(coordinates: Coordinates): SurfaceRoadCell | null;
    static roadVisualAt(coordinates: Coordinates, road: SurfaceRoadCell): SurfaceRoadVisual;
    static pathPatchVisualsAt(coordinates: Coordinates, road: SurfaceRoadCell): readonly SurfacePathPatchVisual[];
    static crossingAt(coordinates: Coordinates, road?: SurfaceRoadCell | null, river?: SurfaceRiverCell | null): SurfaceRoadCrossing | null;
    static milestoneAt(coordinates: Coordinates): boolean;
    private static milestoneRouteAt;
    static itemAt(coordinates: Coordinates): ItemType | null;
    static isCampfireAt(coordinates: Coordinates): boolean;
    static riverVisualAt(coordinates: Coordinates, river: SurfaceRiverCell): SurfaceRiverVisual;
    private static roadsidePathAt;
    private static wanderingPathAt;
    private static preferRoute;
    private static undirectedAngleDifference;
    private static isBridgeAnchor;
    private static crossingScore;
    private static roadSurface;
    private static pathSurface;
    private static tributaryAt;
    private static neighbours;
    private static cardinalNeighbours;
    private static horizontalRoadCenter;
    private static verticalRoadCenter;
    private static roadBend;
    private static riverCenter;
    private static meanderOffset;
    private static riverWidth;
    private static roundDepth;
    private static signedRange;
    private static hash;
}
//# sourceMappingURL=SurfaceMap.d.ts.map