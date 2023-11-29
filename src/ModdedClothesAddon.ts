import type {AddonPluginHookPointEx} from "../../../dist-BeforeSC2/AddonPlugin";
import type {LifeTimeCircleHook, LogWrapper} from "../../../dist-BeforeSC2/ModLoadController";
import type {ModBootJsonAddonPlugin, ModInfo} from "../../../dist-BeforeSC2/ModLoader";
import type {ModZipReader} from "../../../dist-BeforeSC2/ModZipReader";
import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import JSZip from "jszip";
import * as JSON5 from "json5";
import {get, set, has, isString, isArray, every, isNil, isSafeInteger} from 'lodash';
import {AddClothesItem, checkParams} from "./ModdedClothesAddonParams";
import type {ClothesItem} from "./winDef";

export interface ClothesInfo {
    key: string;
    data: ClothesItem[];
}

export interface ClothesAddInfo {
    modName: string;
    clothes: ClothesInfo[];
}

export class ModdedClothesAddon implements LifeTimeCircleHook, AddonPluginHookPointEx {
    logger: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
        this.logger = gModUtils.getLogger();
        this.gSC2DataManager.getModLoadController().addLifeTimeCircleHook('ModdedClothesAddon', this);
        this.gModUtils.getAddonPluginManager().registerAddonPlugin(
            'ModdedClothesAddon',
            'ModdedClothesAddon',
            this,
        );
        // we must init it in first passage init
        this.gSC2DataManager.getSc2EventTracer().addCallback({
            whenSC2PassageInit: () => {
                if (this.isInit) {
                    return;
                }
                this.isInit = true;
                this.init();
            },
        });
    }

    isInit = false;

    changedPaths: Set<string> = new Set<string>();
    clothesAddInfo: Map<string, ClothesAddInfo> = new Map<string, ClothesAddInfo>();

    async registerMod(addonName: string, mod: ModInfo, modZip: ModZipReader) {
        if (!mod) {
            console.error('registerMod() (!mod)', [addonName, mod]);
            this.logger.error(`registerMod() (!mod): addon[${addonName}] mod[${mod}]`);
            return;
        }
        const pp = mod.bootJson.addonPlugin?.find((T: ModBootJsonAddonPlugin) => {
            return T.modName === 'ModdedClothesAddon'
                && T.addonName === 'ModdedClothesAddon';
        })?.params;
        if (!checkParams(pp)) {
            console.error('[ModdedClothesAddon] registerMod() ParamsInvalid', [addonName, mod, pp]);
            this.logger.error(`[ModdedClothesAddon] registerMod() ParamsInvalid: addon[${addonName}]`);
            return;
        }
        for (const c of pp.clothes) {
            const data = await modZip.zip.file(c.filePath)?.async('string');
            if (isNil(data)) {
                console.error('[ModdedClothesAddon] registerMod() clothes data file not found', [addonName, mod, pp, c]);
                this.logger.error(`[ModdedClothesAddon] registerMod() clothes data file not found: addon[${addonName}] file[${c.filePath}]`);
                continue;
            }
            if (!data) {
                console.error('[ModdedClothesAddon] registerMod() clothes data file empty', [addonName, mod, pp, c]);
                this.logger.error(`[ModdedClothesAddon] registerMod() clothes data file empty: addon[${addonName}] file[${c.filePath}]`);
                continue;
            }
            try {
                c.data = JSON5.parse(data);
                if (!c.data || !isArray(c.data)) {
                    console.error('[ModdedClothesAddon] registerMod() clothes data invalid', [addonName, mod, pp, c]);
                    this.logger.error(`[ModdedClothesAddon] registerMod() clothes data invalid: addon[${addonName}] file[${c.filePath}]`);
                    continue;
                }
            } catch (e) {
                console.error('[ModdedClothesAddon] registerMod() clothes data invalid', [addonName, mod, pp, c]);
                this.logger.error(`[ModdedClothesAddon] registerMod() clothes data invalid: addon[${addonName}] file[${c.filePath}]`);
                continue;
            }
        }
        const cc = pp.clothes.map((T: AddClothesItem) => {
            return {
                key: T.key,
                data: T.data,
            };
        }).filter((T): T is ClothesInfo => isArray(T.data))
        this.addClothes({
            modName: mod.name,
            clothes: cc,
        });
    }

    async exportDataZip(zip: JSZip): Promise<JSZip> {
        for (const ck of this.changedPaths) {
            zip.file(`ModdedClothesAddon/setup/clothes/${ck}`, JSON.stringify(get(window.DOL.setup.clothes, ck), undefined, 2));
        }
        return zip;
    }

    addClothes(info: ClothesAddInfo) {
        if (this.isInit) {
            console.error('[ModdedClothesAddon] addClothes() must add before init.', [info]);
            this.logger.error(`[ModdedClothesAddon] addClothes() must add before init [${info.modName}].`);
            return;
        }
        if (!info || !info.clothes || !isArray(info.clothes) ||
            !every(info.clothes, T => T.key && isString(T.key) && T.data && isArray(T.data))) {
            console.error('[ModdedClothesAddon] addClothes() invalid info.', [info]);
            this.logger.error(`[ModdedClothesAddon] addClothes() invalid info [${info.modName}].`);
            return;
        }
        if (this.clothesAddInfo.has(info.modName)) {
            console.error('[ModdedClothesAddon] addClothes() already added.', [info]);
            this.logger.error(`[ModdedClothesAddon] addClothes() already added [${info.modName}].`);
            return;
        }
        this.clothesAddInfo.set(info.modName, info);
    }

    init() {
        if (!has(window, 'DOL.setup.clothes')) {
            console.error('[ModdedClothesAddon] window.DOL.setup.clothes not found');
            this.logger.error(`[ModdedClothesAddon] window.DOL.setup.clothes not found`);
            return;
        }
        for (const info of this.clothesAddInfo.values()) {
            for (const clothe of info.clothes) {
                try {
                    const ck = clothe.key;
                    let c = get(window.DOL.setup.clothes, ck) as ClothesItem[] | undefined;
                    if (isArray(c) || isNil(c)) {
                        if (!isArray(c)) {
                            console.warn(`[ModdedClothesAddon] window.setup.clothes.${ck} not found. mod[${info.modName}]. will add it.`, [c]);
                            this.logger.warn(`[ModdedClothesAddon] window.setup.clothes.${ck} not found. mod[${info.modName}]. will add it.`);
                            set(window.DOL.setup.clothes, ck, []);
                            c = get(window.DOL.setup.clothes, ck) as ClothesItem[] | undefined;
                            if (!isArray(c)) {
                                // never go there
                                console.error(`[ModdedClothesAddon] window.setup.clothes.${ck} invalid. never go there`, [c]);
                                this.logger.error(`[ModdedClothesAddon] window.setup.clothes.${ck} invalid. never go there`);
                                continue;
                            }
                        }
                        console.log(`window.DOL.setup.clothes.${ck}`, c);
                        this.changedPaths.add(ck);
                        for (const d of clothe.data) {
                            d.index = c.length;
                            c.push(d);
                        }
                    } else {
                        console.error(`[ModdedClothesAddon] window.setup.clothes.${ck} invalid. mod[${info.modName}]`, [c]);
                        this.logger.error(`[ModdedClothesAddon] window.setup.clothes.${ck} invalid. mod[${info.modName}]`);
                    }
                } catch (e: Error | any) {
                    console.error(`[ModdedClothesAddon] patch mod[${info.modName}] failed.`, [e]);
                    this.logger.error(`[ModdedClothesAddon] patch mod[${info.modName}] failed. error[${e?.message ? e.message : e}]`);
                }
            }
            this.logger.log(`[ModdedClothesAddon] patch mod[${info.modName}] ok.`);
        }
        try {
            checkForOutfitWarmth(this.logger);
        } catch (e: Error | any) {
            console.error('[ModdedClothesAddon] checkForOutfitWarmth() error.', e);
            this.logger.error(`[ModdedClothesAddon] checkForOutfitWarmth() error. error[${e?.message ? e.message : e}]`);
        }
        console.log('[ModdedClothesAddon] init() end.');
        this.logger.log(`[ModdedClothesAddon] init() end.`);
    }

}

export function searchClothesByName(name: string) {
    const r: { c: ClothesItem, t: string }[] = [];
    for (const key of Object.keys(window.DOL.setup.clothes)) {
        const ccc: ClothesItem[] = window.DOL.setup.clothes[key];
        if (!isArray(ccc)) {
            continue;
        }
        for (const c of ccc) {
            if (c.name === name) {
                r.push({
                    c: c,
                    t: key,
                });
            }
        }
    }
    return r;
}

/**
 * do the check for `window.getTrueWarmth()`
 */
export function checkForOutfitWarmth(logger: LogWrapper) {
    for (const key of Object.keys(window.DOL.setup.clothes)) {
        const ccc: ClothesItem[] = window.DOL.setup.clothes[key];
        if (!isArray(ccc)) {
            console.error('[ModdedClothesAddon] checkForOutfitWarmth() invalid window.DOL.setup.clothes', [key, ccc]);
            logger.error(`[ModdedClothesAddon] checkForOutfitWarmth() invalid window.DOL.setup.clothes [${key}]`);
            continue;
        }
        for (const c of ccc) {
            if (!c) {
                console.error('[ModdedClothesAddon] checkForOutfitWarmth() invalid window.DOL.setup.clothes', [key, ccc, c]);
                logger.error(`[ModdedClothesAddon] checkForOutfitWarmth() invalid window.DOL.setup.clothes [${key}]`);
                continue;
            }
            if (c.outfitPrimary) {
                for (const k of Object.keys(c.outfitPrimary)) {
                    if (c.outfitPrimary[k] === "broken" || c.outfitPrimary[k] === "split") {
                        continue;
                    }
                    if (!window.DOL.setup.clothes[k]) {
                        console.error('[ModdedClothesAddon] checkForOutfitWarmth() cannot find clothes type window.DOL.setup.clothes', [key, ccc, c, k]);
                        logger.error(`[ModdedClothesAddon] checkForOutfitWarmth() cannot find clothes type window.DOL.setup.clothes type[${key}] cloths[${c.name}] need type[${k}]`);
                        continue;
                    }
                    const item = window.DOL.setup.clothes[k]?.find((z: ClothesItem) => z.name === c.outfitPrimary[k] && z.modder === c.modder);
                    if (!item) {
                        console.error('[ModdedClothesAddon] checkForOutfitWarmth() cannot find cloths outfitPrimary', [key, ccc, c, k, c.outfitPrimary[k]]);
                        logger.error(`[ModdedClothesAddon] checkForOutfitWarmth() cannot find cloths outfitPrimary [${key}] cloths[${c.name}] need type[${k}] cloths[${c.outfitPrimary[k]}]`);
                        const r = searchClothesByName(c.outfitPrimary[k]);
                        if (r.length > 0) {
                            console.warn('[ModdedClothesAddon] checkForOutfitWarmth() some cloths[${c.name}] find from other type. maybe the type is wrong ? ', [r]);
                            logger.warn(`[ModdedClothesAddon] checkForOutfitWarmth() some cloths[${c.name}] find from other type [${r.map(T => T.t).join(',')}] . maybe the type is wrong ? `);
                        } else {
                            console.warn('[ModdedClothesAddon] checkForOutfitWarmth() never find a cloth have this name, maybe you forgot add it or write a wrong name ?');
                            logger.warn(`[ModdedClothesAddon] checkForOutfitWarmth() never find a cloth have this name, maybe you forgot add it or write a wrong name ?`);
                        }
                        continue;
                    }
                }
            }
            if (c.outfitSecondary) {
                if (c.outfitSecondary.length % 2 !== 0) {
                    console.error('[ModdedClothesAddon] checkForOutfitWarmth() bad outfitSecondary', [key, ccc, c, c.outfitSecondary]);
                    logger.error(`[ModdedClothesAddon] checkForOutfitWarmth() bad outfitSecondary [${key}] cloths[${c.name}], [${c.outfitSecondary.join(', ')}]`);
                    continue;
                }
                c.outfitSecondary.forEach((k, i) => {
                    if (i % 2 === 0 && c.outfitSecondary[i + 1] !== "broken" && c.outfitSecondary[i + 1] !== "split") {
                        if (!window.DOL.setup.clothes[k]) {
                            console.error('[ModdedClothesAddon] checkForOutfitWarmth() cannot find clothes type window.DOL.setup.clothes', [key, ccc, c, k]);
                            logger.error(`[ModdedClothesAddon] checkForOutfitWarmth() cannot find clothes type window.DOL.setup.clothes type[${key}] cloths[${c.name}] need type[${k}]`);
                            return;
                        }
                        const item = window.DOL.setup.clothes[k].find((z: ClothesItem) => z.name === c.outfitSecondary[i + 1] && z.modder === c.modder);
                        if (!item) {
                            console.error('[ModdedClothesAddon] checkForOutfitWarmth() cannot find cloths outfitSecondary', [key, ccc, c, k, c.outfitSecondary[i + 1], c.modder]);
                            logger.error(`[ModdedClothesAddon] checkForOutfitWarmth() cannot find cloths outfitSecondary [${key}] cloths[${c.name}] need type[${k}] cloths[${c.outfitSecondary[i + 1]}] modder[${c.modder}]`);
                            const r = searchClothesByName(c.outfitSecondary[i + 1]);
                            if (r.length > 0) {
                                console.warn('[ModdedClothesAddon] checkForOutfitWarmth() some cloths[${c.name}] find from other type. maybe the type is wrong ? ', [r]);
                                logger.warn(`[ModdedClothesAddon] checkForOutfitWarmth() some cloths[${c.name}] find from other type [${r.map(T => T.t).join(',')}] . maybe the type is wrong ? `);
                            } else {
                                console.warn('[ModdedClothesAddon] checkForOutfitWarmth() never find a cloth have this name, maybe you forgot add it or write a wrong name ?');
                                logger.warn(`[ModdedClothesAddon] checkForOutfitWarmth() never find a cloth have this name, maybe you forgot add it or write a wrong name ?`);
                            }
                            return;
                        }
                    }
                });
            }
        }
    }
}

// for outfits it adds the lower piece's warmth too
function getTrueWarmth(item: ClothesItem, setup = window.DOL.setup) {
    let warmth = item.warmth || 0;

    if (item.outfitPrimary) {
        // sum of warmth of every secondary piece
        // outfitPrimary looks like this {'lower': 'item_name', 'head': 'item_name'}
        warmth += Object.keys(item.outfitPrimary) // loop through secondary items list
            .filter(x => item.outfitPrimary[x] !== "broken" && item.outfitPrimary[x] !== "split") // filter out broken pieces
            .map(x => setup.clothes[x].find((z: ClothesItem) => z.name === item.outfitPrimary[x] && z.modder === item.modder)) // find items in setup.clothes
            .reduce((sum, x) => sum + (x.warmth || 0), 0); // calculate sum of their warmth field
    }

    if (item.outfitSecondary) {
        if (item.outfitSecondary.length % 2 !== 0) console.log("WARNING: " + item.name + " has bad .outfitSecondary data!");

        // outfitSecondary looks like this ['upper', 'item_name', 'head', 'item_name']
        item.outfitSecondary.forEach((x, i) => {
            if (i % 2 === 0 && item.outfitSecondary[i + 1] !== "broken" && item.outfitSecondary[i + 1] !== "split") {
                warmth += setup.clothes[x].find((z: ClothesItem) => z.name === item.outfitSecondary[i + 1] && z.modder === item.modder).warmth || 0;
            }
        });
    }

    return warmth;
}

// window.getTrueWarmth = getTrueWarmth;
