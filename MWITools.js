// ==UserScript==
// @name         MWITools
// @namespace    http://tampermonkey.net/
// @version      3.8
// @description  Tools for MilkyWayIdle. Shows total action time. Shows market prices. Shows action number quick inputs. Shows how many actions are needed to reach certain skill level. Shows skill exp percentages. Shows total networth. Shows combat summary. Shows combat maps index. Shows item level on item icons. Shows how many ability books are needed to reach certain level.
// @author       bot7420
// @match        https://www.milkywayidle.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// ==/UserScript==

/* 汉化插件必须使用 bot7420 修改版，否则不支持 */
/* 市场价格数据是24小时均价，大约每半小时更新一次，需要科学网络，否则使用的是旧数据 */
/* 价格 "/" 前后数字，前者是卖单价，后者是买单价 */
/* 带强化等级的装备没有市场价格数据 */
/* 如果有问题，关闭其它插件试试，可能有冲突 */
/* 仅在电脑浏览器上维护，不保证手机使用 */
/* MWITools 版本更新发布在: https://greasyfork.org/en/scripts/494467-mwitools */
/* 作者的另一个插件: https://greasyfork.org/en/scripts/494468-mooneycalc-importer */
/* 作者的批量战斗模拟网站: http://43.129.194.214:5000/mwisim.github.io */
/* 作者的游戏内名字: bot7420 */

(() => {
    "use strict";
    const MARKET_JSON_LOCAL_BACKUP = `{"time":1715547603,"market":{"Amber":{"ask":6600,"bid":6200},"Amethyst":{"ask":94000,"bid":90000},"Apple":{"ask":6,"bid":5},"Apple Gummy":{"ask":16,"bid":10},"Apple Yogurt":{"ask":260,"bid":72},"Aqua Arrow":{"ask":22500,"bid":20500},"Aqua Essence":{"ask":28,"bid":18},"Arabica Coffee Bean":{"ask":125,"bid":115},"Arcane Bow":{"ask":250000,"bid":150000},"Arcane Crossbow":{"ask":230000,"bid":160000},"Arcane Fire Staff":{"ask":280000,"bid":-1},"Arcane Log":{"ask":260,"bid":205},"Arcane Lumber":{"ask":880,"bid":820},"Arcane Nature Staff":{"ask":270000,"bid":190000},"Arcane Water Staff":{"ask":280000,"bid":-1},"Artisan Tea":{"ask":680,"bid":540},"Attack Coffee":{"ask":500,"bid":360},"Azure Boots":{"ask":-1,"bid":12500},"Azure Brush":{"ask":49000,"bid":2100},"Azure Buckler":{"ask":11500,"bid":-1},"Azure Bulwark":{"ask":50000,"bid":-1},"Azure Cheese":{"ask":295,"bid":250},"Azure Chisel":{"ask":25500,"bid":-1},"Azure Enhancer":{"ask":49000,"bid":-1},"Azure Gauntlets":{"ask":35000,"bid":20500},"Azure Hammer":{"ask":21500,"bid":-1},"Azure Hatchet":{"ask":50000,"bid":-1},"Azure Helmet":{"ask":42000,"bid":14500},"Azure Mace":{"ask":-1,"bid":9600},"Azure Milk":{"ask":88,"bid":60},"Azure Needle":{"ask":21000,"bid":-1},"Azure Plate Body":{"ask":46000,"bid":16000},"Azure Plate Legs":{"ask":52000,"bid":16500},"Azure Pot":{"ask":30000,"bid":-1},"Azure Shears":{"ask":19500,"bid":-1},"Azure Spatula":{"ask":46000,"bid":2100},"Azure Spear":{"ask":-1,"bid":18500},"Azure Sword":{"ask":48000,"bid":-1},"Bamboo Boots":{"ask":41000,"bid":-1},"Bamboo Branch":{"ask":46,"bid":36},"Bamboo Fabric":{"ask":300,"bid":270},"Bamboo Gloves":{"ask":26500,"bid":-1},"Bamboo Hat":{"ask":15000,"bid":-1},"Bamboo Robe Bottoms":{"ask":20000,"bid":10000},"Bamboo Robe Top":{"ask":34000,"bid":-1},"Bear Essence":{"ask":70,"bid":56},"Beast Boots":{"ask":29000,"bid":-1},"Beast Bracers":{"ask":34000,"bid":-1},"Beast Chaps":{"ask":80000,"bid":30000},"Beast Hide":{"ask":21,"bid":20},"Beast Hood":{"ask":100000,"bid":30000},"Beast Leather":{"ask":300,"bid":265},"Beast Tunic":{"ask":185000,"bid":30000},"Berserk":{"ask":350000,"bid":310000},"Birch Bow":{"ask":28000,"bid":-1},"Birch Crossbow":{"ask":-1,"bid":-1},"Birch Fire Staff":{"ask":45000,"bid":800},"Birch Log":{"ask":62,"bid":56},"Birch Lumber":{"ask":265,"bid":100},"Birch Nature Staff":{"ask":22500,"bid":860},"Birch Water Staff":{"ask":28000,"bid":-1},"Black Bear Fluff":{"ask":50000,"bid":46000},"Black Bear Shoes":{"ask":440000,"bid":60000},"Black Tea Leaf":{"ask":26,"bid":21},"Blackberry":{"ask":32,"bid":24},"Blackberry Cake":{"ask":360,"bid":320},"Blackberry Donut":{"ask":330,"bid":90},"Blessed Tea":{"ask":840,"bid":700},"Blueberry":{"ask":27,"bid":20},"Blueberry Cake":{"ask":190,"bid":92},"Blueberry Donut":{"ask":175,"bid":82},"Brewing Tea":{"ask":49,"bid":22},"Burble Brush":{"ask":62000,"bid":10000},"Burble Buckler":{"ask":16000,"bid":-1},"Burble Bulwark":{"ask":29500,"bid":-1},"Burble Chisel":{"ask":45000,"bid":25500},"Burble Enhancer":{"ask":62000,"bid":5200},"Burble Gauntlets":{"ask":45000,"bid":20000},"Burble Hatchet":{"ask":64000,"bid":25000},"Burble Helmet":{"ask":54000,"bid":25000},"Burble Mace":{"ask":49000,"bid":25000},"Burble Needle":{"ask":38000,"bid":25000},"Burble Plate Body":{"ask":80000,"bid":13500},"Burble Pot":{"ask":66000,"bid":25000},"Burble Shears":{"ask":54000,"bid":-1},"Burble Spatula":{"ask":66000,"bid":25000},"Burble Sword":{"ask":-1,"bid":31000},"Burble Tea Leaf":{"ask":98,"bid":76},"Cedar Bow":{"ask":56000,"bid":-1},"Cedar Fire Staff":{"ask":30000,"bid":-1},"Cedar Log":{"ask":94,"bid":32},"Cedar Lumber":{"ask":330,"bid":300},"Cedar Water Staff":{"ask":45000,"bid":-1},"Centaur Boots":{"ask":1500000,"bid":-1},"Centaur Hoof":{"ask":150000,"bid":125000},"Cheese Boots":{"ask":-1,"bid":-1},"Cheese Brush":{"ask":6400,"bid":120},"Cheese Buckler":{"ask":960,"bid":-1},"Cheese Chisel":{"ask":3900,"bid":1850},"Cheese Enhancer":{"ask":2450,"bid":115},"Cheese Gauntlets":{"ask":2500,"bid":-1},"Cheese Hammer":{"ask":3600,"bid":160},"Cheese Helmet":{"ask":25000,"bid":-1},"Cheese Mace":{"ask":6800,"bid":-1},"Cheese Plate Body":{"ask":17500,"bid":150},"Cheese Plate Legs":{"ask":14000,"bid":-1},"Cheese Pot":{"ask":3900,"bid":360},"Cheese Spatula":{"ask":4300,"bid":720},"Cheese Spear":{"ask":18000,"bid":1000},"Cheese Sword":{"ask":6800,"bid":175},"Cleave":{"ask":130000,"bid":90000},"Cocoon":{"ask":150,"bid":115},"Coin":{"ask":-1,"bid":-1},"Cotton":{"ask":12,"bid":9},"Cotton Boots":{"ask":880,"bid":-1},"Cotton Fabric":{"ask":195,"bid":70},"Cotton Hat":{"ask":1250,"bid":-1},"Cotton Robe Bottoms":{"ask":7800,"bid":-1},"Cotton Robe Top":{"ask":-1,"bid":-1},"Crab Pincer":{"ask":15000,"bid":14000},"Crafting Tea":{"ask":680,"bid":44},"Crimson Boots":{"ask":38000,"bid":-1},"Crimson Buckler":{"ask":96000,"bid":-1},"Crimson Bulwark":{"ask":34000,"bid":-1},"Crimson Cheese":{"ask":390,"bid":300},"Crimson Enhancer":{"ask":50000,"bid":11000},"Crimson Gauntlets":{"ask":100000,"bid":30000},"Crimson Hammer":{"ask":50000,"bid":40000},"Crimson Helmet":{"ask":44000,"bid":38000},"Crimson Mace":{"ask":94000,"bid":50000},"Crimson Milk":{"ask":80,"bid":62},"Crimson Plate Body":{"ask":82000,"bid":47000},"Crimson Plate Legs":{"ask":80000,"bid":-1},"Crimson Pot":{"ask":58000,"bid":40000},"Crimson Spatula":{"ask":78000,"bid":40000},"Crimson Spear":{"ask":250000,"bid":70000},"Crimson Sword":{"ask":150000,"bid":70000},"Crushed Amber":{"ask":420,"bid":360},"Crushed Amethyst":{"ask":6200,"bid":5200},"Crushed Garnet":{"ask":1100,"bid":980},"Crushed Moonstone":{"ask":1800,"bid":1750},"Crushed Pearl":{"ask":1300,"bid":1000},"Cupcake":{"ask":195,"bid":105},"Donut":{"ask":150,"bid":39},"Dragon Fruit":{"ask":130,"bid":115},"Dragon Fruit Gummy":{"ask":410,"bid":370},"Earrings Of Armor":{"ask":4900000,"bid":1050000},"Earrings Of Gathering":{"ask":3800000,"bid":110000},"Earrings Of Regeneration":{"ask":6200000,"bid":3200000},"Earrings Of Resistance":{"ask":3500000,"bid":500000},"Efficiency Tea":{"ask":640,"bid":580},"Elemental Affinity":{"ask":620000,"bid":560000},"Emp Tea Leaf":{"ask":94,"bid":82},"Enhancing Tea":{"ask":275,"bid":190},"Excelsa Coffee Bean":{"ask":280,"bid":265},"Eyessence":{"ask":56,"bid":38},"Fieriosa Coffee Bean":{"ask":220,"bid":215},"Fireball":{"ask":11500,"bid":11000},"Flame Arrow":{"ask":19500,"bid":17500},"Flame Blast":{"ask":155000,"bid":145000},"Flaming Cloth":{"ask":41000,"bid":39000},"Flaming Robe Top":{"ask":470000,"bid":80000},"Flax":{"ask":90,"bid":35},"Foraging Tea":{"ask":350,"bid":45},"Garnet":{"ask":17000,"bid":15000},"Gathering Tea":{"ask":370,"bid":280},"Giant Pouch":{"ask":6000000,"bid":5200000},"Ginkgo Bow":{"ask":92000,"bid":-1},"Ginkgo Crossbow":{"ask":100000,"bid":-1},"Ginkgo Log":{"ask":62,"bid":50},"Ginkgo Lumber":{"ask":490,"bid":280},"Ginkgo Nature Staff":{"ask":92000,"bid":-1},"Gobo Boomstick":{"ask":20500,"bid":-1},"Gobo Boots":{"ask":40000,"bid":10500},"Gobo Bracers":{"ask":25000,"bid":-1},"Gobo Essence":{"ask":41,"bid":28},"Gobo Hide":{"ask":17,"bid":13},"Gobo Hood":{"ask":24000,"bid":-1},"Gobo Shooter":{"ask":20500,"bid":-1},"Gobo Slasher":{"ask":36000,"bid":20000},"Gobo Smasher":{"ask":20500,"bid":-1},"Gobo Tunic":{"ask":34000,"bid":30000},"Goggles":{"ask":50000,"bid":46000},"Golem Essence":{"ask":230,"bid":200},"Granite Bludgeon":{"ask":-1,"bid":39000000},"Green Tea Leaf":{"ask":25,"bid":13},"Grizzly Bear Fluff":{"ask":46000,"bid":42000},"Gummy":{"ask":380,"bid":42},"Heal":{"ask":210000,"bid":155000},"Holy Boots":{"ask":100000,"bid":-1},"Holy Buckler":{"ask":74000,"bid":-1},"Holy Bulwark":{"ask":205000,"bid":-1},"Holy Cheese":{"ask":840,"bid":780},"Holy Enhancer":{"ask":160000,"bid":125000},"Holy Gauntlets":{"ask":190000,"bid":-1},"Holy Hammer":{"ask":185000,"bid":130000},"Holy Helmet":{"ask":125000,"bid":-1},"Holy Mace":{"ask":270000,"bid":-1},"Holy Milk":{"ask":300,"bid":290},"Holy Plate Body":{"ask":290000,"bid":210000},"Holy Plate Legs":{"ask":-1,"bid":-1},"Holy Pot":{"ask":240000,"bid":105000},"Holy Spatula":{"ask":190000,"bid":155000},"Holy Spear":{"ask":200000,"bid":150000},"Holy Sword":{"ask":165000,"bid":160000},"Icy Cloth":{"ask":21500,"bid":17500},"Icy Robe Bottoms":{"ask":86000,"bid":60000},"Icy Robe Top":{"ask":120000,"bid":70000},"Jade":{"ask":35000,"bid":32000},"Jungle Essence":{"ask":54,"bid":27},"Large Artisan's Crate":{"ask":-1,"bid":-1},"Large Pouch":{"ask":960000,"bid":600000},"Large Treasure Chest":{"ask":-1,"bid":-1},"Liberica Coffee Bean":{"ask":230,"bid":210},"Linen Boots":{"ask":35000,"bid":680},"Linen Gloves":{"ask":13000,"bid":5000},"Linen Hat":{"ask":9800,"bid":-1},"Linen Robe Bottoms":{"ask":21000,"bid":1500},"Living Granite":{"ask":2400000,"bid":1950000},"Log":{"ask":25,"bid":18},"Lucky Coffee":{"ask":820,"bid":800},"Magic Coffee":{"ask":450,"bid":420},"Magnet":{"ask":125000,"bid":94000},"Magnifying Glass":{"ask":540000,"bid":310000},"Maim":{"ask":140000,"bid":72000},"Marsberry":{"ask":36,"bid":30},"Marsberry Donut":{"ask":490,"bid":460},"Medium Artisan's Crate":{"ask":-1,"bid":-1},"Medium Meteorite Cache":{"ask":-1,"bid":-1},"Medium Treasure Chest":{"ask":-1,"bid":-1},"Milk":{"ask":32,"bid":27},"Milking Tea":{"ask":300,"bid":125},"Minor Heal":{"ask":36000,"bid":6600},"Mooberry":{"ask":52,"bid":42},"Mooberry Cake":{"ask":360,"bid":290},"Mooberry Donut":{"ask":-1,"bid":215},"Moonstone":{"ask":43000,"bid":39000},"Necklace Of Efficiency":{"ask":-1,"bid":-1},"Necklace Of Wisdom":{"ask":7800000,"bid":5800000},"Orange Gummy":{"ask":25,"bid":21},"Orange Yogurt":{"ask":215,"bid":80},"Panda Gloves":{"ask":380000,"bid":-1},"Peach":{"ask":31,"bid":18},"Peach Gummy":{"ask":280,"bid":230},"Pearl":{"ask":16000,"bid":13000},"Pierce":{"ask":60000,"bid":48000},"Pincer Gloves":{"ask":48000,"bid":10000},"Plum":{"ask":68,"bid":56},"Plum Yogurt":{"ask":300,"bid":240},"Poke":{"ask":5200,"bid":5000},"Power Coffee":{"ask":520,"bid":420},"Precision":{"ask":39000,"bid":19000},"Purpleheart Bow":{"ask":78000,"bid":10000},"Purpleheart Crossbow":{"ask":-1,"bid":-1},"Purpleheart Fire Staff":{"ask":50000,"bid":-1},"Purpleheart Lumber":{"ask":400,"bid":300},"Purpleheart Nature Staff":{"ask":100000,"bid":-1},"Purpleheart Water Staff":{"ask":78000,"bid":-1},"Quick Shot":{"ask":4000,"bid":2800},"Radiant Fabric":{"ask":700,"bid":640},"Radiant Fiber":{"ask":125,"bid":100},"Radiant Gloves":{"ask":78000,"bid":-1},"Radiant Robe Bottoms":{"ask":180000,"bid":130000},"Radiant Robe Top":{"ask":185000,"bid":165000},"Rain Of Arrows":{"ask":260000,"bid":245000},"Rainbow Brush":{"ask":70000,"bid":30000},"Rainbow Buckler":{"ask":35000,"bid":-1},"Rainbow Bulwark":{"ask":66000,"bid":-1},"Rainbow Chisel":{"ask":120000,"bid":56000},"Rainbow Enhancer":{"ask":84000,"bid":54000},"Rainbow Gauntlets":{"ask":190000,"bid":25000},"Rainbow Hatchet":{"ask":120000,"bid":31000},"Rainbow Helmet":{"ask":84000,"bid":-1},"Rainbow Mace":{"ask":135000,"bid":-1},"Rainbow Needle":{"ask":115000,"bid":30000},"Rainbow Plate Body":{"ask":86000,"bid":62000},"Rainbow Plate Legs":{"ask":160000,"bid":-1},"Rainbow Shears":{"ask":115000,"bid":31000},"Rainbow Spatula":{"ask":120000,"bid":60000},"Rainbow Spear":{"ask":105000,"bid":74000},"Ranged Coffee":{"ask":560,"bid":470},"Ranger Necklace":{"ask":6000000,"bid":5000000},"Red Tea Leaf":{"ask":54,"bid":48},"Redwood Crossbow":{"ask":200000,"bid":-1},"Redwood Fire Staff":{"ask":86000,"bid":-1},"Redwood Log":{"ask":31,"bid":27},"Redwood Nature Staff":{"ask":-1,"bid":-1},"Redwood Water Staff":{"ask":88000,"bid":-1},"Reptile Boots":{"ask":7400,"bid":-1},"Reptile Chaps":{"ask":48000,"bid":1100},"Reptile Hide":{"ask":10,"bid":8},"Reptile Hood":{"ask":8200,"bid":-1},"Reptile Tunic":{"ask":18000,"bid":-1},"Ring Of Armor":{"ask":-1,"bid":1200000},"Ring Of Gathering":{"ask":5400000,"bid":1200000},"Ring Of Regeneration":{"ask":6400000,"bid":3600000},"Ring Of Resistance":{"ask":2650000,"bid":1600000},"Robusta Coffee Bean":{"ask":190,"bid":165},"Rough Bracers":{"ask":4000,"bid":-1},"Rough Chaps":{"ask":3000,"bid":-1},"Rough Hide":{"ask":68,"bid":43},"Rough Leather":{"ask":250,"bid":220},"Rough Tunic":{"ask":1000,"bid":-1},"Scratch":{"ask":4400,"bid":2900},"Silk Boots":{"ask":30000,"bid":-1},"Silk Fabric":{"ask":640,"bid":560},"Silk Gloves":{"ask":80000,"bid":-1},"Silk Robe Bottoms":{"ask":88000,"bid":58000},"Silk Robe Top":{"ask":245000,"bid":54000},"Smack":{"ask":8800,"bid":8000},"Small Meteorite Cache":{"ask":-1,"bid":-1},"Small Pouch":{"ask":17000,"bid":-1},"Snail Shell":{"ask":6600,"bid":3000},"Snail Shell Helmet":{"ask":13500,"bid":-1},"Snake Fang":{"ask":4400,"bid":2150},"Sorcerer Boots":{"ask":190000,"bid":100000},"Sorcerer Essence":{"ask":130,"bid":92},"Sorcerer's Sole":{"ask":66000,"bid":64000},"Spaceberry Cake":{"ask":960,"bid":920},"Spaceberry Donut":{"ask":700,"bid":660},"Spacia Coffee Bean":{"ask":490,"bid":470},"Stalactite Shard":{"ask":1800000,"bid":1450000},"Stalactite Spear":{"ask":-1,"bid":2050000},"Stamina Coffee":{"ask":350,"bid":290},"Star Fruit":{"ask":240,"bid":215},"Star Fruit Gummy":{"ask":640,"bid":600},"Star Fruit Yogurt":{"ask":860,"bid":820},"Strawberry Cake":{"ask":360,"bid":250},"Strawberry Donut":{"ask":390,"bid":205},"Stunning Blow":{"ask":480000,"bid":410000},"Super Attack Coffee":{"ask":1600,"bid":1100},"Super Brewing Tea":{"ask":500,"bid":100},"Super Cheesesmithing Tea":{"ask":2800,"bid":1850},"Super Crafting Tea":{"ask":3600,"bid":200},"Super Defense Coffee":{"ask":1700,"bid":1600},"Super Enhancing Tea":{"ask":2650,"bid":1200},"Super Foraging Tea":{"ask":4000,"bid":74},"Super Magic Coffee":{"ask":6800,"bid":6000},"Super Milking Tea":{"ask":1900,"bid":370},"Super Power Coffee":{"ask":2650,"bid":2300},"Super Stamina Coffee":{"ask":2000,"bid":1800},"Super Tailoring Tea":{"ask":6400,"bid":205},"Super Woodcutting Tea":{"ask":1550,"bid":640},"Sweep":{"ask":100000,"bid":80000},"Swiftness Coffee":{"ask":860,"bid":820},"Tailoring Tea":{"ask":520,"bid":72},"Tome Of The Elements":{"ask":320000,"bid":225000},"Toughness":{"ask":35000,"bid":34000},"Toxic Pollen":{"ask":175000,"bid":150000},"Turtle Shell Body":{"ask":12500,"bid":9000},"Turtle Shell Legs":{"ask":23000,"bid":6000},"Twilight Essence":{"ask":290,"bid":235},"Umbral Bracers":{"ask":88000,"bid":28000},"Umbral Chaps":{"ask":-1,"bid":-1},"Umbral Hide":{"ask":46,"bid":32},"Umbral Leather":{"ask":360,"bid":300},"Umbral Tunic":{"ask":185000,"bid":-1},"Vampire Fang":{"ask":1900000,"bid":1400000},"Vampirism":{"ask":40000,"bid":25000},"Verdant Boots":{"ask":-1,"bid":6600},"Verdant Brush":{"ask":8000,"bid":880},"Verdant Bulwark":{"ask":8200,"bid":-1},"Verdant Cheese":{"ask":215,"bid":185},"Verdant Chisel":{"ask":8000,"bid":3700},"Verdant Gauntlets":{"ask":9400,"bid":4900},"Verdant Hammer":{"ask":8000,"bid":600},"Verdant Hatchet":{"ask":34000,"bid":600},"Verdant Mace":{"ask":76000,"bid":9800},"Verdant Milk":{"ask":68,"bid":62},"Verdant Needle":{"ask":17500,"bid":560},"Verdant Plate Legs":{"ask":22000,"bid":12500},"Verdant Pot":{"ask":15500,"bid":1900},"Verdant Shears":{"ask":7800,"bid":720},"Verdant Spear":{"ask":22000,"bid":-1},"Verdant Sword":{"ask":22000,"bid":-1},"Vision Helmet":{"ask":48000,"bid":-1},"Water Strike":{"ask":16500,"bid":16000},"Werewolf Claw":{"ask":1100000,"bid":1000000},"Werewolf Slasher":{"ask":34000000,"bid":17000000},"Wisdom Coffee":{"ask":820,"bid":760},"Wisdom Tea":{"ask":640,"bid":540},"Wizard Necklace":{"ask":10000000,"bid":6000000},"Wooden Bow":{"ask":9600,"bid":-1},"Wooden Crossbow":{"ask":9600,"bid":-1},"Wooden Fire Staff":{"ask":10000,"bid":-1},"Wooden Water Staff":{"ask":5000,"bid":-1},"Yogurt":{"ask":275,"bid":60},"Burble Boots":{"ask":56000,"bid":20000},"Burble Cheese":{"ask":275,"bid":240},"Burble Hammer":{"ask":28500,"bid":25000},"Burble Milk":{"ask":98,"bid":78},"Cedar Nature Staff":{"ask":43000,"bid":2900},"Cheese":{"ask":145,"bid":96},"Cheese Bulwark":{"ask":4000,"bid":-1},"Cheese Hatchet":{"ask":9400,"bid":180},"Cheese Needle":{"ask":13500,"bid":130},"Cheese Shears":{"ask":14500,"bid":150},"Cheesesmithing Tea":{"ask":460,"bid":66},"Cooking Tea":{"ask":190,"bid":52},"Cotton Gloves":{"ask":1400,"bid":-1},"Cowbell":{"ask":-1,"bid":-1},"Crimson Brush":{"ask":76000,"bid":12000},"Crimson Chisel":{"ask":66000,"bid":41000},"Crimson Hatchet":{"ask":72000,"bid":43000},"Crimson Shears":{"ask":44000,"bid":-1},"Critical Coffee":{"ask":1700,"bid":1600},"Crushed Jade":{"ask":2600,"bid":1900},"Defense Coffee":{"ask":410,"bid":320},"Dragon Fruit Yogurt":{"ask":500,"bid":460},"Flaming Robe Bottoms":{"ask":370000,"bid":64000},"Frenzy":{"ask":90000,"bid":78000},"Gobo Leather":{"ask":310,"bid":205},"Holy Chisel":{"ask":195000,"bid":150000},"Holy Hatchet":{"ask":165000,"bid":94000},"Holy Needle":{"ask":185000,"bid":92000},"Holy Shears":{"ask":185000,"bid":150000},"Ice Spear":{"ask":86000,"bid":74000},"Intelligence Coffee":{"ask":360,"bid":275},"Linen Fabric":{"ask":300,"bid":215},"Linen Robe Top":{"ask":11000,"bid":-1},"Lumber":{"ask":190,"bid":105},"Mirror Of Protection":{"ask":5000000,"bid":4800000},"Moolong Tea Leaf":{"ask":64,"bid":50},"Orange":{"ask":19,"bid":6},"Panda Fluff":{"ask":48000,"bid":40000},"Peach Yogurt":{"ask":410,"bid":350},"Plum Gummy":{"ask":125,"bid":86},"Processing Tea":{"ask":820,"bid":660},"Purpleheart Log":{"ask":76,"bid":56},"Radiant Boots":{"ask":52000,"bid":-1},"Radiant Hat":{"ask":135000,"bid":105000},"Rainbow Boots":{"ask":165000,"bid":-1},"Rainbow Cheese":{"ask":400,"bid":370},"Rainbow Hammer":{"ask":105000,"bid":54000},"Rainbow Milk":{"ask":110,"bid":100},"Rainbow Pot":{"ask":86000,"bid":30000},"Rainbow Sword":{"ask":90000,"bid":70000},"Redwood Bow":{"ask":100000,"bid":-1},"Redwood Lumber":{"ask":190,"bid":130},"Reptile Bracers":{"ask":27500,"bid":-1},"Reptile Leather":{"ask":130,"bid":96},"Ring Of Rare Find":{"ask":4400000,"bid":3400000},"Rough Boots":{"ask":2350,"bid":-1},"Rough Hood":{"ask":72000,"bid":-1},"Shard Of Protection":{"ask":30000,"bid":29000},"Silk Hat":{"ask":92000,"bid":-1},"Small Artisan's Crate":{"ask":-1,"bid":-1},"Small Treasure Chest":{"ask":-1,"bid":-1},"Snake Fang Dirk":{"ask":4100,"bid":2500},"Spaceberry":{"ask":125,"bid":110},"Spike Shell":{"ask":180000,"bid":115000},"Star Fragment":{"ask":6400,"bid":6200},"Strawberry":{"ask":47,"bid":40},"Super Cooking Tea":{"ask":940,"bid":86},"Super Intelligence Coffee":{"ask":1950,"bid":1850},"Super Ranged Coffee":{"ask":3400,"bid":3200},"Swamp Essence":{"ask":21,"bid":20},"Tome Of Healing":{"ask":80000,"bid":40000},"Turtle Shell":{"ask":8000,"bid":2700},"Umbral Boots":{"ask":160000,"bid":-1},"Umbral Hood":{"ask":100000,"bid":-1},"Vampire Fang Dirk":{"ask":-1,"bid":22000000},"Verdant Buckler":{"ask":7400,"bid":-1},"Verdant Enhancer":{"ask":35000,"bid":560},"Verdant Helmet":{"ask":22500,"bid":3000},"Verdant Spatula":{"ask":16000,"bid":5800},"Vision Shield":{"ask":390000,"bid":100000},"Wheat":{"ask":20,"bid":18},"Woodcutting Tea":{"ask":400,"bid":190},"Wooden Nature Staff":{"ask":3900,"bid":150},"Cedar Crossbow":{"ask":39000,"bid":2600},"Earrings Of Rare Find":{"ask":4900000,"bid":3300000},"Egg":{"ask":21,"bid":18},"Entangle":{"ask":4400,"bid":2000},"Fighter Necklace":{"ask":9600000,"bid":-1},"Gator Vest":{"ask":6200,"bid":6000},"Ginkgo Fire Staff":{"ask":70000,"bid":-1},"Gobo Chaps":{"ask":27000,"bid":11000},"Gobo Stabber":{"ask":21000,"bid":-1},"Gourmet Tea":{"ask":380,"bid":280},"Grizzly Bear Shoes":{"ask":920000,"bid":68000},"Holy Brush":{"ask":185000,"bid":130000},"Large Meteorite Cache":{"ask":-1,"bid":-1},"Magnetic Gloves":{"ask":760000,"bid":460000},"Marsberry Cake":{"ask":540,"bid":500},"Medium Pouch":{"ask":165000,"bid":52000},"Polar Bear Fluff":{"ask":82000,"bid":80000},"Verdant Plate Body":{"ask":29500,"bid":12000},"Ginkgo Water Staff":{"ask":76000,"bid":-1},"Polar Bear Shoes":{"ask":-1,"bid":64000},"Sugar":{"ask":7,"bid":6},"Crimson Needle":{"ask":80000,"bid":-1},"Burble Plate Legs":{"ask":72000,"bid":40000},"Burble Spear":{"ask":-1,"bid":40000},"Arcane Shield":{"ask":165000,"bid":-1},"Birch Shield":{"ask":13000,"bid":-1},"Cedar Shield":{"ask":25000,"bid":-1},"Ginkgo Shield":{"ask":58000,"bid":-1},"Purpleheart Shield":{"ask":39000,"bid":-1},"Redwood Shield":{"ask":68000,"bid":22000},"Sighted Bracers":{"ask":760000,"bid":250000},"Spiked Bulwark":{"ask":52000000,"bid":410000},"Wooden Shield":{"ask":1950,"bid":96},"Advanced Task Ring":{"ask":-1,"bid":-1},"Basic Task Ring":{"ask":-1,"bid":-1},"Expert Task Ring":{"ask":-1,"bid":-1},"Purple's Gift":{"ask":-1,"bid":-1},"Task Crystal":{"ask":-1,"bid":-1},"Task Token":{"ask":-1,"bid":-1},"Abyssal Essence":{"ask":240,"bid":215},"Channeling Coffee":{"ask":700,"bid":660},"Chrono Gloves":{"ask":6800000,"bid":400000},"Chrono Sphere":{"ask":700000,"bid":560000},"Collector's Boots":{"ask":2500000,"bid":-1},"Colossus Core":{"ask":1050000,"bid":980000},"Colossus Plate Body":{"ask":13000000,"bid":8800000},"Colossus Plate Legs":{"ask":9000000,"bid":7400000},"Demonic Core":{"ask":1450000,"bid":1350000},"Demonic Plate Body":{"ask":16000000,"bid":8000000},"Demonic Plate Legs":{"ask":12500000,"bid":6200000},"Elusiveness":{"ask":26000,"bid":17500},"Enchanted Gloves":{"ask":6800000,"bid":5200000},"Eye Of The Watcher":{"ask":640000,"bid":600000},"Eye Watch":{"ask":7400000,"bid":3200000},"Firestorm":{"ask":640000,"bid":620000},"Fluffy Red Hat":{"ask":4200000,"bid":3200000},"Frost Sphere":{"ask":660000,"bid":560000},"Frost Staff":{"ask":15000000,"bid":11000000},"Frost Surge":{"ask":760000,"bid":600000},"Gobo Defender":{"ask":250000,"bid":235000},"Gobo Rag":{"ask":160000,"bid":135000},"Infernal Battlestaff":{"ask":35000000,"bid":24500000},"Infernal Ember":{"ask":1800000,"bid":1700000},"Luna Robe Bottoms":{"ask":2650000,"bid":-1},"Luna Robe Top":{"ask":1900000,"bid":110000},"Luna Wing":{"ask":185000,"bid":170000},"Marine Chaps":{"ask":1650000,"bid":-1},"Marine Scale":{"ask":220000,"bid":205000},"Marine Tunic":{"ask":2850000,"bid":1200000},"Nature's Veil":{"ask":800000,"bid":480000},"Puncture":{"ask":250000,"bid":185000},"Red Chef's Hat":{"ask":4000000,"bid":3300000},"Red Panda Fluff":{"ask":390000,"bid":370000},"Revenant Anima":{"ask":1400000,"bid":1300000},"Revenant Chaps":{"ask":10000000,"bid":320000},"Revenant Tunic":{"ask":12500000,"bid":9000000},"Shoebill Feather":{"ask":28000,"bid":22500},"Shoebill Shoes":{"ask":350000,"bid":-1},"Silencing Shot":{"ask":260000,"bid":240000},"Soul Fragment":{"ask":1150000,"bid":980000},"Soul Hunter Crossbow":{"ask":-1,"bid":10000000},"Steady Shot":{"ask":640000,"bid":580000},"Treant Bark":{"ask":21500,"bid":17500},"Treant Shield":{"ask":32000,"bid":-1},"Vampiric Bow":{"ask":41000000,"bid":410000},"Watchful Relic":{"ask":7400000,"bid":-1},"Bag Of 10 Cowbells":{"ask":290000,"bid":270000},"Aqua Aura":{"ask":3600000,"bid":2800000},"Critical Aura":{"ask":11000000,"bid":7600000},"Fierce Aura":{"ask":17000000,"bid":12500000},"Flame Aura":{"ask":5000000,"bid":4200000},"Insanity":{"ask":10000000,"bid":7000000},"Invincible":{"ask":66000000,"bid":37000000},"Provoke":{"ask":180000,"bid":160000},"Quick Aid":{"ask":880000,"bid":580000},"Rejuvenate":{"ask":880000,"bid":760000},"Revive":{"ask":1200000,"bid":700000},"Speed Aura":{"ask":8400000,"bid":6000000},"Sylvan Aura":{"ask":4500000,"bid":3700000},"Taunt":{"ask":92000,"bid":78000}}}`;
    let isUsingLocalMarketJson = false;

    let initData_characterSkills = null;
    let initData_characterItems = null;
    let initData_characterHouseRoomMap = null;
    let initData_actionTypeDrinkSlotsMap = null;
    let initData_actionDetailMap = null;
    let initData_levelExperienceTable = null;
    let initData_itemDetailMap = null;
    let initData_actionCategoryDetailMap = null;
    let initData_abilityDetailMap = null;
    let initData_characterAbilities = null;
    let initData_myMarketListings = null;

    let currentActionsHridList = [];

    hookWS();

    fetchMarketJSON(true);

    function hookWS() {
        const dataProperty = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "data");
        const oriGet = dataProperty.get;

        dataProperty.get = hookedGet;
        Object.defineProperty(MessageEvent.prototype, "data", dataProperty);

        function hookedGet() {
            const socket = this.currentTarget;
            if (!(socket instanceof WebSocket)) {
                return oriGet.call(this);
            }
            if (socket.url.indexOf("api.milkywayidle.com/ws") <= -1) {
                return oriGet.call(this);
            }

            const message = oriGet.call(this);
            Object.defineProperty(this, "data", { value: message }); // Anti-loop

            return handleMessage(message);
        }
    }

    function handleMessage(message) {
        let obj = JSON.parse(message);
        if (obj && obj.type === "init_character_data") {
            initData_characterSkills = obj.characterSkills;
            initData_characterItems = obj.characterItems;
            initData_characterHouseRoomMap = obj.characterHouseRoomMap;
            initData_actionTypeDrinkSlotsMap = obj.actionTypeDrinkSlotsMap;
            initData_characterAbilities = obj.characterAbilities;
            initData_myMarketListings = obj.myMarketListings;
            currentActionsHridList = [...obj.characterActions];
            showTotalActionTime();
            waitForActionPanelParent();
            waitForItemDict();
            calculateNetworth();
        } else if (obj && obj.type === "init_client_data") {
            initData_actionDetailMap = obj.actionDetailMap;
            initData_levelExperienceTable = obj.levelExperienceTable;
            initData_itemDetailMap = obj.itemDetailMap;
            initData_actionCategoryDetailMap = obj.actionCategoryDetailMap;
            initData_abilityDetailMap = obj.abilityDetailMap;
        } else if (obj && obj.type === "actions_updated") {
            for (const action of obj.endCharacterActions) {
                if (action.isDone === false) {
                    let o = {};
                    o.id = action.id;
                    o.actionHrid = action.actionHrid;
                    currentActionsHridList.push(o);
                } else {
                    currentActionsHridList = currentActionsHridList.filter((o) => {
                        return o.id !== action.id;
                    });
                }
            }
        } else if (obj && obj.type === "battle_unit_fetched") {
            handleBattleSummary(obj);
        }
        return message;
    }

    /* 计算Networth */
    async function calculateNetworth() {
        const marketAPIJson = await fetchMarketJSON();
        if (!marketAPIJson) {
            console.error("calculateNetworth marketAPIJson is null");
            return;
        }

        let networthAsk = 0;
        let networthBid = 0;
        for (const item of initData_characterItems) {
            const itemName = initData_itemDetailMap[item.itemHrid].name;
            const marketPrices = marketAPIJson.market[itemName];
            if (marketPrices) {
                networthAsk += item.count * (marketPrices.ask > 0 ? marketPrices.ask : 0);
                networthBid += item.count * (marketPrices.bid > 0 ? marketPrices.bid : 0);
            }
        }

        for (const item of initData_myMarketListings) {
            const itemName = initData_itemDetailMap[item.itemHrid]?.name;
            const quantity = item.orderQuantity - item.filledQuantity;
            const enhancementLevel = item.enhancementLevel;
            const marketPrices = marketAPIJson.market[itemName];
            if (!marketPrices) {
                console.error("calculateNetworth cannot get marketPrices of " + itemName);
                return;
            }
            if (item.isSell) {
                if (itemName === "Bag Of 10 Cowbells") {
                    marketPrices.ask *= 1 - 18 / 100;
                    marketPrices.bid *= 1 - 18 / 100;
                } else {
                    marketPrices.ask *= 1 - 2 / 100;
                    marketPrices.bid *= 1 - 2 / 100;
                }
                if (!enhancementLevel || enhancementLevel === 0) {
                    networthAsk += quantity * (marketPrices.ask > 0 ? marketPrices.ask : 0);
                    networthBid += quantity * (marketPrices.bid > 0 ? marketPrices.bid : 0);
                }
                networthAsk += item.unclaimedCoinCount;
                networthBid += item.unclaimedCoinCount;
            } else {
                networthAsk += quantity * item.price;
                networthBid += quantity * item.price;
                networthAsk += item.unclaimedItemCount * (marketPrices.ask > 0 ? marketPrices.ask : 0);
                networthBid += item.unclaimedItemCount * (marketPrices.bid > 0 ? marketPrices.bid : 0);
            }
        }

        const waitForHeader = () => {
            const targetNode = document.querySelector("div.Header_totalLevel__8LY3Q");
            if (targetNode) {
                targetNode.insertAdjacentHTML(
                    "afterend",
                    `<div>Networth: ${numberFormatter(networthAsk)} / ${numberFormatter(networthBid)}${isUsingLocalMarketJson ? `<div style="color: red">需要科学网络更新市场数据</div>` : ""}</div>`
                );
            } else {
                setTimeout(waitForHeader, 200);
            }
        };
        waitForHeader();
    }

    /* 显示当前动作总时间 */
    const showTotalActionTime = () => {
        const targetNode = document.querySelector("div.Header_actionName__31-L2");
        if (targetNode) {
            console.log("start observe action progress bar");
            calculateTotalTime(targetNode);
            new MutationObserver((mutationsList) =>
                mutationsList.forEach((mutation) => {
                    calculateTotalTime();
                })
            ).observe(targetNode, { characterData: true, subtree: true, childList: true });
        } else {
            setTimeout(showTotalActionTime, 200);
        }
    };

    function calculateTotalTime() {
        const targetNode = document.querySelector("div.Header_actionName__31-L2 > div.Header_actionName__31-L2");
        const textNode = [...targetNode.childNodes]
            .filter((child) => child.nodeType === Node.TEXT_NODE)
            .filter((child) => child.textContent.trim())
            .map((textNode) => textNode)[0];
        if (textNode.textContent.includes("[")) {
            return;
        }
        let totalTimeStr = "Error";
        if (targetNode.childNodes.length === 1) {
            totalTimeStr = " [" + timeReadable(0) + "]";
        } else if (targetNode.childNodes.length === 2) {
            const content = targetNode.innerText;
            const match = content.match(/\((\d+)\)/);
            if (match) {
                const numOfTimes = +match[1];
                const timePerActionSec = +document.querySelector(".ProgressBar_text__102Yn").textContent.match(/[\d\.]+/)[0];
                const actionHrid = currentActionsHridList[0].actionHrid;
                const effBuff = 1 + getTotalEffiPercentage(actionHrid) / 100;
                const actualNumberOfTimes = Math.round(numOfTimes / effBuff);
                const totalTimeSeconds = actualNumberOfTimes * timePerActionSec;
                totalTimeStr = " [" + timeReadable(totalTimeSeconds) + "]";

                const currentTime = new Date();
                currentTime.setSeconds(currentTime.getSeconds() + totalTimeSeconds);
                totalTimeStr += ` ${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(2, "0")}:${String(currentTime.getSeconds()).padStart(2, "0")}`;
            } else {
                totalTimeStr = " [∞]";
            }
        }
        textNode.textContent += totalTimeStr;
    }

    function timeReadable(sec) {
        if (sec >= 86400) {
            return Number(sec / 86400).toFixed(1) + " 天";
        }
        const d = new Date(Math.round(sec * 1000));
        function pad(i) {
            return ("0" + i).slice(-2);
        }
        let str = d.getUTCHours() + "h " + pad(d.getUTCMinutes()) + "m " + pad(d.getUTCSeconds()) + "s";
        return str;
    }

    GM_addStyle(`div.Header_actionName__31-L2 {
        overflow: visible !important;
        white-space: normal !important;
        height: auto !important;
      }`);

    /* 物品 ToolTips */
    const tooltipObserver = new MutationObserver(async function (mutations) {
        for (const mutation of mutations) {
            for (const added of mutation.addedNodes) {
                if (added.classList.contains("MuiTooltip-popper")) {
                    if (added.querySelector("div.ItemTooltipText_name__2JAHA")) {
                        await handleTooltipItem(added);
                    }
                }
            }
        }
    });
    tooltipObserver.observe(document.body, { attributes: false, childList: true, characterData: false });

    const actionHridToToolsSpeedBuffNamesMap = {
        "/action_types/brewing": "brewingSpeed",
        "/action_types/cheesesmithing": "cheesesmithingSpeed",
        "/action_types/cooking": "cookingSpeed",
        "/action_types/crafting": "craftingSpeed",
        "/action_types/foraging": "foragingSpeed",
        "/action_types/milking": "milkingSpeed",
        "/action_types/tailoring": "tailoringSpeed",
        "/action_types/woodcutting": "woodcuttingSpeed",
    };

    const actionHridToHouseNamesMap = {
        "/action_types/brewing": "/house_rooms/brewery",
        "/action_types/cheesesmithing": "/house_rooms/forge",
        "/action_types/cooking": "/house_rooms/kitchen",
        "/action_types/crafting": "/house_rooms/workshop",
        "/action_types/foraging": "/house_rooms/garden",
        "/action_types/milking": "/house_rooms/dairy_barn",
        "/action_types/tailoring": "/house_rooms/sewing_parlor",
        "/action_types/woodcutting": "/house_rooms/log_shed",
    };

    const itemEnhanceLevelToBuffBonusMap = {
        0: 0,
        1: 2,
        2: 4.2,
        3: 6.6,
        4: 9.2,
        5: 12.0,
        6: 15.0,
        7: 18.2,
        8: 21.6,
        9: 25.2,
        10: 29.0,
        11: 33.0,
        12: 37.2,
        13: 41.6,
        14: 46.2,
        15: 51.0,
        16: 56.0,
        17: 61.2,
        18: 66.6,
        19: 72.2,
        20: 78.0,
    };

    function getToolsSpeedBuffByActionHrid(actionHrid) {
        let buff = 0;
        for (const item of initData_characterItems) {
            if (item.itemLocationHrid.includes("_tool")) {
                const buffName = actionHridToToolsSpeedBuffNamesMap[initData_actionDetailMap[actionHrid].type];
                const enhanceBonus = 1 + itemEnhanceLevelToBuffBonusMap[item.enhancementLevel] / 100;
                buff += initData_itemDetailMap[item.itemHrid].equipmentDetail.noncombatStats[buffName] * enhanceBonus;
            }
        }
        return Number(buff * 100).toFixed(1);
    }

    function getItemEffiBuffByActionHrid(actionHrid) {
        let buff = 0;
        const propertyName = initData_actionDetailMap[actionHrid].type.replace("/action_types/", "") + "Efficiency";
        for (const item of initData_characterItems) {
            const itemDetail = initData_itemDetailMap[item.itemHrid];
            const stat = itemDetail?.equipmentDetail?.noncombatStats[propertyName];
            if (stat && stat > 0) {
                let enhanceBonus = 1;
                if (item.itemLocationHrid.includes("earrings") || item.itemLocationHrid.includes("ring") || item.itemLocationHrid.includes("neck")) {
                    enhanceBonus = 1 + (itemEnhanceLevelToBuffBonusMap[item.enhancementLevel] * 5) / 100;
                } else {
                    enhanceBonus = 1 + itemEnhanceLevelToBuffBonusMap[item.enhancementLevel] / 100;
                }
                buff += stat * enhanceBonus;
            }
        }
        return Number(buff * 100).toFixed(1);
    }

    function getHousesEffBuffByActionHrid(actionHrid) {
        const houseName = actionHridToHouseNamesMap[initData_actionDetailMap[actionHrid].type];
        if (!houseName) {
            return 0;
        }
        const house = initData_characterHouseRoomMap[houseName];
        if (!house) {
            return 0;
        }
        return house.level * 1.5;
    }

    function getTeaBuffsByActionHrid(actionHrid) {
        // YES Gathering (+15% quantity) — milking, foraging, woodcutting
        // TODO Processing (+15% chance to convert product into processed material) — milking, foraging, woodcutting
        // YES Gourmet (+12% to produce free product) — cooking, brewing
        // YES Artisan (-10% less resources used, but treat as -5 levels) — cheesesmithing, crafting, tailoring, cooking, brewing
        // NO  Wisdom (+12% XP) — all
        // YES Efficiency (+10% chance to repeat action) — all (except enhancing)
        // YES S.Skill (treat as +3 or +6 levels, different names) — all
        let teaBuffs = {
            efficiency: 0,
            quantity: 0,
            upgradedProduct: 0,
            lessResource: 0,
        };

        const teaList = initData_actionTypeDrinkSlotsMap[initData_actionDetailMap[actionHrid].type];
        for (const tea of teaList) {
            if (!tea || !tea.itemHrid) {
                continue;
            }
            if (tea.itemHrid === "/items/efficiency_tea") {
                teaBuffs.efficiency += 10;
                continue;
            }
            const teaBuffDetail = initData_itemDetailMap[tea.itemHrid]?.consumableDetail?.buffs[0];
            if (teaBuffDetail && teaBuffDetail.typeHrid.includes("_level")) {
                teaBuffs.efficiency += teaBuffDetail.flatBoost;
                continue;
            }
            if (tea.itemHrid === "/items/artisan_tea") {
                teaBuffs.lessResource += 10;
                continue;
            }
            if (tea.itemHrid === "/items/gathering_tea") {
                teaBuffs.quantity += 15;
                continue;
            }
            if (tea.itemHrid === "/items/gourmet_tea") {
                teaBuffs.quantity += 12;
                continue;
            }
            if (tea.itemHrid === "/items/processing_tea") {
                teaBuffs.upgradedProduct += 15;
                continue;
            }
        }
        return teaBuffs;
    }

    async function handleTooltipItem(tooltip) {
        const itemNameElem = tooltip.querySelector("div.ItemTooltipText_name__2JAHA");
        if (itemNameElem.querySelectorAll("span").length > 1) {
            return; // 不显示带有强化等级的物品
        }
        const itemName = itemNameElem.textContent;
        const amountSpan = tooltip.querySelectorAll("span")[1];
        let amount = 0;
        let insertAfterElem = null;
        if (amountSpan) {
            amount = +amountSpan.textContent.split(": ")[1].replaceAll(",", "");
            insertAfterElem = amountSpan.parentNode.nextSibling;
        } else {
            insertAfterElem = tooltip.querySelectorAll("span")[0].parentNode.nextSibling;
        }

        const jsonObj = await fetchMarketJSON();
        if (!jsonObj || !jsonObj.market) {
            insertAfterElem.insertAdjacentHTML(
                "afterend",
                `
                <div style="color: DarkGreen;"">市场API错误</div>
                `
            );
            return;
        }

        if (!jsonObj.market[itemName]) {
            console.error("itemName not found in market API json: " + itemName);
        }

        let appendHTMLStr = "";

        // 市场价格
        const ask = jsonObj?.market[itemName]?.ask;
        const bid = jsonObj?.market[itemName]?.bid;
        appendHTMLStr += `
        <div style="color: DarkGreen;"">日均价: ${numberFormatter(ask)} / ${numberFormatter(bid)} (${ask && ask > 0 ? numberFormatter(ask * amount) : ""} / ${
            bid && bid > 0 ? numberFormatter(bid * amount) : ""
        })</div>
        `;

        if (
            getActionHridFromItemName(itemName) &&
            initData_actionDetailMap[getActionHridFromItemName(itemName)].inputItems &&
            initData_actionDetailMap[getActionHridFromItemName(itemName)].inputItems.length > 0 &&
            initData_actionDetailMap &&
            initData_itemDetailMap
        ) {
            // 制造类技能
            const actionHrid = getActionHridFromItemName(itemName);
            const inputItems = JSON.parse(JSON.stringify(initData_actionDetailMap[actionHrid].inputItems));
            const upgradedFromItemHrid = initData_actionDetailMap[actionHrid]?.upgradeItemHrid;
            if (upgradedFromItemHrid) {
                inputItems.push({ itemHrid: upgradedFromItemHrid, count: 1 });
            }

            let totalAskPrice = 0;
            let totalBidPrice = 0;
            for (let item of inputItems) {
                item.name = initData_itemDetailMap[item.itemHrid].name;
                item.perAskPrice = jsonObj?.market[item.name]?.ask;
                item.perBidPrice = jsonObj?.market[item.name]?.bid;
                totalAskPrice += item.perAskPrice * item.count;
                totalBidPrice += item.perBidPrice * item.count;
            }

            appendHTMLStr += `<div style="color: DarkGreen; font-size: 10px;">原料价： ${numberFormatter(totalAskPrice)}  / ${numberFormatter(totalBidPrice)}</div>`;
            for (const item of inputItems) {
                appendHTMLStr += `
                <div style="color: DarkGreen; font-size: 10px;"> ${item.name} x${item.count}: ${numberFormatter(item.perAskPrice)} / ${numberFormatter(item.perBidPrice)}</div>
                `;
            }

            // 基础每小时生产数量
            let produceItemPerHour = 3600000 / (initData_actionDetailMap[actionHrid].baseTimeCost / 1000000);
            // 基础掉率
            let droprate = initData_actionDetailMap[actionHrid].outputItems[0].count;
            //produceItemPerHour *= droprate;
            // 工具提高速度
            let toolPercent = getToolsSpeedBuffByActionHrid(actionHrid);
            produceItemPerHour *= 1 + toolPercent / 100;
            // 等级碾压提高效率
            const requiredLevel = initData_actionDetailMap[actionHrid].levelRequirement.level;
            let currentLevel = requiredLevel;
            for (const skill of initData_characterSkills) {
                if (skill.skillHrid === initData_actionDetailMap[actionHrid].levelRequirement.skillHrid) {
                    currentLevel = skill.level;
                    break;
                }
            }
            const levelEffBuff = currentLevel - requiredLevel > 0 ? currentLevel - requiredLevel : 0;
            // 房子效率
            const houseEffBuff = getHousesEffBuffByActionHrid(actionHrid);
            // 茶效率
            const teaBuffs = getTeaBuffsByActionHrid(actionHrid);
            // 特殊装备效率
            const itemEffiBuff = Number(getItemEffiBuffByActionHrid(actionHrid));
            // 总效率
            produceItemPerHour *= 1 + (levelEffBuff + houseEffBuff + teaBuffs.efficiency + itemEffiBuff) / 100;
            // 茶额外数量
            let extraQuantityPerHour = (produceItemPerHour * teaBuffs.quantity) / 100;

            appendHTMLStr += `<div style="color: DarkGreen; font-size: 10px;">生产利润(卖单价进、买单价出；不包括Processing Tea、社区buff、稀有掉落；刷新网页更新人物数据)：</div>`;
            appendHTMLStr += `<div style="color: DarkGreen; font-size: 10px;">x${droprate}基础掉率 +${toolPercent}%工具速度 +${levelEffBuff}%等级效率 +${houseEffBuff}%房子效率 +${teaBuffs.efficiency}%茶效率 +${itemEffiBuff}%装备效率 +${teaBuffs.quantity}%茶额外数量 +${teaBuffs.lessResource}%茶减少消耗</div>`;
            appendHTMLStr += `<div style="color: DarkGreen; font-size: 10px;">每小时生产 ${Number((produceItemPerHour + extraQuantityPerHour) * droprate).toFixed(1)} 个</div>`;
            appendHTMLStr += `<div style="color: DarkGreen;">利润: ${numberFormatter(bid * droprate - totalAskPrice * (1 - teaBuffs.lessResource / 100))}/个, ${numberFormatter(
                produceItemPerHour * (bid * droprate - totalAskPrice * (1 - teaBuffs.lessResource / 100)) + extraQuantityPerHour * bid * droprate
            )}/小时, ${numberFormatter(24 * (produceItemPerHour * (bid * droprate - totalAskPrice * (1 - teaBuffs.lessResource / 100)) + extraQuantityPerHour * bid * droprate))}/天</div>`;
        } else if (getActionHridFromItemName(itemName) && initData_actionDetailMap[getActionHridFromItemName(itemName)].inputItems === null && initData_actionDetailMap && initData_itemDetailMap) {
            // 采集类技能
            const actionHrid = getActionHridFromItemName(itemName);
            // 基础每小时生产数量
            let produceItemPerHour = 3600000 / (initData_actionDetailMap[actionHrid].baseTimeCost / 1000000);
            // 基础掉率
            let droprate = (initData_actionDetailMap[actionHrid].dropTable[0].minCount + initData_actionDetailMap[actionHrid].dropTable[0].maxCount) / 2;
            produceItemPerHour *= droprate;
            // 工具提高速度
            let toolPercent = getToolsSpeedBuffByActionHrid(actionHrid);
            produceItemPerHour *= 1 + toolPercent / 100;
            // 等级碾压效率
            const requiredLevel = initData_actionDetailMap[actionHrid].levelRequirement.level;
            let currentLevel = requiredLevel;
            for (const skill of initData_characterSkills) {
                if (skill.skillHrid === initData_actionDetailMap[actionHrid].levelRequirement.skillHrid) {
                    currentLevel = skill.level;
                    break;
                }
            }
            const levelEffBuff = currentLevel - requiredLevel > 0 ? currentLevel - requiredLevel : 0;
            // 房子效率
            const houseEffBuff = getHousesEffBuffByActionHrid(actionHrid);
            // 茶效率
            const teaBuffs = getTeaBuffsByActionHrid(actionHrid);
            // 特殊装备效率
            const itemEffiBuff = Number(getItemEffiBuffByActionHrid(actionHrid));
            // 总效率
            produceItemPerHour *= 1 + (levelEffBuff + houseEffBuff + teaBuffs.efficiency + itemEffiBuff) / 100;
            // 茶额外数量
            let extraQuantityPerHour = (produceItemPerHour * teaBuffs.quantity) / 100;

            appendHTMLStr += `<div style="color: DarkGreen; font-size: 10px;">生产利润(卖单价进、买单价出；不包括Processing Tea、社区buff、稀有掉落；刷新网页更新人物数据)：</div>`;
            appendHTMLStr += `<div style="color: DarkGreen; font-size: 10px;">x${droprate}基础掉率 +${toolPercent}%工具速度 +${levelEffBuff}%等级效率 +${houseEffBuff}%房子效率 +${teaBuffs.efficiency}%茶效率 +${itemEffiBuff}%装备效率 +${teaBuffs.quantity}%茶额外数量 +${teaBuffs.lessResource}%茶减少消耗</div>`;
            appendHTMLStr += `<div style="color: DarkGreen; font-size: 10px;">每小时生产 ${Number(produceItemPerHour + extraQuantityPerHour).toFixed(1)} 个</div>`;
            appendHTMLStr += `<div style="color: DarkGreen;">利润: ${numberFormatter(bid)}/个, ${numberFormatter(produceItemPerHour * bid + extraQuantityPerHour * bid)}/小时, ${numberFormatter(
                24 * (produceItemPerHour * bid + extraQuantityPerHour * bid)
            )}/天</div>`;
        }

        insertAfterElem.insertAdjacentHTML("afterend", appendHTMLStr);
    }

    async function fetchMarketJSON(forceFetch = false) {
        if (!GM?.xmlHttpRequest) {
            console.error("fetchMarketJSON GM.xmlHttpRequest null function");
            isUsingLocalMarketJson = true;
            const jsonStr = MARKET_JSON_LOCAL_BACKUP;
            const jsonObj = JSON.parse(jsonStr);
            if (jsonObj && jsonObj.time && jsonObj.market) {
                jsonObj.market.Coin.ask = 1;
                jsonObj.market.Coin.bid = 1;
                console.log(jsonObj);
                localStorage.setItem("MWITools_marketAPI_timestamp", Date.now());
                localStorage.setItem("MWITools_marketAPI_json", JSON.stringify(jsonObj));
                return jsonObj;
            }
        }

        if (!forceFetch && localStorage.getItem("MWITools_marketAPI_timestamp") && Date.now() - localStorage.getItem("MWITools_marketAPI_timestamp") < 900000) {
            return JSON.parse(localStorage.getItem("MWITools_marketAPI_json"));
        }

        console.log("fetchMarketJSON fetch github start");
        let jsonStr = null;
        jsonStr = await new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                url: `https://raw.githubusercontent.com/holychikenz/MWIApi/main/medianmarket.json`,
                method: "GET",
                synchronous: true,
                timeout: 5000,
                onload: async (response) => {
                    if (response.status == 200) {
                        console.log("fetchMarketJSON fetch github success 200");
                        resolve(response.responseText);
                    } else {
                        console.error("fetchMarketJSON fetch github onload with HTTP status failure " + response.status);
                        resolve(null);
                    }
                },
                onabort: () => {
                    console.error("fetchMarketJSON fetch github onabort");
                    resolve(null);
                },
                onerror: () => {
                    console.error("fetchMarketJSON fetch github onerror");
                    resolve(null);
                },
                ontimeout: () => {
                    console.error("fetchMarketJSON fetch github ontimeout");
                    resolve(null);
                },
            });
        });

        if (jsonStr === null) {
            console.error("fetchMarketJSON network error, using local version");
            isUsingLocalMarketJson = true;
            jsonStr = MARKET_JSON_LOCAL_BACKUP;
        } else {
            isUsingLocalMarketJson = false;
        }

        const jsonObj = JSON.parse(jsonStr);
        if (jsonObj && jsonObj.time && jsonObj.market) {
            jsonObj.market.Coin.ask = 1;
            jsonObj.market.Coin.bid = 1;
            console.log(jsonObj);
            localStorage.setItem("MWITools_marketAPI_timestamp", Date.now());
            localStorage.setItem("MWITools_marketAPI_json", JSON.stringify(jsonObj));
            return jsonObj;
        }
        console.error("MWITools: fetchMarketJSON JSON.parse error");
        localStorage.setItem("MWITools_marketAPI_timestamp", 0);
        localStorage.setItem("MWITools_marketAPI_json", "");
        return null;
    }

    function numberFormatter(num, digits = 1) {
        if (num === null || num === undefined) {
            return null;
        }
        if (num < 0) {
            return "-" + numberFormatter(-num);
        }
        const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "B" },
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        var item = lookup
            .slice()
            .reverse()
            .find(function (item) {
                return num >= item.value;
            });
        return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
    }

    function getActionHridFromItemName(name) {
        let newName = name.replace("Milk", "Cow");
        newName = newName.replace("Log", "Tree");
        newName = newName.replace("Cowing", "Milking");
        newName = newName.replace("Rainbow Cow", "Unicow");
        if (!initData_actionDetailMap) {
            console.error("getActionHridFromItemName no initData_actionDetailMap: " + name);
            return null;
        }
        for (const action of Object.values(initData_actionDetailMap)) {
            if (action.name === newName) {
                return action.hrid;
            }
        }
        return null;
    }

    /* 动作面板 */
    const waitForActionPanelParent = () => {
        const targetNode = document.querySelector("div.GamePage_mainPanel__2njyb");
        if (targetNode) {
            console.log("start observe action panel");
            const actionPanelObserver = new MutationObserver(async function (mutations) {
                for (const mutation of mutations) {
                    for (const added of mutation.addedNodes) {
                        if (added?.classList?.contains("Modal_modalContainer__3B80m") && added.querySelector("div.SkillActionDetail_nonenhancingComponent__1Y-ZY")) {
                            handleActionPanel(added.querySelector("div.SkillActionDetail_nonenhancingComponent__1Y-ZY"));
                        }
                    }
                }
            });
            actionPanelObserver.observe(targetNode, { attributes: false, childList: true, subtree: true });
        } else {
            setTimeout(waitForActionPanelParent, 200);
        }
    };

    async function handleActionPanel(panel) {
        if (!panel.querySelector("div.SkillActionDetail_expGain__F5xHu")) {
            return; // 不处理战斗ActionPanel
        }
        const actionName = panel.querySelector("div.SkillActionDetail_name__3erHV").textContent;
        const exp = Number(panel.querySelector("div.SkillActionDetail_expGain__F5xHu").textContent.replaceAll(",", ""));
        const duration = Number(panel.querySelectorAll("div.SkillActionDetail_value__dQjYH")[4].textContent.replace("s", ""));
        const inputElem = panel.querySelector("div.SkillActionDetail_maxActionCountInput__1C0Pw input");

        const actionHrid = initData_actionDetailMap[getActionHridFromItemName(actionName)].hrid;
        const effBuff = 1 + getTotalEffiPercentage(actionHrid, false) / 100;

        // 显示总时间
        let hTMLStr = `<div id="showTotalTime" style="color: Green; text-align: left;">${getTotalTimeStr(inputElem.value, duration, effBuff)}</div>`;
        inputElem.parentNode.insertAdjacentHTML("afterend", hTMLStr);
        const showTotalTimeDiv = panel.querySelector("div#showTotalTime");

        panel.addEventListener("click", function (evt) {
            setTimeout(() => {
                showTotalTimeDiv.textContent = getTotalTimeStr(inputElem.value, duration, effBuff);
            }, 50);
        });
        inputElem.addEventListener("keyup", function (evt) {
            if (inputElem.value.toLowerCase().includes("k") || inputElem.value.toLowerCase().includes("m")) {
                reactInputTriggerHack(inputElem, inputElem.value.toLowerCase().replaceAll("k", "000").replaceAll("m", "000000"));
            }
            showTotalTimeDiv.textContent = getTotalTimeStr(inputElem.value, duration, effBuff);
        });

        // 显示快捷按钮
        hTMLStr = `<div id="quickInputButtons" style="color: Green; text-align: left;">做 </div>`;
        showTotalTimeDiv.insertAdjacentHTML("afterend", hTMLStr);
        const quickInputButtonsDiv = panel.querySelector("div#quickInputButtons");

        const presetHours = [0.5, 1, 2, 3, 4, 5, 6, 10, 12, 24];
        for (const value of presetHours) {
            const btn = document.createElement("button");
            btn.style.backgroundColor = "white";
            btn.style.padding = "1px 6px 1px 6px";
            btn.style.margin = "1px";
            btn.innerText = value === 0.5 ? 0.5 : numberFormatter(value);
            btn.onclick = () => {
                reactInputTriggerHack(inputElem, Math.round((value * 60 * 60 * effBuff) / duration));
            };
            quickInputButtonsDiv.append(btn);
        }
        quickInputButtonsDiv.append(document.createTextNode(" 小时"));

        quickInputButtonsDiv.append(document.createElement("div"));
        quickInputButtonsDiv.append(document.createTextNode("做 "));
        const presetTimes = [10, 100, 300, 500, 1000, 2000];
        for (const value of presetTimes) {
            const btn = document.createElement("button");
            btn.style.backgroundColor = "white";
            btn.style.padding = "1px 6px 1px 6px";
            btn.style.margin = "1px";
            btn.innerText = numberFormatter(value);
            btn.onclick = () => {
                reactInputTriggerHack(inputElem, value);
            };
            quickInputButtonsDiv.append(btn);
        }
        quickInputButtonsDiv.append(document.createTextNode(" 次"));

        // 还有多久到多少技能等级
        const skillHrid = initData_actionDetailMap[getActionHridFromItemName(actionName)].experienceGain.skillHrid;
        let currentExp = null;
        let currentLevel = null;
        for (const skill of initData_characterSkills) {
            if (skill.skillHrid === skillHrid) {
                currentExp = skill.experience;
                currentLevel = skill.level;
                break;
            }
        }
        if (currentExp && currentLevel) {
            const calculateNeedToLevel = (currentLevel, targetLevel, effBuff, duration, exp) => {
                let needTotalTimeSec = 0;
                let needTotalNumOfActions = 0;
                for (let level = currentLevel; level < targetLevel; level++) {
                    let needExpToNextLevel = null;
                    if (level === currentLevel) {
                        needExpToNextLevel = initData_levelExperienceTable[level + 1] - currentExp;
                    } else {
                        needExpToNextLevel = initData_levelExperienceTable[level + 1] - initData_levelExperienceTable[level];
                    }
                    const extraLevelEffBuff = (level - currentLevel) * 0.01; // 升级过程中，每升一级，额外多1%效率
                    const needNumOfActionsToNextLevel = Math.round(needExpToNextLevel / exp);
                    needTotalNumOfActions += needNumOfActionsToNextLevel;
                    needTotalTimeSec += (needNumOfActionsToNextLevel / (effBuff + extraLevelEffBuff)) * duration;
                }
                return { numOfActions: needTotalNumOfActions, timeSec: needTotalTimeSec };
            };

            const need = calculateNeedToLevel(currentLevel, currentLevel + 1, effBuff, duration, exp);
            hTMLStr = `<div id="tillLevel" style="color: Green; text-align: left;">到 <input id="tillLevelInput" type="number" value="${currentLevel + 1}" min="${
                currentLevel + 1
            }" max="200"> 级还需做 <span id="tillLevelNumber">${need.numOfActions} 次[${timeReadable(need.timeSec)}] (刷新网页更新当前等级)</span></div>`;

            quickInputButtonsDiv.insertAdjacentHTML("afterend", hTMLStr);
            const tillLevelInput = panel.querySelector("input#tillLevelInput");
            const tillLevelNumber = panel.querySelector("span#tillLevelNumber");
            tillLevelInput.onchange = () => {
                const targetLevel = Number(tillLevelInput.value);
                if (targetLevel > currentLevel && targetLevel <= 200) {
                    const need = calculateNeedToLevel(currentLevel, targetLevel, effBuff, duration, exp);
                    tillLevelNumber.textContent = `${need.numOfActions} 次[${timeReadable(need.timeSec)}] (刷新网页更新当前等级)`;
                } else {
                    tillLevelNumber.textContent = "Error";
                }
            };
            tillLevelInput.addEventListener("keyup", function (evt) {
                const targetLevel = Number(tillLevelInput.value);
                if (targetLevel > currentLevel && targetLevel <= 200) {
                    const need = calculateNeedToLevel(currentLevel, targetLevel, effBuff, duration, exp);
                    tillLevelNumber.textContent = `${need.numOfActions} 次[${timeReadable(need.timeSec)}] (刷新网页更新当前等级)`;
                } else {
                    tillLevelNumber.textContent = "Error";
                }
            });
        }

        // 显示每小时经验
        panel
            .querySelector("div#tillLevel")
            .insertAdjacentHTML(
                "afterend",
                `<div id="expPerHour" style="color: Green; text-align: left;">每小时经验: ${numberFormatter(Math.round((3600 / duration) * exp * effBuff))} (+${Number((effBuff - 1) * 100).toFixed(
                    1
                )}%效率)</div>`
            );

        // 显示Foraging最后一个图综合收益
        if (panel.querySelector("div.SkillActionDetail_dropTable__3ViVp").children.length > 1) {
            const jsonObj = await fetchMarketJSON();
            const actionHrid = "/actions/foraging/" + actionName.toLowerCase().replaceAll(" ", "_");
            let numOfActionsPerHour = 3600000 / (initData_actionDetailMap[actionHrid].baseTimeCost / 1000000);
            let dropTable = initData_actionDetailMap[actionHrid].dropTable;
            let virtualItemBid = 0;
            for (const drop of dropTable) {
                const bid = jsonObj?.market[initData_itemDetailMap[drop.itemHrid].name]?.bid;
                const amount = drop.dropRate * ((drop.minCount + drop.maxCount) / 2);
                virtualItemBid += bid * amount;
            }

            // 工具提高速度
            let toolPercent = getToolsSpeedBuffByActionHrid(actionHrid);
            numOfActionsPerHour *= 1 + toolPercent / 100;
            // 等级碾压效率
            const requiredLevel = initData_actionDetailMap[actionHrid].levelRequirement.level;
            let currentLevel = requiredLevel;
            for (const skill of initData_characterSkills) {
                if (skill.skillHrid === initData_actionDetailMap[actionHrid].levelRequirement.skillHrid) {
                    currentLevel = skill.level;
                    break;
                }
            }
            const levelEffBuff = currentLevel - requiredLevel;
            // 房子效率
            const houseEffBuff = getHousesEffBuffByActionHrid(actionHrid);
            // 茶
            const teaBuffs = getTeaBuffsByActionHrid(actionHrid);
            // 总效率
            numOfActionsPerHour *= 1 + (levelEffBuff + houseEffBuff + teaBuffs.efficiency) / 100;
            // 茶额外数量
            let extraQuantityPerHour = (numOfActionsPerHour * teaBuffs.quantity) / 100;

            let htmlStr = `<div id="totalProfit"  style="color: Green; text-align: left;">综合利润: ${numberFormatter(
                numOfActionsPerHour * virtualItemBid + extraQuantityPerHour * virtualItemBid
            )}/小时, ${numberFormatter(24 * numOfActionsPerHour * virtualItemBid + extraQuantityPerHour * virtualItemBid)}/天</div>`;
            panel.querySelector("div#expPerHour").insertAdjacentHTML("afterend", htmlStr);
        }
    }

    function getTotalEffiPercentage(actionHrid, debug = false) {
        if (debug) {
            console.log("----- getTotalEffiPercentage " + actionHrid);
        }
        // 等级碾压效率
        const requiredLevel = initData_actionDetailMap[actionHrid].levelRequirement.level;
        let currentLevel = requiredLevel;
        for (const skill of initData_characterSkills) {
            if (skill.skillHrid === initData_actionDetailMap[actionHrid].levelRequirement.skillHrid) {
                currentLevel = skill.level;
                break;
            }
        }
        const levelEffBuff = currentLevel - requiredLevel > 0 ? currentLevel - requiredLevel : 0;
        if (debug) {
            console.log("等级碾压 " + levelEffBuff);
        }
        // 房子效率
        const houseEffBuff = getHousesEffBuffByActionHrid(actionHrid);
        if (debug) {
            console.log("房子 " + houseEffBuff);
        }
        // 茶
        const teaBuffs = getTeaBuffsByActionHrid(actionHrid);
        if (debug) {
            console.log("茶 " + teaBuffs.efficiency);
        }
        // 特殊装备
        const itemEffiBuff = getItemEffiBuffByActionHrid(actionHrid);
        if (debug) {
            console.log("特殊装备 " + itemEffiBuff);
        }
        // 总效率
        const total = levelEffBuff + houseEffBuff + teaBuffs.efficiency + Number(itemEffiBuff);
        if (debug) {
            console.log("总计 " + total);
        }
        return total;
    }

    function getTotalTimeStr(input, duration, effBuff) {
        if (input === "unlimited") {
            return "[∞]";
        } else if (isNaN(input)) {
            return "Error";
        }
        return "[" + timeReadable(Math.round(input / effBuff) * duration) + "]";
    }

    function reactInputTriggerHack(inputElem, value) {
        let lastValue = inputElem.value;
        inputElem.value = value;
        let event = new Event("input", { bubbles: true });
        event.simulated = true;
        let tracker = inputElem._valueTracker;
        if (tracker) {
            tracker.setValue(lastValue);
        }
        inputElem.dispatchEvent(event);
    }

    /* 左侧栏显示技能百分比 */
    const waitForProgressBar = () => {
        const elements = document.querySelectorAll(".NavigationBar_currentExperience__3GDeX");
        if (elements.length) {
            removeInsertedDivs();
            elements.forEach((element) => {
                let text = element.style.width;
                text = Number(text.replace("%", "")).toFixed(2) + "%";

                const span = document.createElement("span");
                span.textContent = text;
                span.classList.add("insertedSpan");
                span.style.fontSize = "13px";
                span.style.color = "green";

                element.parentNode.parentNode.querySelector("span.NavigationBar_level__3C7eR").style.width = "auto";

                const insertParent = element.parentNode.parentNode.children[0];
                insertParent.insertBefore(span, insertParent.children[1]);
            });
        } else {
            setTimeout(waitForProgressBar, 200);
        }
    };

    const removeInsertedDivs = () => document.querySelectorAll("span.insertedSpan").forEach((div) => div.parentNode.removeChild(div));

    window.setInterval(() => {
        removeInsertedDivs();
        waitForProgressBar();
    }, 1000);

    /* 战斗总结 */
    async function handleBattleSummary(message) {
        const marketJson = await fetchMarketJSON();
        let hasMarketJson = true;
        if (!marketJson) {
            console.error("handleBattleSummary null marketAPI");
            hasMarketJson = false;
        }
        let totalPriceAsk = 0;
        let totalPriceAskBid = 0;

        if (hasMarketJson) {
            for (const loot of Object.values(message.unit.totalLootMap)) {
                const itemName = initData_itemDetailMap[loot.itemHrid].name;
                const itemCount = loot.count;
                if (marketJson.market[itemName]) {
                    totalPriceAsk += marketJson.market[itemName].ask * itemCount;
                    totalPriceAskBid += marketJson.market[itemName].bid * itemCount;
                } else {
                    console.error("handleBattleSummary failed to read price of " + loot.itemHrid);
                }
            }
        }

        let totalSkillsExp = 0;
        for (const exp of Object.values(message.unit.totalSkillExperienceMap)) {
            totalSkillsExp += exp;
        }

        let tryTimes = 0;
        findElem();
        function findElem() {
            tryTimes++;
            let elem = document.querySelector(".BattlePanel_gainedExp__3SaCa");
            if (elem) {
                // 战斗时长和次数
                let battleDurationSec = null;
                const combatInfoElement = document.querySelector(".BattlePanel_combatInfo__sHGCe");
                if (combatInfoElement) {
                    let matches = combatInfoElement.innerHTML.match(
                        /(战斗时长|Combat Duration): (?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s).*?(战斗|Battles): (\d+).*?(死亡次数|Deaths): (\d+)/
                    );
                    if (matches) {
                        let days = parseInt(matches[2], 10) || 0;
                        let hours = parseInt(matches[3], 10) || 0;
                        let minutes = parseInt(matches[4], 10) || 0;
                        let seconds = parseInt(matches[5], 10) || 0;
                        let battles = parseInt(matches[7], 10) - 1; // 排除当前战斗
                        battleDurationSec = days * 86400 + hours * 3600 + minutes * 60 + seconds;
                        let efficiencyPerHour = ((battles / battleDurationSec) * 3600).toFixed(1);
                        elem.insertAdjacentHTML("afterend", `<div id="script_battleNumbers" style="color: Green;">平均每小时战斗 ${efficiencyPerHour} 次</div>`);
                    }
                }
                // 总收入
                document
                    .querySelector("div#script_battleNumbers")
                    .insertAdjacentHTML("afterend", `<div id="script_totalIncome" style="color: Green;">总收入: ${numberFormatter(totalPriceAsk)} / ${numberFormatter(totalPriceAskBid)}</div>`);
                // 平均收入
                if (battleDurationSec) {
                    document
                        .querySelector("div#script_totalIncome")
                        .insertAdjacentHTML(
                            "afterend",
                            `<div id="script_averageIncome" style="color: Green;">平均每小时收入: ${numberFormatter(totalPriceAsk / (battleDurationSec / 60 / 60))} / ${numberFormatter(
                                totalPriceAskBid / (battleDurationSec / 60 / 60)
                            )}</div>`
                        );
                } else {
                    console.error("handleBattleSummary unable to display average income due to null battleDurationSec");
                }
                // 总经验
                document
                    .querySelector("div#script_averageIncome")
                    .insertAdjacentHTML("afterend", `<div id="script_totalSkillsExp" style="color: Green;">总经验: ${numberFormatter(totalSkillsExp)}</div>`);
                // 平均经验
                if (battleDurationSec) {
                    document
                        .querySelector("div#script_totalSkillsExp")
                        .insertAdjacentHTML(
                            "afterend",
                            `<div id="script_averageSkillsExp" style="color: Green;">平均每小时经验: ${numberFormatter(totalSkillsExp / (battleDurationSec / 60 / 60))}</div>`
                        );
                } else {
                    console.error("handleBattleSummary unable to display average exp due to null battleDurationSec");
                }
            } else if (tryTimes <= 10) {
                setTimeout(findElem, 200);
            } else {
                console.error("handleBattleSummary: Elem not found after 10 tries.");
            }
        }
    }

    /* 图标上显示装备等级 */
    function addItemLevels() {
        const iconDivs = document.querySelectorAll("div.Item_itemContainer__x7kH1 div.Item_item__2De2O.Item_clickable__3viV6");
        for (const div of iconDivs) {
            if (div.querySelector("div.Item_name__2C42x")) {
                continue;
            }
            const href = div.querySelector("use").getAttribute("href");
            const hrefName = href.split("#")[1];
            const itemHrid = "/items/" + hrefName;
            const itemLevel = initData_itemDetailMap[itemHrid]?.itemLevel;
            const itemAbilityLevel = initData_itemDetailMap[itemHrid]?.abilityBookDetail?.levelRequirements?.[0]?.level;
            if (itemLevel && itemLevel > 0) {
                if (!div.querySelector("div.script_itemLevel")) {
                    div.insertAdjacentHTML(
                        "beforeend",
                        `<div class="script_itemLevel" style="z-index: 1; position: absolute; top: 2px; right: 2px; text-align: right; color: green;">${itemLevel}</div>`
                    );
                }
            } else if (itemAbilityLevel && itemAbilityLevel > 0) {
                if (!div.querySelector("div.script_itemLevel")) {
                    div.insertAdjacentHTML(
                        "beforeend",
                        `<div class="script_itemLevel" style="z-index: 1; position: absolute; top: 2px; right: 2px; text-align: right; color: green;">${itemAbilityLevel}</div>`
                    );
                }
            }
        }
    }
    setInterval(addItemLevels, 500);

    /* 任务卡片显示战斗地图序号 */
    function handleTaskCard() {
        const taskNameDivs = document.querySelectorAll("div.RandomTask_randomTask__3B9fA div.RandomTask_name__1hl1b");
        for (const div of taskNameDivs) {
            const taskStr = div.textContent;
            if (!taskStr.startsWith("Defeat ")) {
                continue;
            }

            const monsterName = taskStr.replace("Defeat ", "");
            let actionObj = null;
            for (const action of Object.values(initData_actionDetailMap)) {
                if (action.hrid.includes("/combat/") && action.name === monsterName) {
                    actionObj = action;
                }
            }
            const actionCategoryHrid = actionObj?.category;
            const index = initData_actionCategoryDetailMap?.[actionCategoryHrid]?.sortIndex;
            if (index) {
                if (!div.querySelector("span.script_taskMapIndex")) {
                    div.insertAdjacentHTML("beforeend", `<span class="script_taskMapIndex" style="text-align: right; color: green;"> 图 ${index}</span>`);
                }
            }
        }
    }
    setInterval(handleTaskCard, 500);

    /* 显示战斗地图序号 */
    function addIndexToMaps() {
        const buttons = document.querySelectorAll(
            "div.MainPanel_subPanelContainer__1i-H9 div.CombatPanel_tabsComponentContainer__GsQlg div.MuiTabs-root.MuiTabs-vertical.css-6x4ics button.MuiButtonBase-root.MuiTab-root.MuiTab-textColorPrimary.css-1q2h7u5 span.MuiBadge-root.TabsComponent_badge__1Du26.css-1rzb3uu"
        );
        let index = 1;
        for (const button of buttons) {
            if (!button.querySelector("span.script_mapIndex")) {
                button.insertAdjacentHTML("afterbegin", `<span class="script_mapIndex" style="color: green;">${index++}. </span>`);
            }
        }
    }
    setInterval(addIndexToMaps, 500);

    /* 物品词典窗口显示还需多少技能书到X级 */
    const waitForItemDict = () => {
        const targetNode = document.querySelector("div.GamePage_gamePage__ixiPl");
        if (targetNode) {
            console.log("start observe item dict");
            const itemDictPanelObserver = new MutationObserver(async function (mutations) {
                for (const mutation of mutations) {
                    for (const added of mutation.addedNodes) {
                        if (added?.classList?.contains("Modal_modalContainer__3B80m") && added.querySelector("div.ItemDictionary_modalContent__WvEBY")) {
                            handleItemDict(added.querySelector("div.ItemDictionary_modalContent__WvEBY"));
                        }
                    }
                }
            });
            itemDictPanelObserver.observe(targetNode, { attributes: false, childList: true, subtree: true });
        } else {
            setTimeout(waitForItemDict, 200);
        }
    };

    function handleItemDict(panel) {
        const itemName = panel.querySelector("div.ItemDictionary_title__27cTd").textContent.toLowerCase().replaceAll(" ", "_");
        let abilityHrid = null;
        for (const skillHrid of Object.keys(initData_abilityDetailMap)) {
            if (skillHrid.includes(itemName)) {
                abilityHrid = skillHrid;
            }
        }
        if (!abilityHrid) {
            return;
        }
        const itemHrid = "/items/" + itemName;
        const abilityPerBookExp = initData_itemDetailMap[itemHrid]?.abilityBookDetail?.experienceGain;

        let currentLevel = 0;
        let currentExp = 0;
        for (const a of Object.values(initData_characterAbilities)) {
            if (a.abilityHrid === abilityHrid) {
                currentLevel = a.level;
                currentExp = a.experience;
            }
        }

        const getNeedBooksToLevel = (currentLevel, currentExp, targetLevel, abilityPerBookExp) => {
            const needExp = initData_levelExperienceTable[targetLevel] - currentExp;
            let needBooks = needExp / abilityPerBookExp;
            if (currentLevel === 0) {
                needBooks += 1;
            }
            return needBooks.toFixed(1);
        };

        let numBooks = getNeedBooksToLevel(currentLevel, currentExp, currentLevel + 1, abilityPerBookExp);
        let hTMLStr = `<div id="tillLevel" style="color: Green; text-align: left;">到 <input id="tillLevelInput" type="number" value="${currentLevel + 1}" min="${
            currentLevel + 1
        }" max="200"> 级还需 <span id="tillLevelNumber">${numBooks} 本书 (刷新网页更新当前等级)</span></div>`;
        panel.insertAdjacentHTML("beforeend", hTMLStr);
        const tillLevelInput = panel.querySelector("input#tillLevelInput");
        const tillLevelNumber = panel.querySelector("span#tillLevelNumber");
        tillLevelInput.onchange = () => {
            const targetLevel = Number(tillLevelInput.value);
            if (targetLevel > currentLevel && targetLevel <= 200) {
                let numBooks = getNeedBooksToLevel(currentLevel, currentExp, targetLevel, abilityPerBookExp);
                tillLevelNumber.textContent = `${numBooks} 本书 (刷新网页更新当前等级)`;
            } else {
                tillLevelNumber.textContent = "Error";
            }
        };
        tillLevelInput.addEventListener("keyup", function (evt) {
            const targetLevel = Number(tillLevelInput.value);
            if (targetLevel > currentLevel && targetLevel <= 200) {
                let numBooks = getNeedBooksToLevel(currentLevel, currentExp, targetLevel, abilityPerBookExp);
                tillLevelNumber.textContent = `${numBooks} 本书 (刷新网页更新当前等级)`;
            } else {
                tillLevelNumber.textContent = "Error";
            }
        });
    }
})();
