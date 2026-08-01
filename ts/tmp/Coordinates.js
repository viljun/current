"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Coordinates = void 0;
var Coordinates = /** @class */ (function () {
    function Coordinates(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
    // Returns seed for this location.
    Coordinates.prototype.getSeed = function () {
        return Math.round(Math.abs(this.latitude * this.longitude * Math.sin(this.latitude) * Math.cos(this.longitude)));
    };
    Coordinates.prototype.equals = function (coordinates) {
        return (this === null || this === void 0 ? void 0 : this.latitude) === (coordinates === null || coordinates === void 0 ? void 0 : coordinates.latitude) && (this === null || this === void 0 ? void 0 : this.longitude) === (coordinates === null || coordinates === void 0 ? void 0 : coordinates.longitude);
    };
    return Coordinates;
}());
exports.Coordinates = Coordinates;
