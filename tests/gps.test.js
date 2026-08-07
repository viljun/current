import assert from "node:assert/strict";
import test from "node:test";

import { Coordinates } from "../js/Coordinates.js";
import {
    gpsHysteresisMeters,
    gpsTakingRangeMeters,
    shouldAdoptGpsCoordinates,
} from "../js/GameController.js";
import { Map as GameMap } from "../js/Map.js";

const LOCATION = new Coordinates(608_923, 251_498);

function mapWithState(state) {
    const map = Object.create(GameMap.prototype);
    map.state = state;

    return map;
}

test("GPS grid distances account for latitude and longitude scale", () => {
    const north = new Coordinates(LOCATION.latitude + 1, LOCATION.longitude);
    const east = new Coordinates(LOCATION.latitude, LOCATION.longitude + 1);

    assert.ok(
        LOCATION.distanceInMetersFrom(north) > 11
            && LOCATION.distanceInMetersFrom(north) < 11.2,
    );
    assert.ok(
        LOCATION.distanceInMetersFrom(east) > 5.3
            && LOCATION.distanceInMetersFrom(east) < 5.5,
    );
});

test("GPS pickup range follows uncertainty within safe limits", () => {
    assert.equal(gpsTakingRangeMeters(3), 15);
    assert.equal(gpsTakingRangeMeters(24), 24);
    assert.equal(gpsTakingRangeMeters(80), 50);
    assert.equal(gpsTakingRangeMeters(Number.NaN), 50);
});

test("GPS hysteresis ignores one-cell jitter but follows real movement", () => {
    assert.equal(gpsHysteresisMeters(5), 6);
    assert.equal(gpsHysteresisMeters(50), 10);
    assert.equal(
        shouldAdoptGpsCoordinates(
            LOCATION,
            new Coordinates(LOCATION.latitude, LOCATION.longitude + 1),
            10,
        ),
        false,
    );
    assert.equal(
        shouldAdoptGpsCoordinates(
            LOCATION,
            new Coordinates(LOCATION.latitude, LOCATION.longitude + 2),
            10,
        ),
        true,
    );
});

test("GPS uses metre-based reach while Explore keeps exact grid reach", () => {
    const gpsMap = mapWithState({
        coordinates: LOCATION,
        selectedCoordinates: null,
        exploreMode: false,
        takingRangeMeters: 15,
    });
    assert.equal(
        gpsMap.isWithinTakingRange(
            new Coordinates(LOCATION.latitude, LOCATION.longitude + 2),
        ),
        true,
    );
    assert.equal(
        gpsMap.isWithinTakingRange(
            new Coordinates(LOCATION.latitude, LOCATION.longitude + 3),
        ),
        false,
    );

    const exploreMap = mapWithState({
        coordinates: LOCATION,
        selectedCoordinates: LOCATION,
        exploreMode: true,
        takingRangeMeters: 50,
    });
    assert.equal(
        exploreMap.isWithinTakingRange(
            new Coordinates(LOCATION.latitude + 1, LOCATION.longitude),
        ),
        true,
    );
    assert.equal(
        exploreMap.isWithinTakingRange(
            new Coordinates(LOCATION.latitude + 1, LOCATION.longitude + 1),
        ),
        false,
    );
});
