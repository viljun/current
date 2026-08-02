import type { Coordinates }    from "./Coordinates";
import { Coordinates as GameCoordinates } from "./Coordinates.js";
import { DUNGEON_AREA } from "./Area.js";
import { ItemType } from "./ItemType.js";

export class DungeonMap {
    width:       number;
    height:      number;
    coordinates: Coordinates;
    map:         boolean[][];
    constructor(width: number, height: number, coordinates: Coordinates) {
        this.width       = width;
        this.height      = height;
        this.coordinates = coordinates;

        // Generate map.
        let new_map = this.generate();

        // Remove lonely walls and floors.
        for (let i = 0; i < 4; i++) {
            new_map = this.removeLonelyTiles(new_map);
        }

        // Removes checkerboard patterns.
        new_map = this.removeCheckerboardPatters(new_map);

        this.map = new_map;
    }

    static hasWallAt(coordinates: Coordinates): boolean {
        for (let x = -3; x <= 3; x++) {
            for (let y = -3; y <= 3; y++) {
                if (Math.hypot(x, y) <= 3) {
                    const nearby = new GameCoordinates(
                        coordinates.latitude + x,
                        coordinates.longitude + y,
                    );
                    if (ItemType.getWithSeed(nearby.getSeed(), DUNGEON_AREA)?.name === "stairs up") {
                        return false;
                    }
                }
            }
        }
        let x = (220 + coordinates.latitude) / 8;
        let y = (220 + coordinates.longitude) / 8;
        x += Math.cos(x / 9) * Math.sin(y / 7);
        y += Math.sin(y / 5) * Math.cos(y / 3);
        x *= Math.cos(Math.cos(y / 19) * Math.sin(y / 17));
        y *= Math.sin(Math.sin(x / 13) * Math.sin(y / 11));

        return Math.sin(x * .3 * y) + Math.cos(y * .3 * x) > .1;
    }

    private generate(): boolean[][] {
        const dungeon_map: boolean[][] = [];
        for (let col = 0; col <= this.width; col++) {
            for (let row = 0; row <= this.height; row++) {
                if (this.isWall(col, row)) {
                    const r = row;
                    dungeon_map[r] ??= [];
                    dungeon_map[r][col] = true;
                }
                const coordinates = new GameCoordinates(
                    this.coordinates.latitude + col,
                    this.coordinates.longitude + row,
                );
                if (this.isNearStairs(coordinates)) {
                    const r = row;
                    dungeon_map[r] ??= [];
                    dungeon_map[r][col] = false;
                }
            }
        }

        return dungeon_map;
    }

    private isNearStairs(coordinates: Coordinates): boolean {
        for (let x = -3; x <= 3; x++) {
            for (let y = -3; y <= 3; y++) {
                if (Math.hypot(x, y) > 3) {
                    continue;
                }
                const nearby = new GameCoordinates(
                    coordinates.latitude + x,
                    coordinates.longitude + y,
                );
                if (ItemType.getWithSeed(nearby.getSeed(), DUNGEON_AREA)?.name === "stairs up") {
                    return true;
                }
            }
        }

        return false;
    }

    // Remove lonely walls and floors.
    private removeLonelyTiles(dungeon_map: boolean[][]): boolean[][] {
        for (let col = 0; col <= this.width; col++) {
            for (let row = 0; row <= this.height; row++) {
                let adjecant_count = this.calculateAdjecantWalls(dungeon_map, row, col);

                // Add wall if there are more than 2 adjecant walls.
                if (!(dungeon_map[row]?.[col] ?? false)
                    && adjecant_count > 2
                ) {
                    const r = row;
                    dungeon_map[r] ??= [];
                    dungeon_map[r][col] = true;

                    continue;
                }

                // Remove wall if there are less than 2 adjecant walls.
                if ((dungeon_map[row]?.[col] ?? false)
                    && adjecant_count < 2
                ) {
                    const r = row;
                    dungeon_map[r] ??= [];
                    dungeon_map[r][col] = false;
                }
            }
        }

        return dungeon_map;
    }

    // Removes checkerboard patterns.
    removeCheckerboardPatters(dungeon_map: boolean[][]): boolean[][] {
        for (let col = 1; col < this.width; col++) {
            for (let row = 1; row < this.height; row++) {
                let count = Number(dungeon_map[row]?.[col] ?? false)
                    + Number(dungeon_map[row+1]?.[col+1] ?? false)
                    + Number(!(dungeon_map[row]?.[col+1] ?? false))
                    + Number(!(dungeon_map[row+1]?.[col] ?? false))
                ;
                if (count === 0 || count === 4) {
                    const r = row;
                    const n = row + 1;
                    dungeon_map[r] ??= [];
                    dungeon_map[n] ??= [];

                    dungeon_map[r][col]         = false;
                    dungeon_map[r][col + 1]     = false;
                    dungeon_map[n][col]         = false;
                    dungeon_map[n][col + 1]     = false;
                }
            }
        }

        return dungeon_map;
    }

    // Returns true if the cell is a wall.
    isWall(x: number, y: number) {
        x += 220 + this.coordinates.latitude;
        y += 220 + this.coordinates.longitude;
        x /= 8;
        y /= 8;
        x += Math.cos(x / 9) * Math.sin(y / 7);
        y += Math.sin(y / 5) * Math.cos(y / 3);
        x *= Math.cos(Math.cos(y / 19) * Math.sin(y / 17) );
        y *= Math.sin(Math.sin(x / 13) * Math.sin(y / 11) );

        return Math.sin(x * 0.3 * y) + Math.cos(y * 0.3 * x) > 0.1;
    }

    // Returns the number of adjecant walls.
    calculateAdjecantWalls(dungeon_map: boolean[][], row: number, col: number): number {
        return Number(dungeon_map[row]?.[col-1] ?? false)
            + Number(dungeon_map[row]?.[col+1] ?? false)
            + Number(dungeon_map[row-1]?.[col] ?? false)
            + Number(dungeon_map[row+1]?.[col] ?? false)
        ;
    }

    // Returns cells.
    getCells(): { class: string, style: { gridColumn: number, gridRow: number } }[] {
        const cells = [];
        for (let col = 1; col < this.width; col++) {
            for (let row = 1; row < this.height; row++) {
                if (this.map[row]?.[col] ?? false) {
                    cells.push({
                        class: 'floor',
                        style: {
                            gridColumn: col,
                            gridRow:    row,
                        },
                    });
                } else {
                    cells.push({
                        class: 'wall',
                        style: {
                            gridColumn: col,
                            gridRow:    row,
                        },
                    });
                }
            }
        }

        return cells;
    }

    // Draws the map.
    draw(): void {
        const cells = this.getCells();
        const map_element = document.createElement('div');
        map_element.classList.add('map');
        cells.forEach(cell => {
            const cell_element = document.createElement('div');
            cell_element.classList.add(cell.class);
            Object.entries(cell.style).forEach(([key, value]) => {
                if (typeof value === "string") {
                    // cell_element.style[key] = value;
                    cell_element.style.setProperty(key, value);
                }
            });
            map_element.appendChild(cell_element);
        });
        document.body.appendChild(map_element);
        console.log('drawn');
    }            
}
