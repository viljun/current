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
}
