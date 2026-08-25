export declare class Image {
    dimension: number;
    src: string;
    style: string;
    isTaken: boolean;
    takeable: boolean;
    rotate: number;
    domId: string | null;
    zIndex: number;
    tile_size: number;
    remainsUprightOnMap: boolean;
    private static readonly DUNGEON_MONSTER_IMAGES;
    private static readonly VENDOR_CAT_IMAGES;
    private static readonly MAP_RELATIVE_ARTWORK;
    constructor(dimension: number, src: string, style: string, isTaken: boolean, takeable: boolean, rotate: number, domId: string | null, zIndex: number, tile_size: number, remainsUprightOnMap: boolean);
    static shouldRemainUprightOnMap(name: string): boolean;
    static getWithItemTypeName(name: string, tile_size: number, seed?: number, isTaken?: boolean, takeable?: boolean): Image;
    private static visualSeed;
    element(): HTMLImageElement;
}
//# sourceMappingURL=Image.d.ts.map