export const SURFACE_AREA = 0;
export const DUNGEON_AREA = 1;
export const SHOP_AREA = 2;
export const HIGHLAND_AREA = 3;

export type AreaId =
    typeof SURFACE_AREA
    |typeof DUNGEON_AREA
    |typeof SHOP_AREA
    |typeof HIGHLAND_AREA;
