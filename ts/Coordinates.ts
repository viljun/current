export class Coordinates {
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
}
