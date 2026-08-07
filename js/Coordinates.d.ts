export declare class Coordinates {
    private static readonly GRID_CELLS_PER_DEGREE;
    private static readonly METERS_PER_DEGREE;
    latitude: number;
    longitude: number;
    constructor(latitude: number, longitude: number);
    getSeed(): number;
    equals(coordinates: Coordinates): boolean;
    distanceFrom(coordinates: Coordinates): number;
    distanceInMetersFrom(coordinates: Coordinates): number;
}
//# sourceMappingURL=Coordinates.d.ts.map