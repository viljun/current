export class Coordinates {
    constructor(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
    // Returns seed for this location.
    getSeed() {
        return Math.round(Math.abs(this.latitude * this.longitude * Math.sin(this.latitude) * Math.cos(this.longitude)));
    }
    equals(coordinates) {
        return (this === null || this === void 0 ? void 0 : this.latitude) === (coordinates === null || coordinates === void 0 ? void 0 : coordinates.latitude) && (this === null || this === void 0 ? void 0 : this.longitude) === (coordinates === null || coordinates === void 0 ? void 0 : coordinates.longitude);
    }
    // Returns distance in world-grid cells.
    distanceFrom(coordinates) {
        return Math.hypot(this.latitude - coordinates.latitude, this.longitude - coordinates.longitude);
    }
    // Returns an approximate great-circle distance for GPS-derived grid cells.
    distanceInMetersFrom(coordinates) {
        const latitudeDegrees = this.latitude
            / Coordinates.GRID_CELLS_PER_DEGREE;
        const otherLatitudeDegrees = coordinates.latitude
            / Coordinates.GRID_CELLS_PER_DEGREE;
        const latitudeDifference = latitudeDegrees - otherLatitudeDegrees;
        const longitudeDifference = (this.longitude - coordinates.longitude) / Coordinates.GRID_CELLS_PER_DEGREE;
        const meanLatitudeRadians = (latitudeDegrees + otherLatitudeDegrees) / 2 * Math.PI / 180;
        return Math.hypot(latitudeDifference * Coordinates.METERS_PER_DEGREE, longitudeDifference
            * Coordinates.METERS_PER_DEGREE
            * Math.cos(meanLatitudeRadians));
    }
}
Coordinates.GRID_CELLS_PER_DEGREE = 10000;
Coordinates.METERS_PER_DEGREE = 111320;
