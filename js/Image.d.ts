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
    constructor(dimension: number, src: string, style: string, isTaken: boolean, takeable: boolean, rotate: number, domId: string | null, zIndex: number, tile_size: number);
    static getWithItemTypeName(name: string, tile_size: number, seed?: number, isTaken?: boolean, takeable?: boolean): Image;
    private static visualSeed;
    element(): HTMLImageElement;
}
//# sourceMappingURL=Image.d.ts.map