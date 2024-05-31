// ==UserScript==
// @name         MWITools
// @namespace    http://tampermonkey.net/
// @version      10.2
// @description  Tools for MilkyWayIdle. Shows total action time. Shows market prices. Shows action number quick inputs. Shows how many actions are needed to reach certain skill level. Shows skill exp percentages. Shows total networth. Shows combat summary. Shows combat maps index. Shows item level on item icons. Shows how many ability books are needed to reach certain level. Shows market equipment filters.
// @author       bot7420
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @connect      raw.githubusercontent.com
// @connect      43.129.194.214
// @require      https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.2/math.js
// ==/UserScript==

/* 插件说明见游戏左侧栏下方绿字链接 */

(() => {
    "use strict";

    /* 自定义插件字体颜色 */
    /* 找颜色自行网上搜索"CSS颜色" */
    /* 可以是颜色名称，比如"red"；也可以是颜色Hex，比如"#ED694D" */
    const SCRIPT_COLOR_MAIN = "green"; // 脚本主要字体颜色
    const SCRIPT_COLOR_TOOLTIP = "darkgreen"; // 物品悬浮窗的字体颜色
    const SCRIPT_COLOR_ALERT = "red"; // 警告字体颜色

    const MARKET_API_URL = "https://raw.githubusercontent.com/holychikenz/MWIApi/main/medianmarket.json";
    const MARKET_API_URL_BACKUP = "http://43.129.194.214:5500/apijson";

    let settingsMap = {
        totalActionTime: {
            id: "totalActionTime",
            desc: "左上角显示：当前动作预计总耗时、预计何时完成",
            isTrue: true,
        },
        actionPanel_totalTime: {
            id: "actionPanel_totalTime",
            desc: "动作面板显示：动作预计总耗时、到多少级还需做多少次、每小时经验",
            isTrue: true,
        },
        actionPanel_foragingTotal: {
            id: "actionPanel_foragingTotal",
            desc: "动作面板显示：采摘综合图显示综合收益 [依赖上一项]",
            isTrue: true,
        },
        networth: {
            id: "networth",
            desc: "右上角显示：Networth总资产(+2及以上物品按强化模拟成本计算)",
            isTrue: true,
        },
        invWorth: {
            id: "invWorth",
            desc: "仓库搜索栏显示：仓库中物品总价值 [依赖上一项]",
            isTrue: true,
        },
        itemTooltip_prices: {
            id: "itemTooltip_prices",
            desc: "物品悬浮窗显示：24小时市场均价",
            isTrue: true,
        },
        itemTooltip_profit: {
            id: "itemTooltip_profit",
            desc: "物品悬浮窗显示：生产成本和利润计算 [依赖上一项]",
            isTrue: true,
        },
        showConsumTips: {
            id: "showConsumTips",
            desc: "物品悬浮窗显示：消耗品回血回魔速度、回复性价比、每天最多消耗数量",
            isTrue: true,
        },
        networkAlert: {
            id: "networkAlert",
            desc: "右上角显示：无法联网更新市场数据时，红字警告",
            isTrue: true,
        },
        expPercentage: {
            id: "expPercentage",
            desc: "左侧栏显示：技能经验百分比",
            isTrue: true,
        },
        battlePanel: {
            id: "battlePanel",
            desc: "战斗总结面板（战斗时点击玩家头像）显示：平均每小时战斗次数、收入、经验",
            isTrue: true,
        },
        itemIconLevel: {
            id: "itemIconLevel",
            desc: "装备图标右上角显示：装备等级",
            isTrue: true,
        },
        marketFilter: {
            id: "marketFilter",
            desc: "市场页面显示：装备按等级、职业、部位筛选",
            isTrue: true,
        },
        taskMapIndex: {
            id: "taskMapIndex",
            desc: "任务页面显示：目标战斗地图序号",
            isTrue: true,
        },
        mapIndex: {
            id: "mapIndex",
            desc: "战斗地图选择页面显示：地图序号",
            isTrue: true,
        },
        skillbook: {
            id: "skillbook",
            desc: "技能书的物品词典面板显示：到多少级还需要多少本技能书",
            isTrue: true,
        },
        ThirdPartyLinks: {
            id: "ThirdPartyLinks",
            desc: "左侧菜单栏显示：第三方工具网站链接、脚本设置链接、脚本说明链接",
            isTrue: true,
        },
        actionQueue: {
            id: "actionQueue",
            desc: "上方动作队列菜单显示：队列中每个动作预计总时间、到何时完成",
            isTrue: true,
        },
        enhanceSim: {
            id: "enhanceSim",
            desc: "带强化等级的装备的悬浮菜单显示：强化模拟计算",
            isTrue: true,
        },
        checkEquipment: {
            id: "checkEquipment",
            desc: "页面上方显示：战斗时穿了生产装备，或者生产时没有穿对应的生产装备而仓库里有，红字警告",
            isTrue: true,
        },
        notifiEmptyAction: {
            id: "notifiEmptyAction",
            desc: "弹窗通知：正在空闲（游戏网页打开时才有效）",
            isTrue: true,
        },
        tryBackupApiUrl: {
            id: "tryBackupApiUrl",
            desc: "无法从Github更新市场数据时，尝试使用备份地址（备份地址不保证长期维护）",
            isTrue: true,
        },
        fillMarketOrderPrice: {
            id: "fillMarketOrderPrice",
            desc: "发布市场订单时自动填写为最小压价",
            isTrue: true,
        },
    };
    readSettings();

    const MARKET_JSON_LOCAL_BACKUP = `{"time":1716313502,"market":{"Amber":{"ask":6400,"bid":6200},"Amethyst":{"ask":94000,"bid":90000},"Apple":{"ask":11,"bid":4},"Apple Gummy":{"ask":15,"bid":11},"Apple Yogurt":{"ask":230,"bid":100},"Aqua Arrow":{"ask":17000,"bid":16500},"Aqua Essence":{"ask":26.5,"bid":20},"Arabica Coffee Bean":{"ask":140,"bid":110},"Arcane Bow":{"ask":210000,"bid":205000},"Arcane Crossbow":{"ask":235000,"bid":185000},"Arcane Fire Staff":{"ask":185000,"bid":-1},"Arcane Log":{"ask":250,"bid":215},"Arcane Lumber":{"ask":880,"bid":820},"Arcane Nature Staff":{"ask":295000,"bid":-1},"Arcane Water Staff":{"ask":185000,"bid":-1},"Artisan Tea":{"ask":760,"bid":660},"Attack Coffee":{"ask":370,"bid":-1},"Azure Boots":{"ask":19500,"bid":1350},"Azure Brush":{"ask":49000,"bid":2150},"Azure Buckler":{"ask":27500,"bid":-1},"Azure Bulwark":{"ask":30000,"bid":-1},"Azure Cheese":{"ask":350,"bid":320},"Azure Chisel":{"ask":62000,"bid":2050},"Azure Enhancer":{"ask":48000,"bid":-1},"Azure Gauntlets":{"ask":19500,"bid":9800},"Azure Hammer":{"ask":31000,"bid":-1},"Azure Hatchet":{"ask":50000,"bid":-1},"Azure Helmet":{"ask":25000,"bid":7200},"Azure Mace":{"ask":44000,"bid":10500},"Azure Milk":{"ask":89,"bid":78},"Azure Needle":{"ask":39000,"bid":-1},"Azure Plate Body":{"ask":64000,"bid":15500},"Azure Plate Legs":{"ask":62000,"bid":12500},"Azure Pot":{"ask":48500,"bid":-1},"Azure Shears":{"ask":27000,"bid":-1},"Azure Spatula":{"ask":37000,"bid":6000},"Azure Spear":{"ask":44000,"bid":17000},"Azure Sword":{"ask":44000,"bid":-1},"Bamboo Boots":{"ask":45000,"bid":-1},"Bamboo Branch":{"ask":48,"bid":32},"Bamboo Fabric":{"ask":300,"bid":250},"Bamboo Gloves":{"ask":39000,"bid":-1},"Bamboo Hat":{"ask":49000,"bid":-1},"Bamboo Robe Bottoms":{"ask":29000,"bid":-1},"Bamboo Robe Top":{"ask":49000,"bid":-1},"Bear Essence":{"ask":56,"bid":54},"Beast Boots":{"ask":29000,"bid":-1},"Beast Bracers":{"ask":35000,"bid":-1},"Beast Chaps":{"ask":180000,"bid":20000},"Beast Hide":{"ask":21,"bid":20},"Beast Hood":{"ask":200000,"bid":-1},"Beast Leather":{"ask":282.5,"bid":260},"Beast Tunic":{"ask":94000,"bid":-1},"Berserk":{"ask":310000,"bid":300000},"Birch Bow":{"ask":-1,"bid":-1},"Birch Crossbow":{"ask":25000,"bid":-1},"Birch Fire Staff":{"ask":45000,"bid":-1},"Birch Log":{"ask":72,"bid":52},"Birch Lumber":{"ask":245,"bid":200},"Birch Nature Staff":{"ask":22500,"bid":3400},"Birch Water Staff":{"ask":28500,"bid":-1},"Black Bear Fluff":{"ask":47000,"bid":46000},"Black Bear Shoes":{"ask":252500,"bid":60000},"Black Tea Leaf":{"ask":21,"bid":18},"Blackberry":{"ask":29,"bid":25},"Blackberry Cake":{"ask":330,"bid":260},"Blackberry Donut":{"ask":320,"bid":100},"Blessed Tea":{"ask":840,"bid":580},"Blueberry":{"ask":20,"bid":17},"Blueberry Cake":{"ask":260,"bid":100},"Blueberry Donut":{"ask":200,"bid":90},"Brewing Tea":{"ask":90,"bid":84},"Burble Brush":{"ask":62000,"bid":10500},"Burble Buckler":{"ask":50000,"bid":-1},"Burble Bulwark":{"ask":43000,"bid":-1},"Burble Chisel":{"ask":62000,"bid":22500},"Burble Enhancer":{"ask":66000,"bid":2599.5},"Burble Gauntlets":{"ask":76000,"bid":10000},"Burble Hatchet":{"ask":62000,"bid":25500},"Burble Helmet":{"ask":45000,"bid":11000},"Burble Mace":{"ask":100000,"bid":25500},"Burble Needle":{"ask":56000,"bid":5200},"Burble Plate Body":{"ask":92000,"bid":31000},"Burble Pot":{"ask":43000,"bid":-1},"Burble Shears":{"ask":64000,"bid":-1},"Burble Spatula":{"ask":50000,"bid":8200},"Burble Sword":{"ask":110000,"bid":-1},"Burble Tea Leaf":{"ask":115,"bid":100},"Cedar Bow":{"ask":44000,"bid":-1},"Cedar Fire Staff":{"ask":37000,"bid":15000},"Cedar Log":{"ask":70,"bid":64},"Cedar Lumber":{"ask":320,"bid":275},"Cedar Water Staff":{"ask":45000,"bid":6600},"Centaur Boots":{"ask":1100000,"bid":-1},"Centaur Hoof":{"ask":160000,"bid":155000},"Cheese Boots":{"ask":4100,"bid":-1},"Cheese Brush":{"ask":4000,"bid":115},"Cheese Buckler":{"ask":720,"bid":-1},"Cheese Chisel":{"ask":4000,"bid":150},"Cheese Enhancer":{"ask":1800,"bid":115},"Cheese Gauntlets":{"ask":7000,"bid":-1},"Cheese Hammer":{"ask":3500,"bid":-1},"Cheese Helmet":{"ask":35000,"bid":-1},"Cheese Mace":{"ask":20000,"bid":-1},"Cheese Plate Body":{"ask":17500,"bid":150},"Cheese Plate Legs":{"ask":14000,"bid":-1},"Cheese Pot":{"ask":3900,"bid":350},"Cheese Spatula":{"ask":4300,"bid":145},"Cheese Spear":{"ask":14500,"bid":2000},"Cheese Sword":{"ask":8000,"bid":180},"Cleave":{"ask":140000,"bid":110000},"Cocoon":{"ask":130,"bid":96},"Coin":{"ask":-1,"bid":-1},"Cotton":{"ask":30,"bid":23},"Cotton Boots":{"ask":2100,"bid":-1},"Cotton Fabric":{"ask":120,"bid":70},"Cotton Hat":{"ask":7000,"bid":-1},"Cotton Robe Bottoms":{"ask":6600,"bid":-1},"Cotton Robe Top":{"ask":1500,"bid":-1},"Crab Pincer":{"ask":16500,"bid":15000},"Crafting Tea":{"ask":270,"bid":190},"Crimson Boots":{"ask":45000,"bid":20000},"Crimson Buckler":{"ask":46000,"bid":-1},"Crimson Bulwark":{"ask":26000,"bid":-1},"Crimson Cheese":{"ask":420,"bid":295},"Crimson Enhancer":{"ask":88000,"bid":50000},"Crimson Gauntlets":{"ask":45000,"bid":34000},"Crimson Hammer":{"ask":76000,"bid":20500},"Crimson Helmet":{"ask":-1,"bid":-1},"Crimson Mace":{"ask":64000,"bid":30000},"Crimson Milk":{"ask":98,"bid":90},"Crimson Plate Body":{"ask":185000,"bid":-1},"Crimson Plate Legs":{"ask":80000,"bid":44000},"Crimson Pot":{"ask":67000,"bid":40000},"Crimson Spatula":{"ask":64000,"bid":-1},"Crimson Spear":{"ask":140000,"bid":28500},"Crimson Sword":{"ask":105000,"bid":14000},"Crushed Amber":{"ask":430,"bid":350},"Crushed Amethyst":{"ask":6000,"bid":5600},"Crushed Garnet":{"ask":980,"bid":890},"Crushed Moonstone":{"ask":2300,"bid":1750},"Crushed Pearl":{"ask":1000,"bid":780},"Cupcake":{"ask":280,"bid":54},"Donut":{"ask":140,"bid":56},"Dragon Fruit":{"ask":130,"bid":120},"Dragon Fruit Gummy":{"ask":430,"bid":400},"Earrings Of Armor":{"ask":2900000,"bid":1050000},"Earrings Of Gathering":{"ask":4200000,"bid":54000},"Earrings Of Regeneration":{"ask":4000000,"bid":3100000},"Earrings Of Resistance":{"ask":3250000,"bid":500000},"Efficiency Tea":{"ask":580,"bid":520},"Elemental Affinity":{"ask":500000,"bid":450000},"Emp Tea Leaf":{"ask":96,"bid":84},"Enhancing Tea":{"ask":480,"bid":270},"Excelsa Coffee Bean":{"ask":255,"bid":240},"Eyessence":{"ask":98,"bid":42},"Fieriosa Coffee Bean":{"ask":260,"bid":235},"Fireball":{"ask":12000,"bid":11000},"Flame Arrow":{"ask":19000,"bid":11500},"Flame Blast":{"ask":150000,"bid":140000},"Flaming Cloth":{"ask":36000,"bid":35000},"Flaming Robe Top":{"ask":180000,"bid":80000},"Flax":{"ask":82,"bid":39.5},"Foraging Tea":{"ask":165,"bid":18},"Garnet":{"ask":14500,"bid":14000},"Gathering Tea":{"ask":360,"bid":310},"Giant Pouch":{"ask":6000000,"bid":5400000},"Ginkgo Bow":{"ask":150000,"bid":-1},"Ginkgo Crossbow":{"ask":150000,"bid":27500},"Ginkgo Log":{"ask":62,"bid":34},"Ginkgo Lumber":{"ask":270,"bid":220},"Ginkgo Nature Staff":{"ask":76000,"bid":-1},"Gobo Boomstick":{"ask":22500,"bid":-1},"Gobo Boots":{"ask":36000,"bid":22500},"Gobo Bracers":{"ask":38000,"bid":-1},"Gobo Essence":{"ask":34,"bid":26},"Gobo Hide":{"ask":17.5,"bid":13},"Gobo Hood":{"ask":29500,"bid":13000},"Gobo Shooter":{"ask":27000,"bid":-1},"Gobo Slasher":{"ask":27000,"bid":20000},"Gobo Smasher":{"ask":20500,"bid":-1},"Gobo Tunic":{"ask":39000,"bid":22500},"Goggles":{"ask":49000,"bid":46000},"Golem Essence":{"ask":245,"bid":205},"Granite Bludgeon":{"ask":-1,"bid":40000000},"Green Tea Leaf":{"ask":19,"bid":18},"Grizzly Bear Fluff":{"ask":45000,"bid":44000},"Gummy":{"ask":390,"bid":100},"Heal":{"ask":185000,"bid":150000},"Holy Boots":{"ask":94000,"bid":-1},"Holy Buckler":{"ask":54000,"bid":-1},"Holy Bulwark":{"ask":130000,"bid":-1},"Holy Cheese":{"ask":860,"bid":820},"Holy Enhancer":{"ask":175000,"bid":150000},"Holy Gauntlets":{"ask":270000,"bid":-1},"Holy Hammer":{"ask":210000,"bid":92000},"Holy Helmet":{"ask":110000,"bid":-1},"Holy Mace":{"ask":295000,"bid":-1},"Holy Milk":{"ask":275,"bid":270},"Holy Plate Body":{"ask":285000,"bid":140000},"Holy Plate Legs":{"ask":175000,"bid":-1},"Holy Pot":{"ask":170000,"bid":100000},"Holy Spatula":{"ask":185000,"bid":155000},"Holy Spear":{"ask":235000,"bid":-1},"Holy Sword":{"ask":205000,"bid":-1},"Icy Cloth":{"ask":22500,"bid":21000},"Icy Robe Bottoms":{"ask":88000,"bid":40000},"Icy Robe Top":{"ask":100000,"bid":60000},"Jade":{"ask":34000,"bid":32000},"Jungle Essence":{"ask":54,"bid":47},"Large Artisan's Crate":{"ask":-1,"bid":-1},"Large Pouch":{"ask":900000,"bid":700000},"Large Treasure Chest":{"ask":-1,"bid":-1},"Liberica Coffee Bean":{"ask":215,"bid":205},"Linen Boots":{"ask":16500,"bid":5000},"Linen Gloves":{"ask":12000,"bid":5000},"Linen Hat":{"ask":38000,"bid":5000},"Linen Robe Bottoms":{"ask":22500,"bid":5000},"Living Granite":{"ask":2450000,"bid":2350000},"Log":{"ask":42.5,"bid":30},"Lucky Coffee":{"ask":910,"bid":740},"Magic Coffee":{"ask":400,"bid":360},"Magnet":{"ask":54000,"bid":31000},"Magnifying Glass":{"ask":390000,"bid":330000},"Maim":{"ask":92000,"bid":70000},"Marsberry":{"ask":35,"bid":30},"Marsberry Donut":{"ask":445,"bid":390},"Medium Artisan's Crate":{"ask":-1,"bid":-1},"Medium Meteorite Cache":{"ask":-1,"bid":-1},"Medium Treasure Chest":{"ask":-1,"bid":-1},"Milk":{"ask":32,"bid":31},"Milking Tea":{"ask":220,"bid":100},"Minor Heal":{"ask":23500,"bid":14500},"Mooberry":{"ask":68,"bid":60},"Mooberry Cake":{"ask":460,"bid":410},"Mooberry Donut":{"ask":420,"bid":265},"Moonstone":{"ask":40000,"bid":39000},"Necklace Of Efficiency":{"ask":9600000,"bid":-1},"Necklace Of Wisdom":{"ask":6800000,"bid":5400000},"Orange Gummy":{"ask":34,"bid":28},"Orange Yogurt":{"ask":232.5,"bid":145},"Panda Gloves":{"ask":390000,"bid":-1},"Peach":{"ask":49,"bid":34},"Peach Gummy":{"ask":222.5,"bid":205},"Pearl":{"ask":13500,"bid":13000},"Pierce":{"ask":72000,"bid":70000},"Pincer Gloves":{"ask":39000,"bid":10000},"Plum":{"ask":58,"bid":46},"Plum Yogurt":{"ask":310,"bid":230},"Poke":{"ask":6200,"bid":6000},"Power Coffee":{"ask":460,"bid":410},"Precision":{"ask":25000,"bid":10500},"Purpleheart Bow":{"ask":70000,"bid":11000},"Purpleheart Crossbow":{"ask":-1,"bid":26000},"Purpleheart Fire Staff":{"ask":66000,"bid":-1},"Purpleheart Lumber":{"ask":450,"bid":330},"Purpleheart Nature Staff":{"ask":78000,"bid":-1},"Purpleheart Water Staff":{"ask":185000,"bid":-1},"Quick Shot":{"ask":4500,"bid":3500},"Radiant Fabric":{"ask":660,"bid":600},"Radiant Fiber":{"ask":96,"bid":88},"Radiant Gloves":{"ask":74000,"bid":-1},"Radiant Robe Bottoms":{"ask":165000,"bid":130000},"Radiant Robe Top":{"ask":165000,"bid":-1},"Rain Of Arrows":{"ask":215000,"bid":200000},"Rainbow Brush":{"ask":120000,"bid":45000},"Rainbow Buckler":{"ask":29000,"bid":-1},"Rainbow Bulwark":{"ask":49000,"bid":-1},"Rainbow Chisel":{"ask":120000,"bid":64000},"Rainbow Enhancer":{"ask":86000,"bid":74000},"Rainbow Gauntlets":{"ask":94000,"bid":-1},"Rainbow Hatchet":{"ask":100000,"bid":30000},"Rainbow Helmet":{"ask":155000,"bid":-1},"Rainbow Mace":{"ask":110000,"bid":-1},"Rainbow Needle":{"ask":70000,"bid":31000},"Rainbow Plate Body":{"ask":-1,"bid":78000},"Rainbow Plate Legs":{"ask":150000,"bid":-1},"Rainbow Shears":{"ask":90000,"bid":33000},"Rainbow Spatula":{"ask":56000,"bid":30000},"Rainbow Spear":{"ask":175000,"bid":-1},"Ranged Coffee":{"ask":540,"bid":455},"Ranger Necklace":{"ask":7000000,"bid":5600000},"Red Tea Leaf":{"ask":72,"bid":63},"Redwood Crossbow":{"ask":122500,"bid":-1},"Redwood Fire Staff":{"ask":64000,"bid":-1},"Redwood Log":{"ask":33,"bid":28},"Redwood Nature Staff":{"ask":115000,"bid":-1},"Redwood Water Staff":{"ask":62000,"bid":-1},"Reptile Boots":{"ask":52000,"bid":580},"Reptile Chaps":{"ask":10000,"bid":1100},"Reptile Hide":{"ask":11.5,"bid":7},"Reptile Hood":{"ask":16000,"bid":-1},"Reptile Tunic":{"ask":13500,"bid":-1},"Ring Of Armor":{"ask":5400000,"bid":1300000},"Ring Of Gathering":{"ask":5000000,"bid":350000},"Ring Of Regeneration":{"ask":4100000,"bid":3000000},"Ring Of Resistance":{"ask":2100000,"bid":500000},"Robusta Coffee Bean":{"ask":175,"bid":170},"Rough Bracers":{"ask":-1,"bid":-1},"Rough Chaps":{"ask":-1,"bid":-1},"Rough Hide":{"ask":105,"bid":52},"Rough Leather":{"ask":270,"bid":255},"Rough Tunic":{"ask":2150,"bid":-1},"Scratch":{"ask":3200,"bid":1900},"Silk Boots":{"ask":40000,"bid":-1},"Silk Fabric":{"ask":660,"bid":620},"Silk Gloves":{"ask":62000,"bid":-1},"Silk Robe Bottoms":{"ask":210000,"bid":-1},"Silk Robe Top":{"ask":74000,"bid":-1},"Smack":{"ask":8000,"bid":7600},"Small Meteorite Cache":{"ask":-1,"bid":-1},"Small Pouch":{"ask":30000,"bid":-1},"Snail Shell":{"ask":5600,"bid":2550},"Snail Shell Helmet":{"ask":9400,"bid":-1},"Snake Fang":{"ask":2925,"bid":2050},"Sorcerer Boots":{"ask":200000,"bid":155000},"Sorcerer Essence":{"ask":120,"bid":110},"Sorcerer's Sole":{"ask":72000,"bid":70000},"Spaceberry Cake":{"ask":920,"bid":900},"Spaceberry Donut":{"ask":600,"bid":560},"Spacia Coffee Bean":{"ask":450,"bid":420},"Stalactite Shard":{"ask":2050000,"bid":1750000},"Stalactite Spear":{"ask":-1,"bid":26000000},"Stamina Coffee":{"ask":285,"bid":270},"Star Fruit":{"ask":235,"bid":222.5},"Star Fruit Gummy":{"ask":600,"bid":560},"Star Fruit Yogurt":{"ask":830,"bid":800},"Strawberry Cake":{"ask":440,"bid":400},"Strawberry Donut":{"ask":450,"bid":215},"Stunning Blow":{"ask":480000,"bid":400000},"Super Attack Coffee":{"ask":1450,"bid":1100},"Super Brewing Tea":{"ask":860,"bid":170},"Super Cheesesmithing Tea":{"ask":2100,"bid":1800},"Super Crafting Tea":{"ask":3600,"bid":230},"Super Defense Coffee":{"ask":1750,"bid":1250},"Super Enhancing Tea":{"ask":1700,"bid":270},"Super Foraging Tea":{"ask":3450,"bid":125},"Super Magic Coffee":{"ask":6600,"bid":6100},"Super Milking Tea":{"ask":1500,"bid":430},"Super Power Coffee":{"ask":2250,"bid":2150},"Super Stamina Coffee":{"ask":1900,"bid":1700},"Super Tailoring Tea":{"ask":6400,"bid":275},"Super Woodcutting Tea":{"ask":2250,"bid":900},"Sweep":{"ask":90000,"bid":81000},"Swiftness Coffee":{"ask":820,"bid":760},"Tailoring Tea":{"ask":780,"bid":250},"Tome Of The Elements":{"ask":290000,"bid":270000},"Toughness":{"ask":37000,"bid":36000},"Toxic Pollen":{"ask":195000,"bid":160000},"Turtle Shell Body":{"ask":25000,"bid":9000},"Turtle Shell Legs":{"ask":56000,"bid":6000},"Twilight Essence":{"ask":245,"bid":220},"Umbral Bracers":{"ask":76000,"bid":-1},"Umbral Chaps":{"ask":150000,"bid":88000},"Umbral Hide":{"ask":46.5,"bid":35},"Umbral Leather":{"ask":440,"bid":380},"Umbral Tunic":{"ask":140000,"bid":96000},"Vampire Fang":{"ask":1325000,"bid":1275000},"Vampirism":{"ask":30000,"bid":25000},"Verdant Boots":{"ask":8900,"bid":-1},"Verdant Brush":{"ask":15000,"bid":900},"Verdant Bulwark":{"ask":12500,"bid":980},"Verdant Cheese":{"ask":255,"bid":222.5},"Verdant Chisel":{"ask":8000,"bid":560},"Verdant Gauntlets":{"ask":9800,"bid":-1},"Verdant Hammer":{"ask":7000,"bid":700},"Verdant Hatchet":{"ask":33000,"bid":620},"Verdant Mace":{"ask":22000,"bid":-1},"Verdant Milk":{"ask":54,"bid":50},"Verdant Needle":{"ask":30000,"bid":560},"Verdant Plate Legs":{"ask":35000,"bid":-1},"Verdant Pot":{"ask":29500,"bid":1900},"Verdant Shears":{"ask":15000,"bid":960},"Verdant Spear":{"ask":22000,"bid":-1},"Verdant Sword":{"ask":22000,"bid":-1},"Vision Helmet":{"ask":37000,"bid":-1},"Water Strike":{"ask":16000,"bid":15500},"Werewolf Claw":{"ask":1100000,"bid":1000000},"Werewolf Slasher":{"ask":18000000,"bid":4000000},"Wisdom Coffee":{"ask":780,"bid":740},"Wisdom Tea":{"ask":580,"bid":520},"Wizard Necklace":{"ask":6200000,"bid":1900000},"Wooden Bow":{"ask":9000,"bid":-1},"Wooden Crossbow":{"ask":4900,"bid":-1},"Wooden Fire Staff":{"ask":1050,"bid":-1},"Wooden Water Staff":{"ask":5000,"bid":-1},"Yogurt":{"ask":340,"bid":115},"Burble Boots":{"ask":62000,"bid":15000},"Burble Cheese":{"ask":360,"bid":300},"Burble Hammer":{"ask":42000,"bid":15500},"Burble Milk":{"ask":107.5,"bid":98},"Cedar Nature Staff":{"ask":42000,"bid":9749.5},"Cheese":{"ask":150,"bid":96},"Cheese Bulwark":{"ask":3800,"bid":-1},"Cheese Hatchet":{"ask":20000,"bid":150},"Cheese Needle":{"ask":12500,"bid":130},"Cheese Shears":{"ask":5800,"bid":150},"Cheesesmithing Tea":{"ask":470,"bid":105},"Cooking Tea":{"ask":370,"bid":125},"Cotton Gloves":{"ask":1750,"bid":-1},"Cowbell":{"ask":-1,"bid":-1},"Crimson Brush":{"ask":80000,"bid":-1},"Crimson Chisel":{"ask":80000,"bid":-1},"Crimson Hatchet":{"ask":80000,"bid":-1},"Crimson Shears":{"ask":70000,"bid":28000},"Critical Coffee":{"ask":1750,"bid":1600},"Crushed Jade":{"ask":2050,"bid":1900},"Defense Coffee":{"ask":390,"bid":350},"Dragon Fruit Yogurt":{"ask":500,"bid":470},"Flaming Robe Bottoms":{"ask":130000,"bid":62000},"Frenzy":{"ask":110000,"bid":94000},"Gobo Leather":{"ask":290,"bid":250},"Holy Chisel":{"ask":200000,"bid":150000},"Holy Hatchet":{"ask":150000,"bid":66000},"Holy Needle":{"ask":160000,"bid":62000},"Holy Shears":{"ask":200000,"bid":160000},"Ice Spear":{"ask":78000,"bid":74000},"Intelligence Coffee":{"ask":330,"bid":270},"Linen Fabric":{"ask":370,"bid":255},"Linen Robe Top":{"ask":16000,"bid":5000},"Lumber":{"ask":185,"bid":140},"Mirror Of Protection":{"ask":5200000,"bid":5000000},"Moolong Tea Leaf":{"ask":76,"bid":62},"Orange":{"ask":8,"bid":7},"Panda Fluff":{"ask":50000,"bid":42000},"Peach Yogurt":{"ask":390,"bid":340},"Plum Gummy":{"ask":106.5,"bid":90},"Processing Tea":{"ask":940,"bid":720},"Purpleheart Log":{"ask":112.5,"bid":90},"Radiant Boots":{"ask":45000,"bid":-1},"Radiant Hat":{"ask":130000,"bid":110000},"Rainbow Boots":{"ask":78000,"bid":19000},"Rainbow Cheese":{"ask":370,"bid":350},"Rainbow Hammer":{"ask":115000,"bid":56000},"Rainbow Milk":{"ask":94,"bid":88},"Rainbow Pot":{"ask":76000,"bid":30000},"Rainbow Sword":{"ask":185000,"bid":-1},"Redwood Bow":{"ask":98000,"bid":-1},"Redwood Lumber":{"ask":170,"bid":130},"Reptile Bracers":{"ask":9500,"bid":580},"Reptile Leather":{"ask":340,"bid":240},"Ring Of Rare Find":{"ask":4400000,"bid":3000000},"Rough Boots":{"ask":900,"bid":-1},"Rough Hood":{"ask":10000,"bid":-1},"Shard Of Protection":{"ask":29000,"bid":28000},"Silk Hat":{"ask":68000,"bid":-1},"Small Artisan's Crate":{"ask":-1,"bid":-1},"Small Treasure Chest":{"ask":-1,"bid":-1},"Snake Fang Dirk":{"ask":7000,"bid":2500},"Spaceberry":{"ask":130,"bid":120},"Spike Shell":{"ask":267500,"bid":215000},"Star Fragment":{"ask":6600,"bid":6200},"Strawberry":{"ask":50,"bid":46},"Super Cooking Tea":{"ask":1200,"bid":520},"Super Intelligence Coffee":{"ask":1850,"bid":1650},"Super Ranged Coffee":{"ask":3500,"bid":3100},"Swamp Essence":{"ask":18,"bid":9.5},"Tome Of Healing":{"ask":35000,"bid":27500},"Turtle Shell":{"ask":6100,"bid":4500},"Umbral Boots":{"ask":92000,"bid":-1},"Umbral Hood":{"ask":105000,"bid":80000},"Vampire Fang Dirk":{"ask":26000000,"bid":21000000},"Verdant Buckler":{"ask":21000,"bid":-1},"Verdant Enhancer":{"ask":15000,"bid":560},"Verdant Helmet":{"ask":12500,"bid":2000},"Verdant Spatula":{"ask":35000,"bid":580},"Vision Shield":{"ask":215000,"bid":62000},"Wheat":{"ask":24.5,"bid":19.5},"Woodcutting Tea":{"ask":390,"bid":240},"Wooden Nature Staff":{"ask":4800,"bid":150},"Cedar Crossbow":{"ask":49000,"bid":-1},"Earrings Of Rare Find":{"ask":3800000,"bid":3500000},"Egg":{"ask":20,"bid":18},"Entangle":{"ask":4100,"bid":3100},"Fighter Necklace":{"ask":6800000,"bid":4600000},"Gator Vest":{"ask":6600,"bid":5200},"Ginkgo Fire Staff":{"ask":50000,"bid":-1},"Gobo Chaps":{"ask":46000,"bid":-1},"Gobo Stabber":{"ask":24000,"bid":-1},"Gourmet Tea":{"ask":390,"bid":350},"Grizzly Bear Shoes":{"ask":450000,"bid":105000},"Holy Brush":{"ask":205000,"bid":165000},"Large Meteorite Cache":{"ask":-1,"bid":-1},"Magnetic Gloves":{"ask":520000,"bid":-1},"Marsberry Cake":{"ask":500,"bid":470},"Medium Pouch":{"ask":72000,"bid":50000},"Polar Bear Fluff":{"ask":86000,"bid":80000},"Verdant Plate Body":{"ask":35000,"bid":1100},"Ginkgo Water Staff":{"ask":90000,"bid":14000},"Polar Bear Shoes":{"ask":700000,"bid":64000},"Sugar":{"ask":7,"bid":6},"Crimson Needle":{"ask":80000,"bid":-1},"Burble Plate Legs":{"ask":80000,"bid":22500},"Burble Spear":{"ask":76000,"bid":27000},"Arcane Shield":{"ask":90000,"bid":-1},"Birch Shield":{"ask":6000,"bid":480},"Cedar Shield":{"ask":23000,"bid":-1},"Ginkgo Shield":{"ask":56000,"bid":-1},"Purpleheart Shield":{"ask":33000,"bid":-1},"Redwood Shield":{"ask":44000,"bid":-1},"Sighted Bracers":{"ask":450000,"bid":310000},"Spiked Bulwark":{"ask":50000000,"bid":7400000},"Wooden Shield":{"ask":3750,"bid":96},"Advanced Task Ring":{"ask":-1,"bid":-1},"Basic Task Ring":{"ask":-1,"bid":-1},"Expert Task Ring":{"ask":-1,"bid":-1},"Purple's Gift":{"ask":-1,"bid":-1},"Task Crystal":{"ask":-1,"bid":-1},"Task Token":{"ask":-1,"bid":-1},"Abyssal Essence":{"ask":200,"bid":165},"Channeling Coffee":{"ask":680,"bid":640},"Chrono Gloves":{"ask":6600000,"bid":-1},"Chrono Sphere":{"ask":640000,"bid":600000},"Collector's Boots":{"ask":1550000,"bid":760000},"Colossus Core":{"ask":1200000,"bid":1100000},"Colossus Plate Body":{"ask":14000000,"bid":-1},"Colossus Plate Legs":{"ask":9600000,"bid":-1},"Demonic Core":{"ask":1200000,"bid":1150000},"Demonic Plate Body":{"ask":14000000,"bid":8000000},"Demonic Plate Legs":{"ask":13000000,"bid":6200000},"Elusiveness":{"ask":18000,"bid":17500},"Enchanted Gloves":{"ask":6600000,"bid":4700000},"Eye Of The Watcher":{"ask":620000,"bid":560000},"Eye Watch":{"ask":6400000,"bid":-1},"Firestorm":{"ask":500000,"bid":480000},"Fluffy Red Hat":{"ask":3700000,"bid":2950000},"Frost Sphere":{"ask":620000,"bid":600000},"Frost Staff":{"ask":5999999.5,"bid":11250000},"Frost Surge":{"ask":720000,"bid":660000},"Gobo Defender":{"ask":340000,"bid":262500},"Gobo Rag":{"ask":120000,"bid":110000},"Infernal Battlestaff":{"ask":40000000,"bid":24000000},"Infernal Ember":{"ask":1750000,"bid":1700000},"Luna Robe Bottoms":{"ask":1800000,"bid":-1},"Luna Robe Top":{"ask":1700000,"bid":400000},"Luna Wing":{"ask":215000,"bid":190000},"Marine Chaps":{"ask":2000000,"bid":-1},"Marine Scale":{"ask":215000,"bid":190000},"Marine Tunic":{"ask":1850000,"bid":-1},"Nature's Veil":{"ask":380000,"bid":250000},"Puncture":{"ask":240000,"bid":205000},"Red Chef's Hat":{"ask":4200000,"bid":2250000},"Red Panda Fluff":{"ask":380000,"bid":360000},"Revenant Anima":{"ask":1150000,"bid":1100000},"Revenant Chaps":{"ask":-1,"bid":7000000},"Revenant Tunic":{"ask":12000000,"bid":10000000},"Shoebill Feather":{"ask":27000,"bid":21500},"Shoebill Shoes":{"ask":330000,"bid":-1},"Silencing Shot":{"ask":260000,"bid":230000},"Soul Fragment":{"ask":1100000,"bid":1000000},"Soul Hunter Crossbow":{"ask":-1,"bid":5000000},"Steady Shot":{"ask":640000,"bid":600000},"Treant Bark":{"ask":11000,"bid":10000},"Treant Shield":{"ask":34000,"bid":-1},"Vampiric Bow":{"ask":26500000,"bid":10500000},"Watchful Relic":{"ask":7000000,"bid":450000},"Bag Of 10 Cowbells":{"ask":292500,"bid":280000},"Aqua Aura":{"ask":3200000,"bid":2150000},"Critical Aura":{"ask":12000000,"bid":8600000},"Fierce Aura":{"ask":11000000,"bid":10500000},"Flame Aura":{"ask":6200000,"bid":4300000},"Insanity":{"ask":9000000,"bid":7600000},"Invincible":{"ask":-1,"bid":41000000},"Provoke":{"ask":160000,"bid":105000},"Quick Aid":{"ask":960000,"bid":860000},"Rejuvenate":{"ask":960000,"bid":880000},"Revive":{"ask":980000,"bid":500000},"Speed Aura":{"ask":8400000,"bid":6600000},"Sylvan Aura":{"ask":4900000,"bid":2700000},"Taunt":{"ask":60000,"bid":41000}}}`;
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
    let currentEquipmentMap = {};

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
            if (socket.url.indexOf("api.milkywayidle.com/ws") <= -1 && socket.url.indexOf("api-test.milkywayidle.com/ws") <= -1) {
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
            if (settingsMap.totalActionTime.isTrue) {
                showTotalActionTime();
            }
            waitForActionPanelParent();
            if (settingsMap.skillbook.isTrue) {
                waitForItemDict();
            }
            if (settingsMap.ThirdPartyLinks.isTrue) {
                add3rdPartyLinks();
            }
            if (settingsMap.networth.isTrue) {
                calculateNetworth();
            }
            for (const item of obj.characterItems) {
                if (item.itemLocationHrid !== "/item_locations/inventory") {
                    currentEquipmentMap[item.itemLocationHrid] = item;
                }
            }
            if (settingsMap.checkEquipment.isTrue) {
                checkEquipment();
            }
            if (settingsMap.notifiEmptyAction.isTrue) {
                notificate();
            }
            if (settingsMap.fillMarketOrderPrice.isTrue) {
                waitForMarketOrders();
            }
        } else if (obj && obj.type === "init_client_data") {
            initData_actionDetailMap = obj.actionDetailMap;
            initData_levelExperienceTable = obj.levelExperienceTable;
            initData_itemDetailMap = obj.itemDetailMap;
            initData_actionCategoryDetailMap = obj.actionCategoryDetailMap;
            initData_abilityDetailMap = obj.abilityDetailMap;
        } else if (obj && obj.type === "actions_updated") {
            for (const action of obj.endCharacterActions) {
                if (action.isDone === false) {
                    currentActionsHridList.push(action);
                } else {
                    currentActionsHridList = currentActionsHridList.filter((o) => {
                        return o.id !== action.id;
                    });
                }
            }
            if (settingsMap.checkEquipment.isTrue) {
                checkEquipment();
            }
            if (settingsMap.notifiEmptyAction.isTrue) {
                notificate();
            }
        } else if (obj && obj.type === "battle_unit_fetched") {
            if (settingsMap.battlePanel.isTrue) {
                handleBattleSummary(obj);
            }
        } else if (obj && obj.type === "items_updated" && obj.endCharacterItems) {
            for (const item of obj.endCharacterItems) {
                if (item.itemLocationHrid !== "/item_locations/inventory") {
                    if (item.count === 0) {
                        currentEquipmentMap[item.itemLocationHrid] = null;
                    } else {
                        currentEquipmentMap[item.itemLocationHrid] = item;
                    }
                }
            }
            if (settingsMap.checkEquipment.isTrue) {
                checkEquipment();
            }
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
        let networthAskInv = 0;
        let networthBidInv = 0;
        for (const item of initData_characterItems) {
            const enhanceLevel = item.enhancementLevel;
            const itemName = initData_itemDetailMap[item.itemHrid].name;
            const marketPrices = marketAPIJson.market[itemName];
            if (enhanceLevel && enhanceLevel > 1) {
                input_data.item_hrid = item.itemHrid;
                input_data.stop_at = enhanceLevel;
                const best = await findBestEnhanceStrat(input_data);
                let totalCost = best?.totalCost;
                totalCost = totalCost ? Math.round(totalCost) : 0;
                networthAsk += item.count * (totalCost > 0 ? totalCost : 0);
                networthBid += item.count * (totalCost > 0 ? totalCost : 0);
            } else if (marketPrices) {
                networthAsk += item.count * (marketPrices.ask > 0 ? marketPrices.ask : 0);
                networthBid += item.count * (marketPrices.bid > 0 ? marketPrices.bid : 0);
                if (item.itemLocationHrid === "/item_locations/inventory" && itemName !== "Coin") {
                    networthAskInv += item.count * (marketPrices.ask > 0 ? marketPrices.ask : 0);
                    networthBidInv += item.count * (marketPrices.bid > 0 ? marketPrices.bid : 0);
                }
            } else {
                console.error("calculateNetworth cannot find price of " + itemName);
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
                if (!enhancementLevel || enhancementLevel <= 1) {
                    networthAsk += quantity * (marketPrices.ask > 0 ? marketPrices.ask : 0);
                    networthBid += quantity * (marketPrices.bid > 0 ? marketPrices.bid : 0);
                } else {
                    input_data.item_hrid = item.itemHrid;
                    input_data.stop_at = enhancementLevel;
                    const best = await findBestEnhanceStrat(input_data);
                    let totalCost = best?.totalCost;
                    totalCost = totalCost ? Math.round(totalCost) : 0;
                    networthAsk += quantity * (totalCost > 0 ? totalCost : 0);
                    networthBid += quantity * (totalCost > 0 ? totalCost : 0);
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

        if (settingsMap.invWorth.isTrue) {
            const waitForInvInput = () => {
                const targetNodes = document.querySelectorAll("input.Inventory_inventoryFilterInput__1Kiwh");
                for (const elem of targetNodes) {
                    elem.placeholder = `物品价值: ${numberFormatter(networthAskInv)} / ${numberFormatter(networthBidInv)}`;
                }
                setTimeout(waitForInvInput, 1000);
            };
            waitForInvInput();
        }

        const waitForHeader = () => {
            const targetNode = document.querySelector("div.Header_totalLevel__8LY3Q");
            if (targetNode) {
                targetNode.insertAdjacentHTML(
                    "afterend",
                    `<div>Networth: ${numberFormatter(networthAsk)} / ${numberFormatter(networthBid)}${
                        isUsingLocalMarketJson && settingsMap.networkAlert.isTrue
                            ? `<div style="color: ${SCRIPT_COLOR_ALERT}">网络问题无法更新市场数据</div>`
                            : ""
                    }</div>`
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
                const timePerActionSec = +getOriTextFromElement(document.querySelector(".ProgressBar_text__102Yn")).match(/[\d\.]+/)[0];
                const actionHrid = currentActionsHridList[0].actionHrid;
                let effBuff = 1 + getTotalEffiPercentage(actionHrid) / 100;
                if (actionHrid.includes("enhanc")) {
                    effBuff = 1;
                }
                const actualNumberOfTimes = Math.round(numOfTimes / effBuff);
                const totalTimeSeconds = actualNumberOfTimes * timePerActionSec;
                totalTimeStr = " [" + timeReadable(totalTimeSeconds) + "]";

                const currentTime = new Date();
                currentTime.setSeconds(currentTime.getSeconds() + totalTimeSeconds);
                totalTimeStr += ` ${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(2, "0")}:${String(
                    currentTime.getSeconds()
                ).padStart(2, "0")}`;
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

    GM_addStyle(`span.NavigationBar_label__1uH-y {
        width: 10px !important;
      }`);

    /* 物品 ToolTips */
    const tooltipObserver = new MutationObserver(async function (mutations) {
        for (const mutation of mutations) {
            for (const added of mutation.addedNodes) {
                if (added.classList.contains("MuiTooltip-popper")) {
                    if (added.querySelector("div.ItemTooltipText_name__2JAHA")) {
                        await handleTooltipItem(added);
                    } else if (added.querySelector("div.QueuedActions_queuedActionsEditMenu__3OoQH")) {
                        handleActionQueueMenue(added.querySelector("div.QueuedActions_queuedActionsEditMenu__3OoQH"));
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
        const itemNameElems = tooltip.querySelectorAll("div.ItemTooltipText_name__2JAHA span");
        if (itemNameElems.length > 1) {
            handleItemTooltipWithEnhancementLevel(tooltip);
            return;
        }
        const itemNameElem = itemNameElems[0];
        const itemName = getOriTextFromElement(itemNameElem);
        const amountSpan = tooltip.querySelectorAll("span")[1];
        let amount = 0;
        let insertAfterElem = null;
        if (amountSpan) {
            amount = +getOriTextFromElement(amountSpan).split(": ")[1].replaceAll(",", "");
            insertAfterElem = amountSpan.parentNode.nextSibling;
        } else {
            insertAfterElem = tooltip.querySelectorAll("span")[0].parentNode.nextSibling;
        }

        let appendHTMLStr = "";
        let jsonObj = null;
        let ask = null;
        let bid = null;

        if (settingsMap.itemTooltip_prices.isTrue) {
            jsonObj = await fetchMarketJSON();
            if (!jsonObj || !jsonObj.market) {
                console.error("jsonObj null");
            }
            if (!jsonObj.market[itemName]) {
                console.error("itemName not found in market API json: " + itemName);
            }
            // 市场价格
            ask = jsonObj?.market[itemName]?.ask;
            bid = jsonObj?.market[itemName]?.bid;
            appendHTMLStr += `
        <div style="color: ${SCRIPT_COLOR_TOOLTIP};">日均价: ${numberFormatter(ask)} / ${numberFormatter(bid)} (${
                ask && ask > 0 ? numberFormatter(ask * amount) : ""
            } / ${bid && bid > 0 ? numberFormatter(bid * amount) : ""})</div>
        `;
        }

        if (settingsMap.showConsumTips.isTrue) {
            // 消耗品回复计算
            let itemDetail = null;
            for (const item of Object.values(initData_itemDetailMap)) {
                if (item.name === itemName) {
                    itemDetail = item;
                }
            }
            const hp = itemDetail?.consumableDetail?.hitpointRestore;
            const mp = itemDetail?.consumableDetail?.manapointRestore;
            const cd = itemDetail?.consumableDetail?.cooldownDuration;
            if (hp && cd) {
                const hpPerMiniute = (60 / (cd / 1000000000)) * hp;
                const pricePer100Hp = ask ? ask / (hp / 100) : null;
                const usePerday = (24 * 60 * 60) / (cd / 1000000000);
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}">${
                    pricePer100Hp ? pricePer100Hp.toFixed(0) + "金/100hp, " : ""
                }${hpPerMiniute.toFixed(0)}hp/min, ${usePerday.toFixed(0)}个/天</div>`;
            } else if (mp && cd) {
                const mpPerMiniute = (60 / (cd / 1000000000)) * mp;
                const pricePer100Mp = ask ? ask / (mp / 100) : null;
                const usePerday = (24 * 60 * 60) / (cd / 1000000000);
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}">${
                    pricePer100Mp ? pricePer100Mp.toFixed(0) + "金/100mp, " : ""
                }${mpPerMiniute.toFixed(0)}mp/min, ${usePerday.toFixed(0)}个/天</div>`;
            } else if (cd) {
                const usePerday = (24 * 60 * 60) / (cd / 1000000000);
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}">${usePerday.toFixed(0)}个/天</div>`;
            }
        }

        // 生产利润计算
        if (settingsMap.itemTooltip_profit.isTrue && jsonObj) {
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

                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">原料价： ${numberFormatter(
                    totalAskPrice
                )}  / ${numberFormatter(totalBidPrice)}</div>`;
                for (const item of inputItems) {
                    appendHTMLStr += `
                <div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;"> ${item.name} x${item.count}: ${numberFormatter(
                        item.perAskPrice
                    )} / ${numberFormatter(item.perBidPrice)}</div>
                `;
                }

                // 基础每小时生产数量
                const baseTimePerActionSec = initData_actionDetailMap[actionHrid].baseTimeCost / 1000000000;
                const toolPercent = getToolsSpeedBuffByActionHrid(actionHrid);
                const actualTimePerActionSec = baseTimePerActionSec / (1 + toolPercent / 100);
                let produceItemPerHour = 3600 / actualTimePerActionSec;
                // 基础掉率
                let droprate = initData_actionDetailMap[actionHrid].outputItems[0].count;
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

                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">生产利润(卖单价进、买单价出；不包括Processing Tea、社区buff、稀有掉落；刷新网页更新人物数据)：</div>`;
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">x${droprate}基础掉率 +${toolPercent}%工具速度 +${levelEffBuff}%等级效率 +${houseEffBuff}%房子效率 +${teaBuffs.efficiency}%茶效率 +${itemEffiBuff}%装备效率 +${teaBuffs.quantity}%茶额外数量 +${teaBuffs.lessResource}%茶减少消耗</div>`;
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">每小时生产 ${Number(
                    (produceItemPerHour + extraQuantityPerHour) * droprate
                ).toFixed(1)} 个</div>`;
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP};">利润: ${numberFormatter(
                    bid - (totalAskPrice * (1 - teaBuffs.lessResource / 100)) / droprate
                )}/个, ${numberFormatter(
                    produceItemPerHour * (bid * droprate - totalAskPrice * (1 - teaBuffs.lessResource / 100)) + extraQuantityPerHour * bid * droprate
                )}/小时, ${numberFormatter(
                    24 *
                        (produceItemPerHour * (bid * droprate - totalAskPrice * (1 - teaBuffs.lessResource / 100)) +
                            extraQuantityPerHour * bid * droprate)
                )}/天</div>`;
            } else if (
                getActionHridFromItemName(itemName) &&
                initData_actionDetailMap[getActionHridFromItemName(itemName)].inputItems === null &&
                initData_actionDetailMap &&
                initData_itemDetailMap
            ) {
                // 采集类技能
                const actionHrid = getActionHridFromItemName(itemName);
                // 基础每小时生产数量
                const baseTimePerActionSec = initData_actionDetailMap[actionHrid].baseTimeCost / 1000000000;
                const toolPercent = getToolsSpeedBuffByActionHrid(actionHrid);
                const actualTimePerActionSec = baseTimePerActionSec / (1 + toolPercent / 100);
                let produceItemPerHour = 3600 / actualTimePerActionSec;
                // 基础掉率
                let droprate =
                    (initData_actionDetailMap[actionHrid].dropTable[0].minCount + initData_actionDetailMap[actionHrid].dropTable[0].maxCount) / 2;
                produceItemPerHour *= droprate;
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

                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">生产利润(卖单价进、买单价出；不包括Processing Tea、社区buff、稀有掉落；刷新网页更新人物数据)：</div>`;
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">x${droprate}基础掉率 +${toolPercent}%工具速度 +${levelEffBuff}%等级效率 +${houseEffBuff}%房子效率 +${teaBuffs.efficiency}%茶效率 +${itemEffiBuff}%装备效率 +${teaBuffs.quantity}%茶额外数量 +${teaBuffs.lessResource}%茶减少消耗</div>`;
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">每小时生产 ${Number(
                    produceItemPerHour + extraQuantityPerHour
                ).toFixed(1)} 个</div>`;
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP};">利润: ${numberFormatter(bid)}/个, ${numberFormatter(
                    produceItemPerHour * bid + extraQuantityPerHour * bid
                )}/小时, ${numberFormatter(24 * (produceItemPerHour * bid + extraQuantityPerHour * bid))}/天</div>`;
            }
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

        if (
            !forceFetch &&
            localStorage.getItem("MWITools_marketAPI_timestamp") &&
            Date.now() - localStorage.getItem("MWITools_marketAPI_timestamp") < 900000
        ) {
            return JSON.parse(localStorage.getItem("MWITools_marketAPI_json"));
        }

        console.log("fetchMarketJSON fetch github start");
        let jsonStr = null;
        jsonStr = await new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                url: MARKET_API_URL,
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

        if (jsonStr === null && settingsMap.tryBackupApiUrl.isTrue) {
            console.log("fetchMarketJSON fetch backup start");
            jsonStr = await new Promise((resolve, reject) => {
                GM.xmlHttpRequest({
                    url: MARKET_API_URL_BACKUP,
                    method: "GET",
                    synchronous: true,
                    timeout: 5000,
                    onload: async (response) => {
                        if (response.status == 200) {
                            console.log("fetchMarketJSON fetch backup success 200");
                            resolve(response.responseText);
                        } else {
                            console.error("fetchMarketJSON fetch backup onload with HTTP status failure " + response.status);
                            resolve(null);
                        }
                    },
                    onabort: () => {
                        console.error("fetchMarketJSON fetch backup onabort");
                        resolve(null);
                    },
                    onerror: () => {
                        console.error("fetchMarketJSON fetch backup onerror");
                        resolve(null);
                    },
                    ontimeout: () => {
                        console.error("fetchMarketJSON fetch backup ontimeout");
                        resolve(null);
                    },
                });
            });
        }

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
                        if (
                            added?.classList?.contains("Modal_modalContainer__3B80m") &&
                            added.querySelector("div.SkillActionDetail_nonenhancingComponent__1Y-ZY")
                        ) {
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
        if (!settingsMap.actionPanel_totalTime.isTrue) {
            return;
        }

        if (!panel.querySelector("div.SkillActionDetail_expGain__F5xHu")) {
            return; // 不处理战斗ActionPanel
        }
        const actionName = getOriTextFromElement(panel.querySelector("div.SkillActionDetail_name__3erHV"));
        const exp = Number(getOriTextFromElement(panel.querySelector("div.SkillActionDetail_expGain__F5xHu")).replaceAll(",", ""));
        const duration = Number(getOriTextFromElement(panel.querySelectorAll("div.SkillActionDetail_value__dQjYH")[4]).replace("s", ""));
        const inputElem = panel.querySelector("div.SkillActionDetail_maxActionCountInput__1C0Pw input");

        const actionHrid = initData_actionDetailMap[getActionHridFromItemName(actionName)].hrid;
        const effBuff = 1 + getTotalEffiPercentage(actionHrid, false) / 100;

        // 显示总时间
        let hTMLStr = `<div id="showTotalTime" style="color: ${SCRIPT_COLOR_MAIN}; text-align: left;">${getTotalTimeStr(
            inputElem.value,
            duration,
            effBuff
        )}</div>`;
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
        hTMLStr = `<div id="quickInputButtons" style="color: ${SCRIPT_COLOR_MAIN}; text-align: left;">做 </div>`;
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
            hTMLStr = `<div id="tillLevel" style="color: ${SCRIPT_COLOR_MAIN}; text-align: left;">到 <input id="tillLevelInput" type="number" value="${
                currentLevel + 1
            }" min="${currentLevel + 1}" max="200"> 级还需做 <span id="tillLevelNumber">${need.numOfActions} 次[${timeReadable(
                need.timeSec
            )}] (刷新网页更新当前等级)</span></div>`;

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
                `<div id="expPerHour" style="color: ${SCRIPT_COLOR_MAIN}; text-align: left;">每小时经验: ${numberFormatter(
                    Math.round((3600 / duration) * exp * effBuff)
                )} (+${Number((effBuff - 1) * 100).toFixed(1)}%效率)</div>`
            );

        // 显示Foraging最后一个图综合收益
        if (panel.querySelector("div.SkillActionDetail_dropTable__3ViVp").children.length > 1 && settingsMap.actionPanel_foragingTotal.isTrue) {
            const jsonObj = await fetchMarketJSON();
            const actionHrid = "/actions/foraging/" + actionName.toLowerCase().replaceAll(" ", "_");
            // 基础每小时生产数量
            const baseTimePerActionSec = initData_actionDetailMap[actionHrid].baseTimeCost / 1000000000;
            const toolPercent = getToolsSpeedBuffByActionHrid(actionHrid);
            const actualTimePerActionSec = baseTimePerActionSec / (1 + toolPercent / 100);
            let numOfActionsPerHour = 3600 / actualTimePerActionSec;
            let dropTable = initData_actionDetailMap[actionHrid].dropTable;
            let virtualItemBid = 0;
            for (const drop of dropTable) {
                const bid = jsonObj?.market[initData_itemDetailMap[drop.itemHrid].name]?.bid;
                const amount = drop.dropRate * ((drop.minCount + drop.maxCount) / 2);
                virtualItemBid += bid * amount;
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
            const levelEffBuff = currentLevel - requiredLevel;
            // 房子效率
            const houseEffBuff = getHousesEffBuffByActionHrid(actionHrid);
            // 茶
            const teaBuffs = getTeaBuffsByActionHrid(actionHrid);
            // 总效率
            numOfActionsPerHour *= 1 + (levelEffBuff + houseEffBuff + teaBuffs.efficiency) / 100;
            // 茶额外数量
            let extraQuantityPerHour = (numOfActionsPerHour * teaBuffs.quantity) / 100;

            let htmlStr = `<div id="totalProfit"  style="color: ${SCRIPT_COLOR_MAIN}; text-align: left;">综合利润: ${numberFormatter(
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
                span.style.color = SCRIPT_COLOR_MAIN;

                element.parentNode.parentNode.querySelector("span.NavigationBar_level__3C7eR").style.width = "auto";

                const insertParent = element.parentNode.parentNode.children[0];
                insertParent.insertBefore(span, insertParent.children[1]);
            });
        } else {
            setTimeout(waitForProgressBar, 200);
        }
    };

    const removeInsertedDivs = () => document.querySelectorAll("span.insertedSpan").forEach((div) => div.parentNode.removeChild(div));

    if (settingsMap.expPercentage.isTrue) {
        window.setInterval(() => {
            removeInsertedDivs();
            waitForProgressBar();
        }, 1000);
    }

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
                        elem.insertAdjacentHTML(
                            "afterend",
                            `<div id="script_battleNumbers" style="color: ${SCRIPT_COLOR_MAIN};">每小时战斗 ${efficiencyPerHour} 次</div>`
                        );
                    }
                }
                // 总收入
                document
                    .querySelector("div#script_battleNumbers")
                    .insertAdjacentHTML(
                        "afterend",
                        `<div id="script_totalIncome" style="color: ${SCRIPT_COLOR_MAIN};">总收获: ${numberFormatter(
                            totalPriceAsk
                        )} / ${numberFormatter(totalPriceAskBid)}</div>`
                    );
                // 平均收入
                if (battleDurationSec) {
                    document
                        .querySelector("div#script_totalIncome")
                        .insertAdjacentHTML(
                            "afterend",
                            `<div id="script_averageIncome" style="color: ${SCRIPT_COLOR_MAIN};">每小时收获: ${numberFormatter(
                                totalPriceAsk / (battleDurationSec / 60 / 60)
                            )} / ${numberFormatter(totalPriceAskBid / (battleDurationSec / 60 / 60))}</div>`
                        );
                    document
                        .querySelector("div#script_averageIncome")
                        .insertAdjacentHTML(
                            "afterend",
                            `<div id="script_totalIncomeDay" style="color: ${SCRIPT_COLOR_MAIN};">每天收获: ${numberFormatter(
                                (totalPriceAsk / (battleDurationSec / 60 / 60)) * 24
                            )} / ${numberFormatter((totalPriceAskBid / (battleDurationSec / 60 / 60)) * 24)}</div>`
                        );
                } else {
                    console.error("handleBattleSummary unable to display average income due to null battleDurationSec");
                }
                // 总经验
                document
                    .querySelector("div#script_totalIncomeDay")
                    .insertAdjacentHTML(
                        "afterend",
                        `<div id="script_totalSkillsExp" style="color: ${SCRIPT_COLOR_MAIN};">总经验: ${numberFormatter(totalSkillsExp)}</div>`
                    );
                // 平均经验
                if (battleDurationSec) {
                    document
                        .querySelector("div#script_totalSkillsExp")
                        .insertAdjacentHTML(
                            "afterend",
                            `<div id="script_averageSkillsExp" style="color: ${SCRIPT_COLOR_MAIN};">每小时总经验: ${numberFormatter(
                                totalSkillsExp / (battleDurationSec / 60 / 60)
                            )}</div>`
                        );

                    for (const [key, value] of Object.entries(message.unit.totalSkillExperienceMap)) {
                        let skillName = key.replace("/skills/", "");
                        let str = skillName.charAt(0).toUpperCase() + skillName.slice(1);
                        document
                            .querySelector("div#script_totalSkillsExp")
                            .parentElement.insertAdjacentHTML(
                                "beforeend",
                                `<div style="color: ${SCRIPT_COLOR_MAIN};">每小时${str}经验: ${numberFormatter(
                                    value / (battleDurationSec / 60 / 60)
                                )}</div>`
                            );
                    }
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
                        `<div class="script_itemLevel" style="z-index: 1; position: absolute; top: 2px; right: 2px; text-align: right; color: ${SCRIPT_COLOR_MAIN};">${itemLevel}</div>`
                    );
                }
                if (
                    !initData_itemDetailMap[itemHrid]?.equipmentDetail.type?.includes("_tool") &&
                    div.parentElement.parentElement.parentElement.className.includes("MarketplacePanel_marketItems__D4k7e")
                ) {
                    handleMarketItemFilter(div, initData_itemDetailMap[itemHrid]);
                }
            } else if (itemAbilityLevel && itemAbilityLevel > 0) {
                if (!div.querySelector("div.script_itemLevel")) {
                    div.insertAdjacentHTML(
                        "beforeend",
                        `<div class="script_itemLevel" style="z-index: 1; position: absolute; top: 2px; right: 2px; text-align: right; color: ${SCRIPT_COLOR_MAIN};">${itemAbilityLevel}</div>`
                    );
                }
            }
        }
    }
    if (settingsMap.itemIconLevel.isTrue) {
        setInterval(addItemLevels, 500);
    }

    /* 市场物品筛选 */
    let onlyShowItemsAboveLevel = 1;
    let onlyShowItemsBelowLevel = 1000;
    let onlyShowItemsType = "all";
    let onlyShowItemsSkillReq = "all";

    function addMarketFilterButtons() {
        const oriFilter = document.querySelector(".MarketplacePanel_itemFilterContainer__3F3td");
        let filters = document.querySelector("#script_filters");
        if (oriFilter && !filters) {
            oriFilter.insertAdjacentHTML("afterend", `<div id="script_filters" style="float: left; color: ${SCRIPT_COLOR_MAIN};"></div>`);
            filters = document.querySelector("#script_filters");
            filters.insertAdjacentHTML(
                "beforeend",
                `<span id="script_filter_level" style="float: left; color: ${SCRIPT_COLOR_MAIN};">等级: 大于等于
                <select name="script_filter_level_select" id="script_filter_level_select">
                <option value="1">All</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="40">40</option>
                <option value="50">50</option>
                <option value="60">60</option>
                <option value="65">65</option>
                <option value="70">70</option>
                <option value="75">75</option>
                <option value="80">80</option>
                <option value="85">85</option>
                <option value="90">90</option>
                <option value="95">95</option>
                <option value="100">100</option>
            </select>&nbsp;</span>`
            );
            filters.insertAdjacentHTML(
                "beforeend",
                `<span id="script_filter_level_to" style="float: left; color: ${SCRIPT_COLOR_MAIN};">小于 
                <select name="script_filter_level_select_to" id="script_filter_level_select_to">
                <option value="1000">All</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="40">40</option>
                <option value="50">50</option>
                <option value="60">60</option>
                <option value="65">65</option>
                <option value="70">70</option>
                <option value="75">75</option>
                <option value="80">80</option>
                <option value="85">85</option>
                <option value="90">90</option>
                <option value="95">95</option>
                <option value="100">100</option>
            </select>&emsp;</span>`
            );
            filters.insertAdjacentHTML(
                "beforeend",
                `<span id="script_filter_skill" style="float: left; color: ${SCRIPT_COLOR_MAIN};">职业: 
                <select name="script_filter_skill_select" id="script_filter_skill_select">
                    <option value="all">All</option>
                    <option value="attack">Attack</option>
                    <option value="power">Power</option>
                    <option value="defense">Defense</option>
                    <option value="ranged">Ranged</option>
                    <option value="magic">Magic</option>
                </select>&emsp;</span>`
            );
            filters.insertAdjacentHTML(
                "beforeend",
                `<span id="script_filter_location" style="float: left; color: ${SCRIPT_COLOR_MAIN};">部位: 
                <select name="script_filter_location_select" id="script_filter_location_select">
                    <option value="all">All</option>
                    <option value="main_hand">Main Hand</option>
                    <option value="off_hand">Off Hand</option>
                    <option value="two_hand">Two Hand</option>
                    <option value="head">Head</option>
                    <option value="body">Body</option>
                    <option value="hands">Hands</option>
                    <option value="legs">Legs</option>
                    <option value="feet">Feet</option>
                    <option value="neck">Neck</option>
                    <option value="earrings">Earrings</option>
                    <option value="ring">Ring</option>
                    <option value="pouch">Pouch</option>
                    <option value="back">Back</option>
                </select>&emsp;</span>`
            );

            const levelFilter = document.querySelector("#script_filter_level_select");
            levelFilter.addEventListener("change", function () {
                if (levelFilter.value && !isNaN(levelFilter.value)) {
                    onlyShowItemsAboveLevel = Number(levelFilter.value);
                }
            });
            const levelToFilter = document.querySelector("#script_filter_level_select_to");
            levelToFilter.addEventListener("change", function () {
                if (levelToFilter.value && !isNaN(levelToFilter.value)) {
                    onlyShowItemsBelowLevel = Number(levelToFilter.value);
                }
            });
            const skillFilter = document.querySelector("#script_filter_skill_select");
            skillFilter.addEventListener("change", function () {
                if (skillFilter.value) {
                    onlyShowItemsSkillReq = skillFilter.value;
                }
            });
            const locationFilter = document.querySelector("#script_filter_location_select");
            locationFilter.addEventListener("change", function () {
                if (locationFilter.value) {
                    onlyShowItemsType = locationFilter.value;
                }
            });
        }
    }
    if (settingsMap.marketFilter.isTrue) {
        setInterval(addMarketFilterButtons, 500);
    }

    function handleMarketItemFilter(div, itemDetal) {
        const itemLevel = itemDetal.itemLevel;
        const type = itemDetal.equipmentDetail.type;
        const levelRequirements = itemDetal.equipmentDetail.levelRequirements;

        let isType = false;
        isType = type.includes(onlyShowItemsType);
        if (onlyShowItemsType === "all") {
            isType = true;
        }

        let isRequired = false;
        for (const requirement of levelRequirements) {
            if (requirement.skillHrid.includes(onlyShowItemsSkillReq)) {
                isRequired = true;
            }
        }
        if (onlyShowItemsSkillReq === "all") {
            isRequired = true;
        }

        if (itemLevel >= onlyShowItemsAboveLevel && itemLevel < onlyShowItemsBelowLevel && isType && isRequired) {
            div.style.display = "block";
        } else {
            div.style.display = "none";
        }
    }

    /* 任务卡片显示战斗地图序号 */
    function handleTaskCard() {
        const taskNameDivs = document.querySelectorAll("div.RandomTask_randomTask__3B9fA div.RandomTask_name__1hl1b");
        for (const div of taskNameDivs) {
            const taskStr = getOriTextFromElement(div);
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
                    div.insertAdjacentHTML(
                        "beforeend",
                        `<span class="script_taskMapIndex" style="text-align: right; color: ${SCRIPT_COLOR_MAIN};"> 图 ${index}</span>`
                    );
                }
            }
        }
    }
    if (settingsMap.taskMapIndex.isTrue) {
        setInterval(handleTaskCard, 500);
    }

    /* 显示战斗地图序号 */
    function addIndexToMaps() {
        const buttons = document.querySelectorAll(
            "div.MainPanel_subPanelContainer__1i-H9 div.CombatPanel_tabsComponentContainer__GsQlg div.MuiTabs-root.MuiTabs-vertical.css-6x4ics button.MuiButtonBase-root.MuiTab-root.MuiTab-textColorPrimary.css-1q2h7u5 span.MuiBadge-root.TabsComponent_badge__1Du26.css-1rzb3uu"
        );
        let index = 1;
        for (const button of buttons) {
            if (!button.querySelector("span.script_mapIndex")) {
                button.insertAdjacentHTML("afterbegin", `<span class="script_mapIndex" style="color: ${SCRIPT_COLOR_MAIN};">${index++}. </span>`);
            }
        }
    }
    if (settingsMap.mapIndex.isTrue) {
        setInterval(addIndexToMaps, 500);
    }

    /* 物品词典窗口显示还需多少技能书到X级 */
    const waitForItemDict = () => {
        const targetNode = document.querySelector("div.GamePage_gamePage__ixiPl");
        if (targetNode) {
            console.log("start observe item dict");
            const itemDictPanelObserver = new MutationObserver(async function (mutations) {
                for (const mutation of mutations) {
                    for (const added of mutation.addedNodes) {
                        if (
                            added?.classList?.contains("Modal_modalContainer__3B80m") &&
                            added.querySelector("div.ItemDictionary_modalContent__WvEBY")
                        ) {
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
        const itemName = getOriTextFromElement(panel.querySelector("div.ItemDictionary_title__27cTd")).toLowerCase().replaceAll(" ", "_");
        let abilityHrid = null;
        for (const skillHrid of Object.keys(initData_abilityDetailMap)) {
            if (skillHrid.includes("/" + itemName)) {
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
        let hTMLStr = `<div id="tillLevel" style="color: ${SCRIPT_COLOR_MAIN}; text-align: left;">到 <input id="tillLevelInput" type="number" value="${
            currentLevel + 1
        }" min="${currentLevel + 1}" max="200"> 级还需 <span id="tillLevelNumber">${numBooks} 本书 (刷新网页更新当前等级)</span></div>`;
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

    /* 添加第三方网站链接 */
    function add3rdPartyLinks() {
        const waitForNavi = () => {
            const targetNode = document.querySelector("div.NavigationBar_minorNavigationLinks__dbxh7");
            if (targetNode) {
                let div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = "插件说明";
                div.addEventListener("click", () => {
                    window.open("http://43.129.194.214:5000/readme", "_blank");
                });
                targetNode.insertAdjacentElement("afterbegin", div);

                div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = "插件设置";
                div.addEventListener("click", () => {
                    const array = document.querySelectorAll(".NavigationBar_navigationLink__3eAHA");
                    array[array.length - 1]?.click();
                });
                targetNode.insertAdjacentElement("afterbegin", div);

                div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = "强化模拟 Enhancelator";
                div.addEventListener("click", () => {
                    window.open("https://doh-nuts.github.io/Enhancelator/", "_blank");
                });
                targetNode.insertAdjacentElement("afterbegin", div);

                div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = "利润计算 Cowculator";
                div.addEventListener("click", () => {
                    window.open("https://mwisim.github.io/cowculator/", "_blank");
                });
                targetNode.insertAdjacentElement("afterbegin", div);

                div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = "利润计算 Mooneycalc";
                div.addEventListener("click", () => {
                    window.open("https://mooneycalc.vercel.app/", "_blank");
                });
                targetNode.insertAdjacentElement("afterbegin", div);

                div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = "利润计算 cowculator";
                div.addEventListener("click", () => {
                    window.open("https://cowculator.info/", "_blank");
                });
                targetNode.insertAdjacentElement("afterbegin", div);

                div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = "战斗模拟（批量）";
                div.addEventListener("click", () => {
                    window.open("http://43.129.194.214:5000/mwisim.github.io", "_blank");
                });
                targetNode.insertAdjacentElement("afterbegin", div);

                div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = "战斗模拟 MWISim";
                div.addEventListener("click", () => {
                    window.open("https://mwisim.github.io/", "_blank");
                });
                targetNode.insertAdjacentElement("afterbegin", div);
            } else {
                setTimeout(add3rdPartyLinks, 200);
            }
        };
        waitForNavi();
    }

    /* 动作列表菜单计算时间 */
    function handleActionQueueMenue(added) {
        if (!settingsMap.actionQueue.isTrue) {
            return;
        }

        handleActionQueueMenueCalculateTime(added);

        const listDiv = added.querySelector(".QueuedActions_actions__2Lur6");
        new MutationObserver((mutationsList) => {
            handleActionQueueMenueCalculateTime(added);
        }).observe(listDiv, { characterData: false, subtree: false, childList: true });
    }

    function handleActionQueueMenueCalculateTime(added) {
        const actionDivList = added.querySelectorAll("div.QueuedActions_action__r3HlD");
        if (!actionDivList || actionDivList.length === 0) {
            return;
        }
        if (actionDivList.length !== currentActionsHridList.length - 1) {
            console.error("handleActionQueueTooltip action queue length inconsistency");
            return;
        }

        let actionDivListIndex = 0;
        let hasSkippedfirstActionObj = false;
        let accumulatedTimeSec = 0;
        let isAccumulatedTimeInfinite = false;
        for (const actionObj of currentActionsHridList) {
            const actionHrid = actionObj.actionHrid;
            const count = actionObj.maxCount - actionObj.currentCount;
            let isInfinit = false;
            if (count === 0 || actionHrid.includes("/combat/")) {
                isInfinit = true;
                isAccumulatedTimeInfinite = true;
            }

            const baseTimePerActionSec = initData_actionDetailMap[actionHrid].baseTimeCost / 1000000000;
            const totalEffBuff = getTotalEffiPercentage(actionHrid);
            const toolSpeedBuff = getToolsSpeedBuffByActionHrid(actionHrid);

            let timePerActionSec = baseTimePerActionSec / (1 + toolSpeedBuff / 100);
            timePerActionSec /= 1 + totalEffBuff / 100;
            let totalTimeSec = count * timePerActionSec;

            let str = "到 ∞ ";
            if (!isAccumulatedTimeInfinite) {
                accumulatedTimeSec += totalTimeSec;
                const currentTime = new Date();
                currentTime.setSeconds(currentTime.getSeconds() + accumulatedTimeSec);
                str = `到 ${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(2, "0")}:${String(
                    currentTime.getSeconds()
                ).padStart(2, "0")}`;
            }

            if (hasSkippedfirstActionObj) {
                const html = `<div class="script_actionTime" style="color: ${SCRIPT_COLOR_MAIN};">${
                    isInfinit ? "[ ∞ ] " : `[${timeReadable(totalTimeSec)}]`
                } ${str}</div>`;
                if (actionDivList[actionDivListIndex].querySelector("div div.script_actionTime")) {
                    actionDivList[actionDivListIndex].querySelector("div div.script_actionTime").innerHTML = html;
                } else {
                    actionDivList[actionDivListIndex].querySelector("div").insertAdjacentHTML("beforeend", html);
                }
                actionDivListIndex++;
            }
            hasSkippedfirstActionObj = true;
        }
        const html = `<div id="script_queueTotalTime" style="color: ${SCRIPT_COLOR_MAIN};">总时间：${
            isAccumulatedTimeInfinite ? "[ ∞ ] " : `[${timeReadable(accumulatedTimeSec)}]`
        }</div>`;
        if (document.querySelector("div#script_queueTotalTime")) {
            document.querySelector("div#script_queueTotalTime").innerHTML = html;
        } else {
            document.querySelector("div.QueuedActions_queuedActionsEditMenu__3OoQH").insertAdjacentHTML("afterend", html);
        }
    }

    /* 支持修改版汉化插件 */
    function getOriTextFromElement(elem) {
        if (!elem) {
            console.error("getTextFromElement null elem");
            return "";
        }
        const translatedfrom = elem.getAttribute("script_translatedfrom");
        if (translatedfrom) {
            return translatedfrom;
        }
        return elem.textContent;
    }

    /* 强化模拟器 */
    async function handleItemTooltipWithEnhancementLevel(tooltip) {
        if (!settingsMap.enhanceSim.isTrue) {
            return;
        }

        if (typeof math === "undefined") {
            console.error(`handleItemTooltipWithEnhancementLevel no math lib`);
            tooltip
                .querySelector(".ItemTooltipText_itemTooltipText__zFq3A")
                .insertAdjacentHTML(
                    "beforeend",
                    `<div style="color: ${SCRIPT_COLOR_ALERT};">由于网络问题无法强化模拟: 1. 手机可能不支持脚本联网；2. 请尝试科学网络；</div>`
                );
            return;
        }

        const itemNameElems = tooltip.querySelectorAll("div.ItemTooltipText_name__2JAHA span");
        const itemName = getOriTextFromElement(itemNameElems[0]);
        const enhancementLevel = Number(itemNameElems[1].textContent.replace("+", ""));

        let itemHrid = null;
        for (const item of Object.values(initData_itemDetailMap)) {
            if (item.name === itemName) {
                itemHrid = item.hrid;
            }
        }
        if (!itemHrid || !initData_itemDetailMap[itemHrid]) {
            console.error(`handleItemTooltipWithEnhancementLevel invalid itemHrid ${itemName} ${itemHrid}`);
            return;
        }

        input_data.item_hrid = itemHrid;
        input_data.stop_at = enhancementLevel;
        const best = await findBestEnhanceStrat(input_data);

        let appendHTMLStr = `<div style="color: ${SCRIPT_COLOR_TOOLTIP};">不支持模拟+1装备</div>`;
        if (best) {
            let needMatStr = "";
            for (const [key, value] of Object.entries(best.costs.needMap)) {
                needMatStr += `<div>${key} 单价: ${numberFormatter(value)}<div>`;
            }
            appendHTMLStr = `<div style="color: ${SCRIPT_COLOR_TOOLTIP};"><div>强化模拟（默认90级强化，2级房子，5级工具，0级手套，超级茶，幸运茶，卖单价收货，无工时费）：</div><div>总成本 ${numberFormatter(
                best.totalCost.toFixed(0)
            )}</div><div>耗时 ${best.simResult.totalActionTimeStr}</div>${
                best.protect_count > 0 ? "<div>从 " + best.protect_at + " 级开始保护</div>" : "<div>不需要保护</div>"
            }<div>保护 ${best.protect_count.toFixed(1)} 次</div><div>+0底子: ${numberFormatter(best.costs.baseCost)}</div><div>${
                best.protect_count > 0
                    ? "保护单价: " + initData_itemDetailMap[best.costs.choiceOfProtection].name + " " + numberFormatter(best.costs.minProtectionCost)
                    : ""
            } 
             </div>${needMatStr}</div>`;
        }

        tooltip.querySelector(".ItemTooltipText_itemTooltipText__zFq3A").insertAdjacentHTML("beforeend", appendHTMLStr);
    }

    async function findBestEnhanceStrat(input_data) {
        const price_data = await fetchMarketJSON();
        if (!price_data || !price_data.market) {
            console.error("findBestEnhanceStrat fetchMarketJSON null");
            return [];
        }

        const allResults = [];
        for (let protect_at = 2; protect_at <= input_data.stop_at; protect_at++) {
            const simResult = Enhancelate(input_data, protect_at);
            const costs = getCosts(input_data.item_hrid, price_data);
            const totalCost = costs.baseCost + costs.minProtectionCost * simResult.protect_count + costs.perActionCost * simResult.actions;
            const r = {};
            r.protect_at = protect_at;
            r.protect_count = simResult.protect_count;
            r.simResult = simResult;
            r.costs = costs;
            r.totalCost = totalCost;
            allResults.push(r);
        }

        let best = null;
        for (const r of allResults) {
            if (best === null || r.totalCost < best.totalCost) {
                best = r;
            }
        }
        return best;
    }

    // Source: https://doh-nuts.github.io/Enhancelator/
    function Enhancelate(input_data, protect_at) {
        const success_rate = [
            50, //+1
            45, //+2
            45, //+3
            40, //+4
            40, //+5
            40, //+6
            35, //+7
            35, //+8
            35, //+9
            35, //+10
            30, //+11
            30, //+12
            30, //+13
            30, //+14
            30, //+15
            30, //+16
            30, //+17
            30, //+18
            30, //+19
            30, //+20
        ];

        // 物品等级
        const itemLevel = initData_itemDetailMap[input_data.item_hrid].itemLevel;

        // 总强化buff
        let total_bonus = null;
        const effective_level = input_data.enhancing_level + (input_data.tea_enhancing ? 3 : 0) + (input_data.tea_super_enhancing ? 6 : 0);
        if (effective_level >= itemLevel) {
            total_bonus = 1 + (0.05 * (effective_level + input_data.laboratory_level - itemLevel) + input_data.enhancer_bonus) / 100;
        } else {
            total_bonus = 1 - 0.5 * (1 - effective_level / itemLevel) + (0.05 * input_data.laboratory_level + input_data.enhancer_bonus) / 100;
        }

        // 模拟
        let markov = math.zeros(20, 20);
        for (let i = 0; i < input_data.stop_at; i++) {
            const success_chance = (success_rate[i] / 100.0) * total_bonus;
            const destination = i >= protect_at ? i - 1 : 0;
            if (input_data.tea_blessed) {
                markov.set([i, i + 2], success_chance * 0.01);
                markov.set([i, i + 1], success_chance * 0.99);
                markov.set([i, destination], 1 - success_chance);
            } else {
                markov.set([i, i + 1], success_chance);
                markov.set([i, destination], 1.0 - success_chance);
            }
        }
        markov.set([input_data.stop_at, input_data.stop_at], 1.0);
        let Q = markov.subset(math.index(math.range(0, input_data.stop_at), math.range(0, input_data.stop_at)));
        const M = math.inv(math.subtract(math.identity(input_data.stop_at), Q));
        const attemptsArray = M.subset(math.index(math.range(0, 1), math.range(0, input_data.stop_at)));
        const attempts = math.flatten(math.row(attemptsArray, 0).valueOf()).reduce((a, b) => a + b, 0);
        const protectAttempts = M.subset(math.index(math.range(0, 1), math.range(protect_at, input_data.stop_at)));
        const protectAttemptsArray = typeof protectAttempts === "number" ? [protectAttempts] : math.flatten(math.row(protectAttempts, 0).valueOf());
        const protects = protectAttemptsArray.map((a, i) => a * markov.get([i + protect_at, i + protect_at - 1])).reduce((a, b) => a + b, 0);

        // 动作时间
        const perActionTimeSec = (
            12 /
            (1 +
                (input_data.enhancing_level > itemLevel
                    ? (effective_level + input_data.laboratory_level - itemLevel + input_data.glove_bonus) / 100
                    : (input_data.laboratory_level + input_data.glove_bonus) / 100))
        ).toFixed(2);

        const result = {};
        result.actions = attempts;
        result.protect_count = protects;
        result.totalActionTimeSec = perActionTimeSec * attempts;
        result.totalActionTimeStr = timeReadable(result.totalActionTimeSec);
        return result;
    }

    // 自定义强化模拟输入参数
    let input_data = {
        item_hrid: null,
        stop_at: null,

        enhancing_level: 90, // 人物 Enhancing 技能等级
        laboratory_level: 2, // 房子等级
        enhancer_bonus: 4.03, // 工具提高成功率，0级=3.6，5级=4.03，10级=4.64
        glove_bonus: 10, // 手套提高强化速度，0级=10，5级=11.2，10级=12.9

        tea_enhancing: false, // 强化茶
        tea_super_enhancing: true, // 超级强化茶
        tea_blessed: true, // 祝福茶

        priceAskBidRatio: 1, // 取市场卖单价买单价比例，1=只用卖单价，0=只用买单价
    };

    function getCosts(hrid, price_data) {
        const itemDetalObj = initData_itemDetailMap[hrid];
        // +0本体成本
        let baseCost = null;

        // 保护成本
        let minProtectionPrice = null;
        let minProtectionHrid = null;
        let protect_item_hrids =
            itemDetalObj.protectionItemHrids == null
                ? [hrid, "/items/mirror_of_protection"]
                : [hrid, "/items/mirror_of_protection"].concat(itemDetalObj.protectionItemHrids);
        protect_item_hrids.forEach((protection_hrid, i) => {
            const this_cost = get_full_item_price(protection_hrid, price_data);
            if (i == 0) {
                baseCost = this_cost;
                minProtectionPrice = this_cost;
                minProtectionHrid = protection_hrid;
            } else {
                if (this_cost < minProtectionPrice) {
                    minProtectionPrice = this_cost;
                    minProtectionHrid = protection_hrid;
                }
            }
        });

        // 强化材料成本
        const needMap = {};
        let totalNeedPrice = 0;
        for (const need of itemDetalObj.enhancementCosts) {
            const price = get_full_item_price(need.itemHrid, price_data);
            totalNeedPrice += price * need.count;
            if (!need.itemHrid.includes("/coin")) {
                needMap[initData_itemDetailMap[need.itemHrid].name] = price;
            }
        }

        return {
            baseCost: baseCost,
            minProtectionCost: minProtectionPrice,
            perActionCost: totalNeedPrice,
            choiceOfProtection: minProtectionHrid,
            needMap: needMap,
        };
    }

    function get_full_item_price(hrid, price_data) {
        const fullName = initData_itemDetailMap[hrid].name;
        const item_price_data = price_data.market[fullName];
        let final_cost = item_price_data.ask * input_data.priceAskBidRatio + item_price_data.bid * (1 - input_data.priceAskBidRatio);
        return final_cost;
    }

    /* 脚本设置面板 */
    const waitForSetttins = () => {
        const targetNode = document.querySelector("div.SettingsPanel_profileTab__214Bj");
        if (targetNode) {
            if (!targetNode.querySelector("#script_settings")) {
                targetNode.insertAdjacentHTML("beforeend", `<div id="script_settings"></div>`);
                const insertElem = targetNode.querySelector("div#script_settings");
                insertElem.insertAdjacentHTML(
                    "beforeend",
                    `<div style="float: left; color: ${SCRIPT_COLOR_MAIN}">MWITools 设置 （刷新生效）：</div></br>`
                );

                for (const setting of Object.values(settingsMap)) {
                    insertElem.insertAdjacentHTML(
                        "beforeend",
                        `<div style="float: left;"><input type="checkbox" id="${setting.id}" ${setting.isTrue ? "checked" : ""}></input>${
                            setting.desc
                        }</div></br>`
                    );
                }

                insertElem.insertAdjacentHTML(
                    "beforeend",
                    `<div style="float: left;">代码里搜索“自定义”可以手动修改字体颜色、强化模拟默认参数</div></br>`
                );
                insertElem.addEventListener("change", saveSettings);
            }
        }
        setTimeout(waitForSetttins, 500);
    };
    waitForSetttins();

    function saveSettings() {
        for (const checkbox of document.querySelectorAll("div#script_settings input")) {
            settingsMap[checkbox.id].isTrue = checkbox.checked;
            localStorage.setItem("script_settingsMap", JSON.stringify(settingsMap));
        }
    }

    function readSettings() {
        const ls = localStorage.getItem("script_settingsMap");
        if (ls) {
            const lsObj = JSON.parse(ls);
            for (const option of Object.values(lsObj)) {
                if (settingsMap.hasOwnProperty(option.id)) {
                    settingsMap[option.id].isTrue = option.isTrue;
                }
            }
        }
    }

    /* 检查是否穿错生产/战斗装备 */
    function checkEquipment() {
        if (currentActionsHridList.length === 0) {
            return;
        }
        const currentActionHrid = currentActionsHridList[0].actionHrid;
        const hasHat = currentEquipmentMap["/item_locations/head"]?.itemHrid === "/items/red_chefs_hat" ? true : false; // Cooking, Brewing
        const hasOffHand = currentEquipmentMap["/item_locations/off_hand"]?.itemHrid === "/items/eye_watch" ? true : false; // Cheesesmithing, Crafting, Tailoring
        const hasBoot = currentEquipmentMap["/item_locations/feet"]?.itemHrid === "/items/collectors_boots" ? true : false; // Milking, Foraging, Woodcutting
        const hasGlove = currentEquipmentMap["/item_locations/hands"]?.itemHrid === "/items/enchanted_gloves" ? true : false; // Enhancing

        let warningStr = null;
        if (currentActionHrid.includes("/actions/combat/")) {
            if (hasHat || hasOffHand || hasBoot || hasGlove) {
                warningStr = "正穿着生产装备";
            }
        } else if (currentActionHrid.includes("/actions/cooking/") || currentActionHrid.includes("/actions/brewing/")) {
            if (!hasHat && hasItemHridInInv("/items/red_chefs_hat")) {
                warningStr = "没穿生产帽";
            }
        } else if (
            currentActionHrid.includes("/actions/cheesesmithing/") ||
            currentActionHrid.includes("/actions/crafting/") ||
            currentActionHrid.includes("/actions/tailoring/")
        ) {
            if (!hasOffHand && hasItemHridInInv("/items/eye_watch")) {
                warningStr = "没穿生产副手";
            }
        } else if (
            currentActionHrid.includes("/actions/milking/") ||
            currentActionHrid.includes("/actions/foraging/") ||
            currentActionHrid.includes("/actions/woodcutting/")
        ) {
            if (!hasBoot && hasItemHridInInv("/items/collectors_boots")) {
                warningStr = "没穿生产鞋";
            }
        } else if (currentActionHrid.includes("/actions/enhancing")) {
            if (!hasGlove && hasItemHridInInv("/items/enchanted_gloves")) {
                warningStr = "没穿强化手套";
            }
        }

        document.body.querySelector("#script_item_warning")?.remove();
        if (warningStr) {
            console.log(warningStr);
            document.body.insertAdjacentHTML(
                "beforeend",
                `<div id="script_item_warning" style="position: fixed; top: 1%; left: 30%; color: ${SCRIPT_COLOR_ALERT}; font-size: 20px;">${warningStr}</div>`
            );
        }
    }

    function hasItemHridInInv(hrid) {
        let result = null;
        for (const item of initData_characterItems) {
            if (item.itemHrid === hrid && item.itemLocationHrid === "/item_locations/inventory") {
                result = item;
            }
        }
        return result ? true : false;
    }

    /* 空闲时弹窗通知 */
    function notificate() {
        if (typeof GM_notification === "undefined" || !GM_notification) {
            console.error("notificate null GM_notification");
            return;
        }
        if (currentActionsHridList.length > 0) {
            return;
        }
        console.log("notificate empty action");
        GM_notification({
            text: "动作队列为空",
            title: "MWITools",
        });
    }

    /* 左侧栏显示技能百分比 */
    const waitForMarketOrders = () => {
        const element = document.querySelector(".MarketplacePanel_marketListings__1GCyQ");
        if (element) {
            console.log("start observe market order");
            new MutationObserver((mutationsList) => {
                mutationsList.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.classList.contains("Modal_modalContainer__3B80m")) {
                            handleMarketNewOrder(node);
                        }
                    });
                });
            }).observe(element, {
                characterData: false,
                subtree: false,
                childList: true,
            });
        } else {
            setTimeout(waitForMarketOrders, 500);
        }
    };

    function handleMarketNewOrder(node) {
        const label = node.querySelector("span.MarketplacePanel_bestPrice__3bgKp");
        const inputDiv = node.querySelector(".MarketplacePanel_inputContainer__3xmB2 .MarketplacePanel_priceInputs__3iWxy");
        if (!label || !inputDiv) {
            console.error("handleMarketNewOrder can not find elements");
            return;
        }
        label.click();
        if (label.parentElement.textContent.toLowerCase().includes("best buy")) {
            inputDiv.querySelectorAll(".MarketplacePanel_buttonContainer__vJQud")[2]?.querySelector("div")?.click();
        } else if (label.parentElement.textContent.toLowerCase().includes("best sell")) {
            inputDiv.querySelectorAll(".MarketplacePanel_buttonContainer__vJQud")[1]?.querySelector("div")?.click();
        }
    }
})();
