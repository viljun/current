import assert from "node:assert/strict";
import test from "node:test";

import { Coordinates } from "../js/Coordinates.js";
import {
    DUNGEON_AREA,
    HIGHLAND_AREA,
    SHOP_AREA,
    SURFACE_AREA,
} from "../js/Area.js";
import {
    gpsHysteresisMeters,
    gpsTakingRangeMeters,
    shouldAdoptGpsCoordinates,
    shouldExitAreaAtWall,
} from "../js/GameController.js";
import { Map as GameMap } from "../js/Map.js";

const LOCATION = new Coordinates(608_923, 251_498);

test("walls exit every interior area instead of blocking movement", () => {
    assert.equal(shouldExitAreaAtWall(DUNGEON_AREA, true), true);
    assert.equal(shouldExitAreaAtWall(SHOP_AREA, true), true);
    assert.equal(shouldExitAreaAtWall(HIGHLAND_AREA, true), true);
    assert.equal(shouldExitAreaAtWall(SURFACE_AREA, true), false);
    assert.equal(shouldExitAreaAtWall(HIGHLAND_AREA, false), false);
});

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

test("north is up and east is right on the map", () => {
    const centerColumn = 5;
    const centerRow = 7;
    const columns = 9;
    const rows = 13;

    assert.deepEqual(
        GameMap.coordinatesAtCell(
            LOCATION,
            centerColumn,
            centerRow - 1,
            columns,
            rows,
        ),
        new Coordinates(LOCATION.latitude + 1, LOCATION.longitude),
    );
    assert.deepEqual(
        GameMap.coordinatesAtCell(
            LOCATION,
            centerColumn + 1,
            centerRow,
            columns,
            rows,
        ),
        new Coordinates(LOCATION.latitude, LOCATION.longitude + 1),
    );
    assert.deepEqual(
        GameMap.offsetForMovement(
            LOCATION,
            new Coordinates(LOCATION.latitude + 1, LOCATION.longitude),
        ),
        { x: 0, y: -1 },
    );
    assert.deepEqual(
        GameMap.offsetForMovement(
            LOCATION,
            new Coordinates(LOCATION.latitude, LOCATION.longitude + 1),
        ),
        { x: 1, y: 0 },
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

test("GPS makes the square beneath the cat the default interaction", () => {
    const gpsState = {
        coordinates: LOCATION,
        selectedCoordinates: null,
        exploreMode: false,
        takingRangeMeters: 15,
    };
    assert.equal(
        GameMap.interactionCoordinates(gpsState),
        LOCATION,
    );

    const nearbySelection = new Coordinates(
        LOCATION.latitude,
        LOCATION.longitude + 1,
    );
    assert.equal(
        GameMap.interactionCoordinates({
            ...gpsState,
            selectedCoordinates: nearbySelection,
        }),
        nearbySelection,
    );

    assert.equal(
        GameMap.interactionCoordinates({
            ...gpsState,
            takingRangeMeters: null,
        }),
        null,
    );
    assert.equal(
        GameMap.interactionCoordinates({
            ...gpsState,
            exploreMode: true,
        }),
        null,
    );
});

test("GPS cannot collect before the first accepted location fix", () => {
    const map = mapWithState({
        coordinates: LOCATION,
        selectedCoordinates: null,
        exploreMode: false,
        takingRangeMeters: null,
    });

    assert.equal(map.isWithinTakingRange(LOCATION), false);
});
