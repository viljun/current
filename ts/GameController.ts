import { Coordinates } from "./Coordinates.js";
import { Effects } from "./Effects.js";
import { Inventory } from "./Inventory.js";
import { ACCURACY_MULTIPLIER, Map } from "./Map.js";
import type { MapState } from "./Map.js";

interface SmoothedLocation {
    latitude: number;
    longitude: number;
}

export class GameController {
    private static readonly EXPLORE_STORAGE_KEY = "gpsgame.exploreMode";
    private static readonly EXPLORE_LOCATION_STORAGE_KEY = "gpsgame.exploreLocation";
    private static readonly INVENTORY_STORAGE_KEY = "gpsgame.inventory";
    private static readonly SAFETY_MARGIN = 6;
    private static readonly TILE_SIZE = 42;
    private static readonly MAX_ACCEPTED_GPS_ACCURACY_METERS = 50;
    private static readonly GPS_SMOOTHING_FACTOR = 0.35;
    private static readonly DEFAULT_COORDINATES = new Coordinates(
        Math.round(60.8923514 * ACCURACY_MULTIPLIER),
        Math.round(25.1498475 * ACCURACY_MULTIPLIER),
    );

    private readonly mapContainer = this.element<HTMLDivElement>("mapContainer");
    private readonly mapElement = this.element<HTMLDivElement>("map");
    private readonly messageBox = this.element<HTMLDivElement>("messageBox");
    private readonly exploreSwitch = this.element<HTMLInputElement>("exploreSwitch");
    private readonly soundSwitch = this.element<HTMLInputElement>("soundSwitch");
    private readonly inventoryControl = this.element<HTMLButtonElement>("inventoryControl");
    private readonly restartControl = this.element<HTMLButtonElement>("restartControl");
    private readonly gpsStatus = this.element<HTMLDivElement>("gpsStatus");
    private readonly inventory = new Inventory();
    private readonly state: MapState;
    private readonly map: Map;

    private latestGpsCoordinates: Coordinates|null = null;
    private latestGpsAccuracy: number|null = null;
    private smoothedGpsLocation: SmoothedLocation|null = null;
    private pendingCoordinates: Coordinates|null = null;

    constructor() {
        const exploreMode = this.loadExploreMode();
        const coordinates = exploreMode
            ? this.loadExploreCoordinates() ?? GameController.DEFAULT_COORDINATES
            : GameController.DEFAULT_COORDINATES;
        this.state = {
            coordinates,
            selectedCoordinates: exploreMode ? coordinates : null,
            exploreMode,
        };

        this.exploreSwitch.checked = this.state.exploreMode;
        this.mapContainer.classList.toggle("explore-mode", this.state.exploreMode);
        Effects.initialize(this.soundSwitch);

        const dimensions = this.configureMapDimensions();
        this.map = new Map(
            this.mapElement,
            this.messageBox,
            dimensions.cols,
            dimensions.rows,
            this.inventory,
            this.state,
            GameController.TILE_SIZE,
            coordinates => this.selectCoordinates(coordinates),
            () => this.resumeMovement(),
        );
        this.map.show({});
        this.bindControls();
    }

    start(): void {
        if (!navigator.geolocation) {
            this.setGpsStatus("Location is not supported by this device.", "error");

            return;
        }

        this.setGpsStatus("Finding location…", "waiting");
        navigator.geolocation.watchPosition(
            location => this.acceptGpsLocation(location),
            error => this.showGpsError(error),
            {
                enableHighAccuracy: true,
                maximumAge: 5_000,
                timeout: 15_000,
            },
        );
    }

    private configureMapDimensions(): { cols: number; rows: number } {
        const tileOuterDimension = GameController.TILE_SIZE + 1;
        const cols = Math.floor(
            this.mapContainer.clientWidth / tileOuterDimension / 2,
        ) * 2 + 1 + GameController.SAFETY_MARGIN;
        const rows = Math.floor(
            this.mapContainer.clientHeight / tileOuterDimension / 2,
        ) * 2 + 1 + GameController.SAFETY_MARGIN;
        const mapMarginLeft = (
            this.mapContainer.clientWidth - (cols * GameController.TILE_SIZE + 1)
        ) / 2;
        const mapMarginTop = (
            this.mapContainer.clientHeight - (rows * GameController.TILE_SIZE + 1)
        ) / 2;
        const style = document.createElement("style");
        style.textContent = ".cell {width:" + GameController.TILE_SIZE
            + "px;height:" + GameController.TILE_SIZE
            + "px;} #map{margin-left:" + mapMarginLeft
            + "px;margin-top:" + mapMarginTop + "px;}";
        document.head.append(style);

        return { cols, rows };
    }

    private bindControls(): void {
        this.exploreSwitch.addEventListener("change", () => {
            this.setExploreMode(this.exploreSwitch.checked);
        });
        this.inventoryControl.addEventListener(
            "click",
            () => this.inventory.openDialog(),
        );
        this.inventory.onChange(() => this.updateInventoryControl());
        this.updateInventoryControl();
        this.restartControl.addEventListener("click", () => this.restart());
    }

    private updateInventoryControl(): void {
        const count = this.inventory.countItemTypes();
        this.inventoryControl.textContent = count + (count === 1 ? " item" : " items");
        this.inventoryControl.disabled = count === 0;
    }

    private setExploreMode(exploreMode: boolean): void {
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
        } else {
            this.map.show({});
        }
    }

    private selectCoordinates(coordinates: Coordinates): void {
        this.state.selectedCoordinates = coordinates;
        if (this.state.exploreMode) {
            this.moveTo(coordinates);
        } else {
            this.map.show({});
        }
    }

    private moveTo(coordinates: Coordinates): void {
        if (this.map.interactionLocked) {
            this.pendingCoordinates = coordinates;

            return;
        }

        const previousCoordinates = this.state.coordinates;
        this.state.coordinates = coordinates;
        if (this.state.exploreMode) {
            this.saveExploreCoordinates();
        }
        this.map.show({ previousCoordinates });
    }

    private resumeMovement(): void {
        if (this.pendingCoordinates !== null) {
            const coordinates = this.pendingCoordinates;
            this.pendingCoordinates = null;
            this.moveTo(coordinates);
        } else {
            this.map.show({});
        }
    }

    private acceptGpsLocation(location: GeolocationPosition): void {
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
        } else {
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
        this.latestGpsCoordinates = new Coordinates(
            Math.round(this.smoothedGpsLocation.latitude * ACCURACY_MULTIPLIER),
            Math.round(this.smoothedGpsLocation.longitude * ACCURACY_MULTIPLIER),
        );
        this.showCurrentGpsStatus();
        if (
            !this.state.exploreMode
            && !this.state.coordinates.equals(this.latestGpsCoordinates)
        ) {
            this.moveTo(this.latestGpsCoordinates);
        }
    }

    private showGpsError(error: GeolocationPositionError): void {
        const messages: Record<number, string> = {
            1: "Location permission denied.",
            2: "Location is unavailable.",
            3: "Location is taking longer than expected.",
        };
        this.setGpsStatus(
            messages[error.code] ?? "Unable to read location.",
            "error",
        );
    }

    private showCurrentGpsStatus(): void {
        if (this.latestGpsAccuracy === null) {
            this.setGpsStatus("Finding location…", "waiting");

            return;
        }
        this.setGpsStatus("\u00b1" + Math.round(this.latestGpsAccuracy) + " m");
    }

    private setGpsStatus(message: string, status = "ready"): void {
        this.gpsStatus.textContent = message;
        this.gpsStatus.dataset.state = status;
    }

    private loadExploreMode(): boolean {
        try {
            return localStorage.getItem(GameController.EXPLORE_STORAGE_KEY) === "true";
        } catch {
            return false;
        }
    }

    private loadExploreCoordinates(): Coordinates|null {
        try {
            const saved: unknown = JSON.parse(
                localStorage.getItem(GameController.EXPLORE_LOCATION_STORAGE_KEY)
                    ?? "null",
            );
            if (typeof saved !== "object" || saved === null) {
                return null;
            }
            const value = saved as Record<string, unknown>;
            if (
                typeof value.latitude !== "number"
                || !Number.isFinite(value.latitude)
                || typeof value.longitude !== "number"
                || !Number.isFinite(value.longitude)
            ) {
                return null;
            }

            return new Coordinates(value.latitude, value.longitude);
        } catch {
            return null;
        }
    }

    private saveExploreCoordinates(): void {
        this.save(
            GameController.EXPLORE_LOCATION_STORAGE_KEY,
            JSON.stringify(this.state.coordinates),
        );
    }

    private save(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Keep the game functional when browser storage is unavailable.
        }
    }

    private restart(): void {
        if (!window.confirm("Restart the game? All saved progress will be cleared.")) {
            return;
        }
        try {
            localStorage.removeItem(GameController.INVENTORY_STORAGE_KEY);
            localStorage.removeItem(GameController.EXPLORE_LOCATION_STORAGE_KEY);
        } finally {
            window.location.reload();
        }
    }

    private element<T extends HTMLElement>(id: string): T {
        const element = document.getElementById(id);
        if (element === null) {
            throw new Error("Missing required element #" + id);
        }

        return element as T;
    }
}
