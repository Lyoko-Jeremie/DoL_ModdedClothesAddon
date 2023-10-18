import type {AddonPluginHookPointEx} from "../../../dist-BeforeSC2/AddonPlugin";
import type {LifeTimeCircleHook, LogWrapper} from "../../../dist-BeforeSC2/ModLoadController";
import type {ModBootJsonAddonPlugin, ModInfo} from "../../../dist-BeforeSC2/ModLoader";
import type {ModZipReader} from "../../../dist-BeforeSC2/ModZipReader";
import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import JSZip from "jszip";
import * as JSON5 from "json5";
import {get, set, has, isString, isArray, every, isNil} from 'lodash';
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
            if (!data) {
                console.error('[ModdedClothesAddon] registerMod() clothes data file not found', [addonName, mod, pp, c]);
                this.logger.error(`[ModdedClothesAddon] registerMod() clothes data file not found: addon[${addonName}] file[${c.filePath}]`);
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
                const ck = clothe.key;
                const c = get(window.DOL.setup.clothes, ck) as ClothesItem[];
                if (isArray(c)) {
                    console.log(`window.DOL.setup.clothes.${ck}`, c);
                    this.changedPaths.add(ck);
                    for (const d of clothe.data) {
                        d.index = c.length;
                        c.push(d);
                    }
                } else {
                    console.error(`[ModdedClothesAddon] window.setup.clothes.${ck} not found. mod[${info.modName}]`, [c]);
                    this.logger.error(`[ModdedClothesAddon] window.setup.clothes.${ck} not found. mod[${info.modName}]`);
                }
            }
            this.logger.log(`[ModdedClothesAddon] patch mod[${info.modName}] ok.`);
        }
    }

}
