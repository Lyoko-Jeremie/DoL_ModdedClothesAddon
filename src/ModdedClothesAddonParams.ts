import {get, set, has, isString, isArray, every, isNil, isPlainObject} from 'lodash';
import type {ClothesItem} from "./winDef";

export interface AddClothesItem {
    key: string;
    filePath: string;
    data?: ClothesItem[];
}

export interface ModdedClothesAddonParams {
    clothes: AddClothesItem[];
    patch?: string[];
}

export type ClothesPatchUpdateType = {
    /**
     * must be a PlainObject
     * key: a subset of `ClothesItem` , must have `name` field
     * value:
     *      `null` means delete,
     *      other value but not undefined means update,
     *      if not provide or `undefined` means no change.
     */
    [key in keyof (Partial<ClothesItem> & Pick<ClothesItem, 'name'>)]: (ClothesItem)[key] | null
};

export interface ClothesPatchInfo {
    key: string;
    data: ClothesPatchUpdateType[];
}

export function checkAddClothesItem(a: any): a is AddClothesItem {
    return a
        && typeof a === 'object'
        && typeof a.key === 'string'
        && typeof a.filePath === 'string';
}

export function checkClothesPatchInfo(a: any): a is ClothesPatchInfo {
    return a
        && isString(a.key)
        && isArray(a.data)
        && every(a.data, isPlainObject);
}

export function checkParams(a: any): a is ModdedClothesAddonParams {
    return a
        && (a.clothes ? isArray(a.clothes) && every(a.clothes, checkAddClothesItem) : true)
        && (a.patch ? isArray(a.patch) && every(a.patch, isString) : true)
        ;
}
