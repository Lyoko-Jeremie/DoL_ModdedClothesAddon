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
        ],
        "patch": [
          // 对现有衣服（游戏原本衣服或者此mod之前的mod添加的衣服）打补丁，可以修改或删除衣服的属性
          "path/to/patch_file1.json",
          "path/to/patch_file2.json",
          "path/to/patch_file3.json"
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

NOTE:  
`index` 字段会在注入时重新根据游戏数据计算并覆盖填充，所以可以随便填写。  
the `index` field will be recalculated and overwritten according to the game data when injected, so you can fill in it as your like.  


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

下面是 `patch_file.json` 的例子：
follow is the example of `patch_file.json`:

```json lines
[
  // 同一个文件可以修改多个分类的衣服
  // a file can modify clothes of multiple categories
  {
    // 衣服所在的分类，对应到 `setup.clothes.xxx`。 例如这里写 `feet` 那么就会修改 `setup.clothes.feet` 下的内容
    // the category of the clothes that want to modify, it will modify the content under `setup.clothes.xxx`. For example, if you write `feet` here, it will modify the content under `setup.clothes.feet`
    "key": "feet",
    "data": [
      {
        // 必填：衣服的 `name` 字段，用来定位要修改的衣服
        // required: the `name` field of the clothes, used to locate the clothes to be modified
        "name": "ansandals",
        // 可选: 如果存在一个字段，则会覆盖
        // optional: if a field exists, it will be overwritten
        "cost": 1,
        // 可选: 如果不存在一个字段，则会添加
        // optional: if a field does not exist, it will be added
        "meow": true,
        // 可选: 如果填写为 null，则会删除
        // optional: if fill in as null, it will be deleted
        "mask_img": null
        // 除`name`以外其他所有字段都是可选的，可以不出现，不出现的字段不会修改
        // all fields except `name` are optional, they can be omitted, and the fields that are not omitted will not be modified
      }
    ]
  }
]
```


---

### 请特别注意有关套装的温暖度计算问题

在服装的 `outfitPrimary: { [key: string]: string };` 和 `outfitSecondary: string[];` 两个可选项中的是用来计算套装温暖度的项。  
如果某件衣服是套装的一部分，可以在`outfitPrimary`中填写套装另一部分的类型和衣服名称，这样游戏在计算时就会把这两件衣服的温暖度合并计算。  
但同时，由于游戏的温暖度计算算法存在一点小问题，如果`outfitPrimary`或`outfitSecondary`中有不存在或者错误的项，那么就会导致游戏计算温暖度时报红色错误，提示`Cannot read properties of undefined (reading 'warmth')`。

本mod已经编写了额外的附加检查逻辑来在游戏加载时检查`outfitPrimary`和`outfitSecondary`中的项是否有对应衣服存在，如果不存在则会在ModLoader日志中报红色错误，以便提示开发者这里存在的问题。



