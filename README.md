# ModdedClothesAddon

the addon version of [suin14/moddedClothes_mod](https://github.com/suin14/moddedClothes_mod)

---

`ModdedClothesAddon` : `ModdedClothesAddon`

```json lines
{
  "additionFile": [
    "aaa/feet.json"
  ],
  "addonPlugin": [
    {
      "modName": "ModdedClothesAddon",
      "addonName": "ModdedClothesAddon",
      "modVersion": "^1.1.0",
      "params": {
        "clothes": [
          {
            // 要添加的衣服的分类，对应到 `setup.clothes.xxx`。 例如这里写 `feet` 那么就会添加到 `setup.clothes.feet`
            // the category of the clothes that want to add, it will add to `setup.clothes.xxx`. For example, if you write `feet` here, it will add to `setup.clothes.feet`
            "key": "feet",
            // 要添加的衣服数组数据所在的文件(zip路径)，JSON5格式
            // 别忘了在打包时打包这个文件。如果你使用打包器，请添加到 additionFile 列表中
            // the file(zip path) that the array data of the clothes that want to add. JSON5 format
            // don't forget to pack this file when you pack. If you use packer, please add it to the additionFile list
            "filePath": "path/to/feet.json"
          },
          {
            "key": "over_upper",
            "filePath": "path/to/over_upper.json"
          },
          {
            "key": "over_lower",
            "filePath": "path/to/over_lower.json"
          }
        ]
      }
    },
    {     // 对于需要添加图片的情况，请别忘了添加这个addon标识来让图片加载器加载衣服的图片
          // ModdedClothesAddon不实现导入图片的功能，导入图片的工作交由ImageLoaderAddon来完成。所以请别忘了按照ImageLoaderAddon的规则来添加图片
          // for the case that need to add image, please don't forget to add this addon mark to let the image loader load the image of the clothes
          // ModdedClothesAddon don't implement the function of import image, the work of import image is completed by ImageLoaderAddon. 
          // So please don't forget to add image according to the rules of ImageLoaderAddon
      "modName": "ModLoader DoL ImageLoaderHook",
      "addonName": "ImageLoaderAddon",
      "modVersion": "^2.3.0",
      "params": [
      ]
    }
  ],
  "dependenceInfo": [
    {
      "modName": "ModdedClothesAddon",
      "version": "^1.1.0"
    },
    {
      "modName": "ModLoader DoL ImageLoaderHook",
      "version": "^2.3.0"
    }
  ]
}
```

下面是 `feet.json` 的例子:  
follow is the example of `feet.json`:  

```json5
[
  {
    "index": 4,
    "name": "ansandals",
    "name_cap": "ansandals", "cn_name_cap": "更好的凉鞋",
    "variable": "ansandals",
    "integrity": 100,
    "integrity_max": 100,
    "fabric_strength": 20,
    "reveal": 1,
    "word": "n",
    "plural": 1,
    "colour": 0,
    "colour_options": ["black", "blue", "brown", "green", "pink", "purple", "red", "tangerine", "teal", "white", "yellow", "custom"],
    "colour_sidebar": 1,
    "type": ["school", "normal"],
    "gender": "n",
    "warmth": 0,
    "cost": 2000,
    "description": "在夏天穿着很清凉。",
    "shop": ["clothing"],
    "accessory": 1,
    "accessory_colour": 0,
    "accessory_colour_options": [],
    "accessory_colour_combat": "brown",
    "cursed": 0,
    "location": 0,
    "iconFile": "ansandals.png",
    "accIcon": 0
  }
]
```
