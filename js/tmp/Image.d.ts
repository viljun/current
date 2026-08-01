export declare const TILE_WIDTH: number;
export declare class Image {
    dimension: number;
    src: string;
    style: string;
    isTaken: boolean;
    takeable: boolean;
    rotate: number;
    domId: string | null;
    zIndex: number;
    constructor(dimension: number, src: string, style: string, isTaken: boolean, takeable: boolean, rotate: number, domId: string | null, zIndex: number);
    static getWithItemTypeName(name: string, seed?: number, isTaken?: boolean, takeable?: boolean): Image;
    element(): HTMLImageElement;
}
//# sourceMappingURL=Image.d.ts.map