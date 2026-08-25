import { Coordinates } from "./Coordinates.js";
import { SURFACE_AREA } from "./Area.js";
import { Effects } from "./Effects.js";
import { EncounterCard } from "./EncounterCard.js";
import { Inventory } from "./Inventory.js";
import { ACCURACY_MULTIPLIER, Map } from "./Map.js";
import { View } from "./View.js";
export function normalizeHeading(heading) {
    return ((heading % 360) + 360) % 360;
}
export function shortestHeadingDelta(from, to) {
    return ((normalizeHeading(to) - normalizeHeading(from) + 540) % 360)
        - 180;
}
export function smoothHeading(previous, next, factor = .24, deadbandDegrees = 2) {
    const target = normalizeHeading(next);
    if (previous === null) {
        return target;
    }
    const delta = shortestHeadingDelta(previous, target);
    return Math.abs(delta) <= deadbandDegrees
        ? previous
        : previous + delta * factor;
}
export function usableTravelHeading(heading, speedMetersPerSecond) {
    if (heading === null || !Number.isFinite(heading)) {
        return null;
    }
    if (speedMetersPerSecond !== null
        && Number.isFinite(speedMetersPerSecond)
        && speedMetersPerSecond < .5) {
        return null;
    }
    return normalizeHeading(heading);
}
export function mapHeadingFromSensors(exploreMode, travelHeading, compassHeading, manualHeading = null) {
    return manualHeading !== null && manualHeading !== void 0 ? manualHeading : (exploreMode
        ? compassHeading
        : travelHeading !== null && travelHeading !== void 0 ? travelHeading : compassHeading);
}
export function compassDialAngle(clientX, clientY, centerX, centerY) {
    return normalizeHeading(Math.atan2(clientX - centerX, centerY - clientY) * 180 / Math.PI);
}
export function manualHeadingAfterDialDrag(startHeading, startDialAngle, currentDialAngle) {
    return normalizeHeading(startHeading
        - shortestHeadingDelta(startDialAngle, currentDialAngle));
}
export function shouldExitAreaAtWall(areaId, wall) {
    return areaId !== SURFACE_AREA && wall;
}
const MIN_GPS_TAKING_RANGE_METERS = 15;
const MAX_GPS_TAKING_RANGE_METERS = 50;
const MIN_GPS_HYSTERESIS_METERS = 6;
const MAX_GPS_HYSTERESIS_METERS = 10;
export function gpsTakingRangeMeters(accuracyMeters) {
    const accuracy = Number.isFinite(accuracyMeters)
        ? Math.max(0, accuracyMeters)
        : MAX_GPS_TAKING_RANGE_METERS;
    return Math.min(MAX_GPS_TAKING_RANGE_METERS, Math.max(MIN_GPS_TAKING_RANGE_METERS, accuracy));
}
export function gpsHysteresisMeters(accuracyMeters) {
    const accuracy = Number.isFinite(accuracyMeters)
        ? Math.max(0, accuracyMeters)
        : MAX_GPS_TAKING_RANGE_METERS;
    return Math.min(MAX_GPS_HYSTERESIS_METERS, Math.max(MIN_GPS_HYSTERESIS_METERS, accuracy * .2));
}
export function shouldAdoptGpsCoordinates(current, candidate, accuracyMeters) {
    return current === null
        || current.distanceInMetersFrom(candidate)
            >= gpsHysteresisMeters(accuracyMeters);
}
export function shouldQueueMovement(interactionLocked, slideInProgress) {
    return interactionLocked || slideInProgress;
}
export function shouldRefreshMapForGpsAccuracy(previousTakingRangeMeters) {
    return previousTakingRangeMeters === null;
}
export function calculateMapLayout(viewportWidth, viewportHeight, tileSize, visualOverscanCells) {
    const screenRadius = Math.hypot(viewportWidth, viewportHeight) / 2;
    const mapRadius = screenRadius
        + Math.max(0, visualOverscanCells) * tileSize;
    const minimumDiameter = Math.max(1, Math.ceil(mapRadius * 2 / tileSize));
    const diameter = minimumDiameter % 2 === 0
        ? minimumDiameter + 1
        : minimumDiameter;
    const cols = diameter;
    const rows = diameter;
    const mapWidth = cols * tileSize;
    const mapHeight = rows * tileSize;
    return {
        cols,
        rows,
        mapWidth,
        mapHeight,
        marginLeft: (viewportWidth - mapWidth) / 2,
        marginTop: (viewportHeight - mapHeight) / 2,
    };
}
export class GameController {
    constructor() {
        var _a;
        this.mapContainer = this.element("mapContainer");
        this.mapElement = this.element("map");
        this.messageBox = this.element("messageBox");
        this.exploreSwitch = this.element("exploreSwitch");
        this.soundSwitch = this.element("soundSwitch");
        this.labelsSwitch = this.element("labelsSwitch");
        this.inventoryControl = this.element("inventoryControl");
        this.restartControl = this.element("restartControl");
        this.compassIndicator = this.element("compassIndicator");
        this.gpsStatus = this.element("gpsStatus");
        this.inventory = new Inventory();
        this.mapDimensionStyle = document.createElement("style");
        this.resizeFrame = null;
        this.latestGpsCoordinates = null;
        this.latestGpsAccuracy = null;
        this.smoothedGpsLocation = null;
        this.pendingCoordinates = null;
        this.compassHeading = null;
        this.travelHeading = null;
        this.manualCompassHeading = null;
        this.pendingSensorHeading = null;
        this.displayedHeading = null;
        this.compassMapUpdateTimer = null;
        this.compassFallbackTimer = null;
        this.manualCompassUpdateTimer = null;
        this.manualCompassDrag = null;
        const exploreMode = this.loadExploreMode();
        const coordinates = exploreMode
            ? (_a = this.loadExploreCoordinates()) !== null && _a !== void 0 ? _a : GameController.DEFAULT_COORDINATES
            : GameController.DEFAULT_COORDINATES;
        this.state = {
            coordinates,
            selectedCoordinates: exploreMode ? coordinates : null,
            exploreMode,
            takingRangeMeters: null,
        };
        this.exploreSwitch.checked = this.state.exploreMode;
        this.labelsSwitch.checked = this.loadLabelsEnabled();
        this.mapContainer.classList.toggle("explore-mode", this.state.exploreMode);
        this.mapContainer.classList.toggle("map-labels-enabled", this.labelsSwitch.checked);
        Effects.initialize(this.soundSwitch);
        document.head.append(this.mapDimensionStyle);
        const dimensions = this.configureMapDimensions();
        this.map = new Map(this.mapElement, this.messageBox, dimensions.cols, dimensions.rows, this.inventory, this.state, GameController.TILE_SIZE, coordinates => this.selectCoordinates(coordinates), coordinates => this.moveTo(coordinates), () => this.resumeMovement(), () => this.resumePendingMovement());
        this.map.show({});
        this.bindControls();
        this.bindCompass();
    }
    start() {
        if (!navigator.geolocation) {
            this.setGpsStatus("Location is not supported by this device.", "error");
            return;
        }
        this.setGpsStatus("Finding location.", "waiting");
        navigator.geolocation.watchPosition(location => this.acceptGpsLocation(location), error => this.showGpsError(error), {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 15000,
        });
    }
    configureMapDimensions() {
        const layout = calculateMapLayout(this.mapContainer.clientWidth, this.mapContainer.clientHeight, GameController.TILE_SIZE, GameController.MAP_VISUAL_OVERSCAN_CELLS);
        this.mapElement.dataset.columns = String(layout.cols);
        this.mapElement.dataset.rows = String(layout.rows);
        this.mapDimensionStyle.textContent = ".cell {width:" + GameController.TILE_SIZE
            + "px;height:" + GameController.TILE_SIZE + "px;} #map{"
            + "grid-template-columns:repeat(" + layout.cols + ","
            + GameController.TILE_SIZE + "px);"
            + "grid-template-rows:repeat(" + layout.rows + ","
            + GameController.TILE_SIZE + "px);"
            + "width:" + layout.mapWidth + "px;"
            + "height:" + layout.mapHeight + "px;"
            + "margin-left:" + layout.marginLeft + "px;"
            + "margin-top:" + layout.marginTop + "px;}";
        return { cols: layout.cols, rows: layout.rows };
    }
    bindControls() {
        var _a;
        document.addEventListener(EncounterCard.ITEM_FOCUS_EVENT, event => {
            const detail = event.detail;
            this.map.focusItemLabels(detail.itemName);
        });
        this.exploreSwitch.addEventListener("change", () => {
            this.setExploreMode(this.exploreSwitch.checked);
        });
        this.labelsSwitch.addEventListener("change", () => {
            const enabled = this.labelsSwitch.checked;
            this.mapContainer.classList.toggle("map-labels-enabled", enabled);
            this.save(GameController.LABELS_STORAGE_KEY, String(enabled));
        });
        this.inventoryControl.addEventListener("click", () => this.inventory.openDialog());
        this.inventory.onChange(() => this.updateInventoryControl());
        this.updateInventoryControl();
        this.restartControl.addEventListener("click", () => this.restart());
        window.addEventListener("resize", () => this.scheduleResize());
        (_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.addEventListener("resize", () => this.scheduleResize());
    }
    bindCompass() {
        this.bindManualCompassControls();
        if (typeof window.DeviceOrientationEvent === "undefined") {
            this.enableManualCompass();
            return;
        }
        const orientationConstructor = window.DeviceOrientationEvent;
        const update = (event) => {
            var _a;
            const orientation = event;
            const heading = (_a = orientation.webkitCompassHeading) !== null && _a !== void 0 ? _a : (orientation.absolute && orientation.alpha !== null
                ? (360 - orientation.alpha) % 360
                : null);
            if (heading === null || !Number.isFinite(heading)) {
                return;
            }
            this.receiveSensorHeading(normalizeHeading(heading));
        };
        let listening = false;
        const listen = () => {
            if (listening) {
                return;
            }
            listening = true;
            window.addEventListener("deviceorientationabsolute", update);
            window.addEventListener("deviceorientation", update);
        };
        if (orientationConstructor.requestPermission === undefined) {
            listen();
            this.startCompassFallbackTimer();
            return;
        }
        this.compassIndicator.classList.add("compass-permission");
        this.compassIndicator.setAttribute("role", "button");
        this.compassIndicator.setAttribute("tabindex", "0");
        this.compassIndicator.title = "Tap to enable compass";
        let permissionRequested = false;
        const requestPermission = () => {
            var _a;
            if (permissionRequested || this.manualCompassHeading !== null) {
                return;
            }
            permissionRequested = true;
            void ((_a = orientationConstructor.requestPermission) === null || _a === void 0 ? void 0 : _a.call(orientationConstructor, true).then(permission => {
                if (permission !== "granted") {
                    this.enableManualCompass();
                    return;
                }
                listen();
                this.compassIndicator.classList.remove("compass-permission");
                this.compassIndicator.setAttribute("role", "img");
                this.compassIndicator.removeAttribute("tabindex");
                this.compassIndicator.title = "Waiting for compass";
                this.compassIndicator.setAttribute("aria-label", "Waiting for compass");
                this.startCompassFallbackTimer();
            }).catch(() => this.enableManualCompass()));
        };
        this.compassIndicator.addEventListener("click", requestPermission);
        this.compassIndicator.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                requestPermission();
            }
        });
    }
    bindManualCompassControls() {
        this.compassIndicator.addEventListener("pointerdown", event => {
            if (this.manualCompassHeading === null
                || !event.isPrimary
                || event.button !== 0) {
                return;
            }
            const bounds = this.compassIndicator.getBoundingClientRect();
            this.manualCompassDrag = {
                pointerId: event.pointerId,
                startDialAngle: compassDialAngle(event.clientX, event.clientY, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2),
                startHeading: this.manualCompassHeading,
            };
            this.compassIndicator.classList.add("compass-dragging");
            try {
                this.compassIndicator.setPointerCapture(event.pointerId);
            }
            catch (_a) {
                // Synthetic browser-test pointers cannot be captured.
            }
            event.preventDefault();
        });
        this.compassIndicator.addEventListener("pointermove", event => {
            var _a;
            if (((_a = this.manualCompassDrag) === null || _a === void 0 ? void 0 : _a.pointerId) !== event.pointerId) {
                return;
            }
            this.updateManualCompassFromPointer(event);
            event.preventDefault();
        });
        const finishPointer = (event) => {
            var _a;
            if (((_a = this.manualCompassDrag) === null || _a === void 0 ? void 0 : _a.pointerId) !== event.pointerId) {
                return;
            }
            if (event.type === "pointerup") {
                this.updateManualCompassFromPointer(event);
            }
            this.manualCompassDrag = null;
            this.compassIndicator.classList.remove("compass-dragging");
            if (this.compassIndicator.hasPointerCapture(event.pointerId)) {
                this.compassIndicator.releasePointerCapture(event.pointerId);
            }
            if (this.pendingSensorHeading !== null) {
                const heading = this.pendingSensorHeading;
                this.pendingSensorHeading = null;
                this.useSensorHeading(heading);
            }
            event.preventDefault();
        };
        this.compassIndicator.addEventListener("pointerup", finishPointer);
        this.compassIndicator.addEventListener("pointercancel", finishPointer);
        this.compassIndicator.addEventListener("wheel", event => {
            if (this.manualCompassHeading === null) {
                return;
            }
            const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
            if (delta === 0) {
                return;
            }
            this.setManualCompassHeading(this.manualCompassHeading
                + Math.sign(delta)
                    * GameController.MANUAL_COMPASS_STEP_DEGREES);
            event.preventDefault();
        }, { passive: false });
        this.compassIndicator.addEventListener("keydown", event => {
            if (this.manualCompassHeading === null) {
                return;
            }
            let heading = null;
            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                heading = this.manualCompassHeading
                    + GameController.MANUAL_COMPASS_STEP_DEGREES;
            }
            else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                heading = this.manualCompassHeading
                    - GameController.MANUAL_COMPASS_STEP_DEGREES;
            }
            else if (event.key === "PageUp") {
                heading = this.manualCompassHeading + 15;
            }
            else if (event.key === "PageDown") {
                heading = this.manualCompassHeading - 15;
            }
            else if (event.key === "Home") {
                heading = 0;
            }
            if (heading === null) {
                return;
            }
            this.setManualCompassHeading(heading);
            event.preventDefault();
        });
    }
    updateManualCompassFromPointer(event) {
        const drag = this.manualCompassDrag;
        if (drag === null) {
            return;
        }
        const bounds = this.compassIndicator.getBoundingClientRect();
        const dialAngle = compassDialAngle(event.clientX, event.clientY, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
        this.setManualCompassHeading(manualHeadingAfterDialDrag(drag.startHeading, drag.startDialAngle, dialAngle));
    }
    setManualCompassHeading(heading) {
        this.manualCompassHeading = normalizeHeading(heading);
        if (this.manualCompassUpdateTimer !== null) {
            return;
        }
        this.manualCompassUpdateTimer = window.setTimeout(() => {
            this.manualCompassUpdateTimer = null;
            if (this.manualCompassHeading === null) {
                return;
            }
            this.showCompassHeading(this.manualCompassHeading, true);
            this.cancelScheduledCompassMapHeading();
            this.applyMapHeading(true);
        });
    }
    enableManualCompass() {
        var _a, _b, _c;
        this.cancelCompassFallbackTimer();
        this.manualCompassHeading = normalizeHeading((_c = (_b = (_a = this.manualCompassHeading) !== null && _a !== void 0 ? _a : this.displayedHeading) !== null && _b !== void 0 ? _b : this.compassHeading) !== null && _c !== void 0 ? _c : 0);
        this.compassIndicator.classList.remove("compass-permission");
        this.compassIndicator.classList.add("compass-manual");
        this.compassIndicator.setAttribute("role", "slider");
        this.compassIndicator.setAttribute("tabindex", "0");
        this.compassIndicator.setAttribute("aria-valuemin", "0");
        this.compassIndicator.setAttribute("aria-valuemax", "359");
        this.compassIndicator.title =
            "Drag, scroll, or use arrow keys to rotate the map";
        this.setManualCompassHeading(this.manualCompassHeading);
    }
    receiveSensorHeading(heading) {
        if (this.manualCompassDrag !== null) {
            this.pendingSensorHeading = heading;
            return;
        }
        this.useSensorHeading(heading);
    }
    useSensorHeading(heading) {
        this.cancelCompassFallbackTimer();
        if (this.manualCompassUpdateTimer !== null) {
            window.clearTimeout(this.manualCompassUpdateTimer);
            this.manualCompassUpdateTimer = null;
        }
        this.manualCompassHeading = null;
        this.compassHeading = heading;
        this.compassIndicator.classList.remove("compass-manual", "compass-dragging", "compass-permission");
        this.compassIndicator.setAttribute("role", "img");
        this.compassIndicator.removeAttribute("tabindex");
        this.compassIndicator.removeAttribute("aria-valuemin");
        this.compassIndicator.removeAttribute("aria-valuemax");
        this.compassIndicator.removeAttribute("aria-valuenow");
        this.compassIndicator.title = "North";
        this.showCompassHeading(heading, false);
        this.scheduleCompassMapHeading();
    }
    showCompassHeading(heading, manual) {
        this.compassIndicator.style.setProperty("--compass-rotation", normalizeHeading(-heading) + "deg");
        this.compassIndicator.setAttribute("aria-label", (manual ? "Manual compass heading " : "Compass heading ")
            + Math.round(heading) + " degrees");
        if (manual) {
            this.compassIndicator.setAttribute("aria-valuenow", String(Math.round(heading)));
        }
    }
    startCompassFallbackTimer() {
        this.cancelCompassFallbackTimer();
        this.compassFallbackTimer = window.setTimeout(() => {
            this.compassFallbackTimer = null;
            if (this.compassHeading === null) {
                this.enableManualCompass();
            }
        }, GameController.COMPASS_SENSOR_TIMEOUT_MS);
    }
    cancelCompassFallbackTimer() {
        if (this.compassFallbackTimer === null) {
            return;
        }
        window.clearTimeout(this.compassFallbackTimer);
        this.compassFallbackTimer = null;
    }
    scheduleResize() {
        if (this.resizeFrame !== null) {
            return;
        }
        this.resizeFrame = window.requestAnimationFrame(() => {
            this.resizeFrame = null;
            const dimensions = this.configureMapDimensions();
            if (dimensions.cols === this.map.cols
                && dimensions.rows === this.map.rows) {
                return;
            }
            this.map.cols = dimensions.cols;
            this.map.rows = dimensions.rows;
            this.map.show({});
        });
    }
    updateInventoryControl() {
        const count = this.inventory.countItemTypes();
        this.inventoryControl.textContent = count + (count === 1 ? " item" : " items");
        this.inventoryControl.disabled = count === 0;
    }
    setExploreMode(exploreMode) {
        this.state.exploreMode = exploreMode;
        this.mapContainer.classList.toggle("explore-mode", exploreMode);
        this.save(GameController.EXPLORE_STORAGE_KEY, String(exploreMode));
        this.cancelScheduledCompassMapHeading();
        this.applyMapHeading(true);
        if (exploreMode) {
            this.state.selectedCoordinates = this.state.coordinates;
            this.saveExploreCoordinates();
            this.map.show({});
            return;
        }
        this.state.selectedCoordinates = null;
        if (this.latestGpsCoordinates !== null) {
            this.moveTo(this.latestGpsCoordinates);
        }
        else {
            this.map.show({});
        }
    }
    selectCoordinates(coordinates) {
        this.state.selectedCoordinates = coordinates;
        this.map.show({});
    }
    moveTo(coordinates) {
        if (shouldQueueMovement(this.map.interactionLocked, this.map.slidingAnimationInProgress)) {
            this.pendingCoordinates = coordinates;
            return;
        }
        const previousCoordinates = this.state.coordinates;
        if (shouldExitAreaAtWall(this.inventory.getAreaId(), this.map.isWallAt(coordinates))) {
            this.state.coordinates = coordinates;
            if (this.state.exploreMode) {
                this.saveExploreCoordinates();
            }
            Effects.showAreaExplosion(this.mapElement, coordinates.getSeed());
            this.inventory.exitArea();
            this.state.selectedCoordinates = coordinates;
            this.map.show({});
            return;
        }
        this.state.coordinates = coordinates;
        this.state.selectedCoordinates = coordinates;
        if (this.state.exploreMode) {
            this.saveExploreCoordinates();
        }
        this.map.show({ previousCoordinates });
    }
    resumePendingMovement() {
        if (this.pendingCoordinates === null) {
            return;
        }
        const coordinates = this.pendingCoordinates;
        this.pendingCoordinates = null;
        if (!this.state.coordinates.equals(coordinates)) {
            this.moveTo(coordinates);
        }
    }
    resumeMovement() {
        if (this.pendingCoordinates !== null) {
            const coordinates = this.pendingCoordinates;
            this.pendingCoordinates = null;
            this.moveTo(coordinates);
        }
        else {
            this.map.show({});
        }
    }
    acceptGpsLocation(location) {
        const accuracy = location.coords.accuracy;
        if (accuracy > GameController.MAX_ACCEPTED_GPS_ACCURACY_METERS) {
            this.setGpsStatus("\u00b1" + Math.round(accuracy) + " m", "warning");
            return;
        }
        this.travelHeading = usableTravelHeading(location.coords.heading, location.coords.speed);
        this.cancelScheduledCompassMapHeading();
        this.applyMapHeading();
        const rawLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
        if (this.smoothedGpsLocation === null) {
            this.smoothedGpsLocation = rawLocation;
        }
        else {
            this.smoothedGpsLocation = {
                latitude: this.smoothedGpsLocation.latitude
                    + (rawLocation.latitude - this.smoothedGpsLocation.latitude)
                        * GameController.GPS_SMOOTHING_FACTOR,
                longitude: this.smoothedGpsLocation.longitude
                    + (rawLocation.longitude - this.smoothedGpsLocation.longitude)
                        * GameController.GPS_SMOOTHING_FACTOR,
            };
        }
        this.latestGpsAccuracy = accuracy;
        const candidateCoordinates = new Coordinates(Math.round(this.smoothedGpsLocation.latitude * ACCURACY_MULTIPLIER), Math.round(this.smoothedGpsLocation.longitude * ACCURACY_MULTIPLIER));
        const previousTakingRange = this.state.takingRangeMeters;
        this.state.takingRangeMeters = gpsTakingRangeMeters(accuracy);
        const coordinatesChanged = shouldAdoptGpsCoordinates(this.latestGpsCoordinates, candidateCoordinates, accuracy);
        if (coordinatesChanged) {
            this.latestGpsCoordinates = candidateCoordinates;
        }
        this.showCurrentGpsStatus();
        if (!this.state.exploreMode
            && this.latestGpsCoordinates !== null) {
            if (!this.state.coordinates.equals(this.latestGpsCoordinates)) {
                this.moveTo(this.latestGpsCoordinates);
            }
            else if (shouldRefreshMapForGpsAccuracy(previousTakingRange)) {
                this.map.show({});
            }
        }
    }
    showGpsError(error) {
        var _a;
        const messages = {
            1: "Location permission denied.",
            2: "Location is unavailable.",
            3: "Location is taking longer than expected.",
        };
        this.setGpsStatus((_a = messages[error.code]) !== null && _a !== void 0 ? _a : "Unable to read location.", "error");
    }
    showCurrentGpsStatus() {
        if (this.latestGpsAccuracy === null) {
            this.setGpsStatus("Finding location.", "waiting");
            return;
        }
        this.setGpsStatus("\u00b1" + Math.round(this.latestGpsAccuracy) + " m");
    }
    setGpsStatus(message, status = "ready") {
        this.gpsStatus.textContent = message;
        this.gpsStatus.dataset.state = status;
    }
    applyMapHeading(immediate = false) {
        var _a;
        const sensorHeading = mapHeadingFromSensors(this.state.exploreMode, this.travelHeading, this.compassHeading, this.manualCompassHeading);
        const target = sensorHeading !== null && sensorHeading !== void 0 ? sensorHeading : this.displayedHeading;
        if (target === null) {
            this.mapContainer.style.setProperty("--map-bearing-rotation", "0deg");
            this.mapContainer.style.setProperty("--map-counter-rotation", "0deg");
            this.mapContainer.classList.remove("map-heading-up");
            return;
        }
        const hadDisplayedHeading = this.displayedHeading !== null;
        const previous = (_a = this.displayedHeading) !== null && _a !== void 0 ? _a : 0;
        const nextHeading = immediate || !hadDisplayedHeading
            ? previous + shortestHeadingDelta(previous, target)
            : smoothHeading(previous, target);
        this.displayedHeading = nextHeading;
        if (!immediate && hadDisplayedHeading && nextHeading === previous) {
            return;
        }
        this.mapContainer.style.setProperty("--map-bearing-rotation", -this.displayedHeading + "deg");
        this.mapContainer.style.setProperty("--map-counter-rotation", this.displayedHeading + "deg");
        this.mapContainer.classList.add("map-heading-up");
    }
    scheduleCompassMapHeading() {
        if (!this.state.exploreMode && this.travelHeading !== null) {
            return;
        }
        if (this.displayedHeading === null) {
            this.applyMapHeading(true);
            return;
        }
        if (this.compassMapUpdateTimer !== null) {
            return;
        }
        this.compassMapUpdateTimer = window.setTimeout(() => {
            this.compassMapUpdateTimer = null;
            this.applyMapHeading();
        }, GameController.COMPASS_MAP_UPDATE_INTERVAL_MS);
    }
    cancelScheduledCompassMapHeading() {
        if (this.compassMapUpdateTimer === null) {
            return;
        }
        window.clearTimeout(this.compassMapUpdateTimer);
        this.compassMapUpdateTimer = null;
    }
    loadExploreMode() {
        try {
            return localStorage.getItem(GameController.EXPLORE_STORAGE_KEY) === "true";
        }
        catch (_a) {
            return false;
        }
    }
    loadLabelsEnabled() {
        try {
            return localStorage.getItem(GameController.LABELS_STORAGE_KEY)
                === "true";
        }
        catch (_a) {
            return false;
        }
    }
    loadExploreCoordinates() {
        var _a;
        try {
            const saved = JSON.parse((_a = localStorage.getItem(GameController.EXPLORE_LOCATION_STORAGE_KEY)) !== null && _a !== void 0 ? _a : "null");
            if (typeof saved !== "object" || saved === null) {
                return null;
            }
            const value = saved;
            if (typeof value.latitude !== "number"
                || !Number.isFinite(value.latitude)
                || typeof value.longitude !== "number"
                || !Number.isFinite(value.longitude)) {
                return null;
            }
            return new Coordinates(value.latitude, value.longitude);
        }
        catch (_b) {
            return null;
        }
    }
    saveExploreCoordinates() {
        this.save(GameController.EXPLORE_LOCATION_STORAGE_KEY, JSON.stringify(this.state.coordinates));
    }
    save(key, value) {
        try {
            localStorage.setItem(key, value);
        }
        catch (_a) {
            // Keep the game functional when browser storage is unavailable.
        }
    }
    restart() {
        if (!window.confirm("Restart the game? All saved progress will be cleared.")) {
            return;
        }
        try {
            localStorage.removeItem(GameController.INVENTORY_STORAGE_KEY);
            localStorage.removeItem(GameController.EXPLORE_LOCATION_STORAGE_KEY);
        }
        finally {
            window.location.reload();
        }
    }
    element(id) {
        const element = document.getElementById(id);
        if (element === null) {
            throw new Error("Missing required element #" + id);
        }
        return element;
    }
}
GameController.EXPLORE_STORAGE_KEY = "gpsgame.exploreMode";
GameController.EXPLORE_LOCATION_STORAGE_KEY = "gpsgame.exploreLocation";
GameController.LABELS_STORAGE_KEY = "gpsgame.mapLabels";
GameController.INVENTORY_STORAGE_KEY = "gpsgame.inventory";
// The map boundary stays two tiles beyond every screen corner. Larger
// transparent artwork may be clipped outside the visible viewport, but
// those distant cells no longer make each redraw prohibitively expensive.
GameController.MAP_VISUAL_OVERSCAN_CELLS = 2;
GameController.COMPASS_MAP_UPDATE_INTERVAL_MS = 100;
GameController.COMPASS_SENSOR_TIMEOUT_MS = 1500;
GameController.MANUAL_COMPASS_STEP_DEGREES = 5;
GameController.TILE_SIZE = 42;
GameController.MAX_ACCEPTED_GPS_ACCURACY_METERS = MAX_GPS_TAKING_RANGE_METERS;
GameController.GPS_SMOOTHING_FACTOR = 0.55;
GameController.DEFAULT_COORDINATES = new Coordinates(Math.round(60.8923514 * ACCURACY_MULTIPLIER), Math.round(25.1498475 * ACCURACY_MULTIPLIER));
