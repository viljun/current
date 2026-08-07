export class Coordinates {
    private static readonly GRID_CELLS_PER_DEGREE = 10_000;
    private static readonly METERS_PER_DEGREE = 111_320;

    latitude: number;
    longitude: number;

    constructor(latitude: number, longitude: number) {
        this.latitude  = latitude;
        this.longitude = longitude;
    }

    // Returns seed for this location.
    getSeed() {
        return Math.round(Math.abs(this.latitude * this.longitude * Math.sin(this.latitude) * Math.cos(this.longitude)));
    }

    equals(coordinates: Coordinates) {
        return this?.latitude === coordinates?.latitude && this?.longitude === coordinates?.longitude;
    }

    // Returns distance in world-grid cells.
    distanceFrom(coordinates: Coordinates): number {
        return Math.hypot(
            this.latitude - coordinates.latitude,
            this.longitude - coordinates.longitude,
        );
    }

    // Returns an approximate great-circle distance for GPS-derived grid cells.
    distanceInMetersFrom(coordinates: Coordinates): number {
        const latitudeDegrees = this.latitude
            / Coordinates.GRID_CELLS_PER_DEGREE;
        const otherLatitudeDegrees = coordinates.latitude
            / Coordinates.GRID_CELLS_PER_DEGREE;
        const latitudeDifference = latitudeDegrees - otherLatitudeDegrees;
        const longitudeDifference = (
            this.longitude - coordinates.longitude
        ) / Coordinates.GRID_CELLS_PER_DEGREE;
        const meanLatitudeRadians = (
            latitudeDegrees + otherLatitudeDegrees
        ) / 2 * Math.PI / 180;

        return Math.hypot(
            latitudeDifference * Coordinates.METERS_PER_DEGREE,
            longitudeDifference
                * Coordinates.METERS_PER_DEGREE
                * Math.cos(meanLatitudeRadians),
        );
    }
}
