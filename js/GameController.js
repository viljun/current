import { Coordinates } from "./Coordinates.js";
import { Effects } from "./Effects.js";
import { Inventory } from "./Inventory.js";
import { ACCURACY_MULTIPLIER, Map } from "./Map.js";
export function calculateMapLayout(viewportWidth, viewportHeight, tileSize, safetyMargin) {
    const oddSizeAtLeast = (visibleSize) => {
        const minimum = Math.max(1, Math.ceil(visibleSize) + safetyMargin);
        return minimum % 2 === 0 ? minimum + 1 : minimum;
    };
    const cols = oddSizeAtLeast(viewportWidth / tileSize);
    const rows = oddSizeAtLeast(viewportHeight / tileSize);
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
        this.inventoryControl = this.element("inventoryControl");
        this.restartControl = this.element("restartControl");
        this.gpsStatus = this.element("gpsStatus");
        this.inventory = new Inventory();
        this.mapDimensionStyle = document.createElement("style");
        this.resizeFrame = null;
        this.latestGpsCoordinates = null;
        this.latestGpsAccuracy = null;
        this.smoothedGpsLocation = null;
        this.pendingCoordinates = null;
        const exploreMode = this.loadExploreMode();
        const coordinates = exploreMode
            ? (_a = this.loadExploreCoordinates()) !== null && _a !== void 0 ? _a : GameController.DEFAULT_COORDINATES
            : GameController.DEFAULT_COORDINATES;
        this.state = {
            coordinates,
            selectedCoordinates: exploreMode ? coordinates : null,
            exploreMode,
        };
        this.exploreSwitch.checked = this.state.exploreMode;
        this.mapContainer.classList.toggle("explore-mode", this.state.exploreMode);
        Effects.initialize(this.soundSwitch);
        document.head.append(this.mapDimensionStyle);
        const dimensions = this.configureMapDimensions();
        this.map = new Map(this.mapElement, this.messageBox, dimensions.cols, dimensions.rows, this.inventory, this.state, GameController.TILE_SIZE, coordinates => this.selectCoordinates(coordinates), () => this.resumeMovement());
        this.map.show({});
        this.bindControls();
    }
    start() {
        if (!navigator.geolocation) {
            this.setGpsStatus("Location is not supported by this device.", "error");
            return;
        }
        this.setGpsStatus("Finding location…", "waiting");
        navigator.geolocation.watchPosition(location => this.acceptGpsLocation(location), error => this.showGpsError(error), {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 15000,
        });
    }
    configureMapDimensions() {
        const layout = calculateMapLayout(this.mapContainer.clientWidth, this.mapContainer.clientHeight, GameController.TILE_SIZE, GameController.SAFETY_MARGIN);
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
        this.exploreSwitch.addEventListener("change", () => {
            this.setExploreMode(this.exploreSwitch.checked);
        });
        this.inventoryControl.addEventListener("click", () => this.inventory.openDialog());
        this.inventory.onChange(() => this.updateInventoryControl());
        this.updateInventoryControl();
        this.restartControl.addEventListener("click", () => this.restart());
        window.addEventListener("resize", () => this.scheduleResize());
        (_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.addEventListener("resize", () => this.scheduleResize());
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
        if (this.state.exploreMode) {
            this.moveTo(coordinates);
        }
        else {
            this.map.show({});
        }
    }
    moveTo(coordinates) {
        if (this.map.interactionLocked) {
            this.pendingCoordinates = coordinates;
            return;
        }
        const previousCoordinates = this.state.coordinates;
        if (this.inventory.getAreaId() !== 0 && this.map.isWallAt(coordinates)) {
            this.state.coordinates = coordinates;
            if (this.state.exploreMode) {
                this.saveExploreCoordinates();
            }
            Effects.showAreaCollapse(this.mapElement, coordinates.getSeed());
            this.inventory.exitArea();
            this.state.selectedCoordinates = this.state.exploreMode ? coordinates : null;
            this.map.show({});
            return;
        }
        this.state.coordinates = coordinates;
        if (this.state.exploreMode) {
            this.saveExploreCoordinates();
        }
        this.map.show({ previousCoordinates });
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
        this.latestGpsCoordinates = new Coordinates(Math.round(this.smoothedGpsLocation.latitude * ACCURACY_MULTIPLIER), Math.round(this.smoothedGpsLocation.longitude * ACCURACY_MULTIPLIER));
        this.showCurrentGpsStatus();
        if (!this.state.exploreMode
            && !this.state.coordinates.equals(this.latestGpsCoordinates)) {
            this.moveTo(this.latestGpsCoordinates);
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
            this.setGpsStatus("Finding location…", "waiting");
            return;
        }
        this.setGpsStatus("\u00b1" + Math.round(this.latestGpsAccuracy) + " m");
    }
    setGpsStatus(message, status = "ready") {
        this.gpsStatus.textContent = message;
        this.gpsStatus.dataset.state = status;
    }
    loadExploreMode() {
        try {
            return localStorage.getItem(GameController.EXPLORE_STORAGE_KEY) === "true";
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
GameController.INVENTORY_STORAGE_KEY = "gpsgame.inventory";
GameController.SAFETY_MARGIN = 6;
GameController.TILE_SIZE = 42;
GameController.MAX_ACCEPTED_GPS_ACCURACY_METERS = 50;
GameController.GPS_SMOOTHING_FACTOR = 0.35;
GameController.DEFAULT_COORDINATES = new Coordinates(Math.round(60.8923514 * ACCURACY_MULTIPLIER), Math.round(25.1498475 * ACCURACY_MULTIPLIER));
