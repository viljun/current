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
    normalizeHeading,
    shortestHeadingDelta,
    shouldAdoptGpsCoordinates,
    shouldExitAreaAtWall,
    smoothHeading,
    usableTravelHeading,
} from "../js/GameController.js";
import { ItemType } from "../js/ItemType.js";
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

test("headings normalize and smooth across north by the shortest route", () => {
    assert.equal(normalizeHeading(450), 90);
    assert.equal(normalizeHeading(-90), 270);
    assert.equal(shortestHeadingDelta(359, 1), 2);
    assert.equal(shortestHeadingDelta(1, 359), -2);
    assert.equal(smoothHeading(null, 90), 90);
    assert.equal(smoothHeading(10, 11.9), 10);
    assert.equal(smoothHeading(359, 1, .25, 0), 359.5);
    assert.equal(smoothHeading(1, 359, .25, 0), .5);
});

test("travel heading is accepted only while GPS reports movement", () => {
    assert.equal(usableTravelHeading(450, 1.2), 90);
    assert.equal(usableTravelHeading(90, null), 90);
    assert.equal(usableTravelHeading(90, .2), null);
    assert.equal(usableTravelHeading(null, 1.2), null);
});

test("map cells form a centered circular footprint", () => {
    assert.equal(GameMap.cellIsInsideCircularFootprint(5, 5, 9, 9), true);
    assert.equal(GameMap.cellIsInsideCircularFootprint(5, 1, 9, 9), true);
    assert.equal(GameMap.cellIsInsideCircularFootprint(1, 1, 9, 9), false);
    assert.equal(GameMap.cellIsInsideCircularFootprint(9, 9, 9, 9), false);
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

test("ordinary actions use the same three-cell radius in both modes", () => {
    const gpsMap = mapWithState({
        coordinates: LOCATION,
        selectedCoordinates: null,
        exploreMode: false,
        takingRangeMeters: 15,
    });
    const stick = new ItemType("stick");
    assert.equal(
        gpsMap.isWithinTakingRange(
            new Coordinates(LOCATION.latitude + 3, LOCATION.longitude),
            stick,
        ),
        true,
    );
    assert.equal(
        gpsMap.isWithinTakingRange(
            new Coordinates(LOCATION.latitude + 2, LOCATION.longitude + 2),
            stick,
        ),
        true,
    );
    assert.equal(
        gpsMap.isWithinTakingRange(
            new Coordinates(LOCATION.latitude + 3, LOCATION.longitude + 1),
            stick,
        ),
        false,
    );

    const exploreMap = mapWithState({
        coordinates: LOCATION,
        selectedCoordinates: LOCATION,
        exploreMode: true,
        takingRangeMeters: null,
    });
    assert.equal(
        exploreMap.isWithinTakingRange(
            new Coordinates(LOCATION.latitude + 3, LOCATION.longitude),
            stick,
        ),
        true,
    );
    assert.equal(
        exploreMap.isWithinTakingRange(
            new Coordinates(LOCATION.latitude + 3, LOCATION.longitude + 1),
            stick,
        ),
        false,
    );
});

test("every ordinary item type shares the three-cell action radius", () => {
    const map = mapWithState({
        coordinates: LOCATION,
        selectedCoordinates: null,
        exploreMode: false,
        takingRangeMeters: 15,
    });
    const edge = new Coordinates(LOCATION.latitude, LOCATION.longitude + 3);

    for (const name of ItemType.allNames()) {
        const itemType = new ItemType(name);
        if (!itemType.changesArea()) {
            assert.equal(
                map.isWithinTakingRange(edge, itemType),
                true,
                name,
            );
        }
    }
});

test("area-changing actions require the player's exact cell", () => {
    const transitionNames = [
        "dungeon entrance",
        "shop entrance",
        "highland gate",
        "stairs up",
    ];
    const adjacent = new Coordinates(
        LOCATION.latitude,
        LOCATION.longitude + 1,
    );
    for (const exploreMode of [false, true]) {
        const map = mapWithState({
            coordinates: LOCATION,
            selectedCoordinates: LOCATION,
            exploreMode,
            takingRangeMeters: exploreMode ? null : 15,
        });
        for (const name of transitionNames) {
            const itemType = new ItemType(name);
            assert.equal(itemType.changesArea(), true, name);
            assert.equal(
                map.isWithinTakingRange(LOCATION, itemType),
                true,
                name + " at player",
            );
            assert.equal(
                map.isWithinTakingRange(adjacent, itemType),
                false,
                name + " beside player",
            );
        }
    }
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
        LOCATION,
    );
});

test("GPS cannot collect before the first accepted location fix", () => {
    const map = mapWithState({
        coordinates: LOCATION,
        selectedCoordinates: null,
        exploreMode: false,
        takingRangeMeters: null,
    });

    assert.equal(
        map.isWithinTakingRange(LOCATION, new ItemType("stick")),
        false,
    );
});
