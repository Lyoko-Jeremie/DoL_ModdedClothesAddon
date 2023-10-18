import {get, set, has, isString, isArray, every, isNil} from 'lodash';
import type {ClothesItem} from "./winDef";

export interface AddClothesItem {
    key: string;
    filePath: string;
    data?: ClothesItem[];
}

export interface ModdedClothesAddonParams {
    clothes: AddClothesItem[];
}

export function checkAddClothesItem(a: any): a is AddClothesItem {
    return a
        && typeof a === 'object'
        && typeof a.key === 'string'
        && typeof a.filePath === 'string';
}

export function checkParams(a: any): a is ModdedClothesAddonParams {
    return a && a.clothes && isArray(a.clothes) && every(a.clothes, checkAddClothesItem);
}
