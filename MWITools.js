// ==UserScript==
// @name         MWITools
// @namespace    http://tampermonkey.net/
// @version      11.7
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
// @require      https://cdn.jsdelivr.net/npm/chart.js@3.7.0/dist/chart.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0/dist/chartjs-plugin-datalabels.min.js
// ==/UserScript==

(() => {
    "use strict";
    const userLanguage = navigator.language || navigator.userLanguage;
    const isZH = userLanguage.startsWith("zh");

    /* 自定义插件字体颜色 */
    /* 找颜色自行网上搜索"CSS颜色" */
    /* 可以是颜色名称，比如"red"；也可以是颜色Hex，比如"#ED694D" */
    // Customization
    const SCRIPT_COLOR_MAIN = "green"; // 脚本主要字体颜色
    const SCRIPT_COLOR_TOOLTIP = "darkgreen"; // 物品悬浮窗的字体颜色
    const SCRIPT_COLOR_ALERT = "red"; // 警告字体颜色

    const MARKET_API_URL = "https://raw.githubusercontent.com/holychikenz/MWIApi/main/medianmarket.json";
    const MARKET_API_URL_BACKUP = "http://43.129.194.214:5500/apijson";

    let settingsMap = {
        totalActionTime: {
            id: "totalActionTime",
            desc: isZH
                ? "左上角显示：当前动作预计总耗时、预计何时完成"
                : "Top left: Estimated total time of the current action, estimated complete time.",
            isTrue: true,
        },
        actionPanel_totalTime: {
            id: "actionPanel_totalTime",
            desc: isZH
                ? "动作面板显示：动作预计总耗时、到多少级还需做多少次、每小时经验"
                : "Action panel: Estimated total time of the action, times needed to reach a target skill level, exp/hour.",
            isTrue: true,
        },
        actionPanel_foragingTotal: {
            id: "actionPanel_foragingTotal",
            desc: isZH
                ? "动作面板显示：采摘综合图显示综合收益 [依赖上一项]"
                : "Action panel: Overall profit of the foraging maps with multiple outcomes. [Depends on the previous selection]",
            isTrue: true,
        },
        networth: {
            id: "networth",
            desc: isZH
                ? "右上角显示：Networth总资产(+2及以上物品按强化模拟成本计算)"
                : "Top right: Networth(Items with at least 2 enhancement levels are valued by enchancing simulator).",
            isTrue: true,
        },
        invWorth: {
            id: "invWorth",
            desc: isZH
                ? "仓库搜索栏显示：仓库中物品总价值 [依赖上一项]"
                : "Inventory search bar: Total value of the items in the inventory. [Depends on the previous selection]",
            isTrue: true,
        },
        itemTooltip_prices: {
            id: "itemTooltip_prices",
            desc: isZH ? "物品悬浮窗显示：24小时市场均价" : "Item tooltip: 24 hours average market price.",
            isTrue: true,
        },
        itemTooltip_profit: {
            id: "itemTooltip_profit",
            desc: isZH
                ? "物品悬浮窗显示：生产成本和利润计算 [依赖上一项]"
                : "Item tooltip: Production cost and profit. [Depends on the previous selection]",
            isTrue: true,
        },
        showConsumTips: {
            id: "showConsumTips",
            desc: isZH
                ? "物品悬浮窗显示：消耗品回血回魔速度、回复性价比、每天最多消耗数量"
                : "Item tooltip: HP/MP consumables restore speed, cost performance, max cost per day.",
            isTrue: true,
        },
        networkAlert: {
            id: "networkAlert",
            desc: isZH ? "右上角显示：无法联网更新市场数据时，红字警告" : "Top right: Alert message when market price data can not be fetched.",
            isTrue: true,
        },
        expPercentage: {
            id: "expPercentage",
            desc: isZH ? "左侧栏显示：技能经验百分比" : "Left sidebar: Percentages of exp of the skill levels.",
            isTrue: true,
        },
        battlePanel: {
            id: "battlePanel",
            desc: isZH
                ? "战斗总结面板（战斗时点击玩家头像）显示：平均每小时战斗次数、收入、经验"
                : "Battle info panel(click on player avatar during combat): Encounters/hour, revenue, exp.",
            isTrue: true,
        },
        itemIconLevel: {
            id: "itemIconLevel",
            desc: isZH ? "装备图标右上角显示：装备等级" : "Top right corner of equipment icons: Equipment level.",
            isTrue: true,
        },
        showsKeyInfoInIcon: {
            id: "showsKeyInfoInIcon",
            desc: isZH
                ? "钥匙和钥匙碎片图标右上角显示：对应的地图序号 [依赖上一项]"
                : "Top right corner of key/fragment icons: Corresponding combat zone index number. [Depends on the previous selection]",
            isTrue: true,
        },
        marketFilter: {
            id: "marketFilter",
            desc: isZH ? "市场页面显示：装备按等级、职业、部位筛选" : "Marketplace: Filter by equipment level, class, slot.",
            isTrue: true,
        },
        taskMapIndex: {
            id: "taskMapIndex",
            desc: isZH ? "任务页面显示：目标战斗地图序号" : "Tasks page: Combat zone index number.",
            isTrue: true,
        },
        mapIndex: {
            id: "mapIndex",
            desc: isZH ? "战斗地图选择页面显示：地图序号" : "Combat zones page: Combat zone index number.",
            isTrue: true,
        },
        skillbook: {
            id: "skillbook",
            desc: isZH
                ? "技能书的物品词典面板显示：到多少级还需要多少本技能书"
                : "Item dictionary of skill books: Number of books needed to reach target skill level.",
            isTrue: true,
        },
        ThirdPartyLinks: {
            id: "ThirdPartyLinks",
            desc: isZH ? "左侧菜单栏显示：第三方工具网站链接、脚本设置链接" : "Left sidebar: Links to 3rd-party websites, script settings.",
            isTrue: true,
        },
        actionQueue: {
            id: "actionQueue",
            desc: isZH
                ? "上方动作队列菜单显示：队列中每个动作预计总时间、到何时完成"
                : "Queued actions panel at the top: Estimated total time and complete time of each queued action.",
            isTrue: true,
        },
        enhanceSim: {
            id: "enhanceSim",
            desc: isZH
                ? "带强化等级的装备的悬浮菜单显示：强化模拟计算"
                : "Tooltip of equipment with enhancement level: Enhancing simulator calculations.",
            isTrue: true,
        },
        checkEquipment: {
            id: "checkEquipment",
            desc: isZH
                ? "页面上方显示：战斗时穿了生产装备，或者生产时没有穿对应的生产装备而仓库里有，红字警告"
                : "Top: Alert message when combating with production equipments equipted, or producing when there are unequipted corresponding production equipment in the inventory.",
            isTrue: true,
        },
        notifiEmptyAction: {
            id: "notifiEmptyAction",
            desc: isZH
                ? "弹窗通知：正在空闲（游戏网页打开时才有效）"
                : "Browser notification: Action queue is empty. (Works only when the game page is open.)",
            isTrue: true,
        },
        tryBackupApiUrl: {
            id: "tryBackupApiUrl",
            desc: isZH
                ? "无法从Github更新市场数据时，尝试使用备份地址（备份地址不保证长期维护）"
                : "Try backup mirror server when failing to fetch market price API on Github. (Long-term maintenance of the backup server is not guarenteed.) (This is mainly for mainland China users.)",
            isTrue: true,
        },
        fillMarketOrderPrice: {
            id: "fillMarketOrderPrice",
            desc: isZH
                ? "发布市场订单时自动填写为最小压价"
                : "Automatically input price with the smallest increasement/decreasement when posting marketplace bid/sell orders.",
            isTrue: true,
        },
        showDamage: {
            id: "showDamage",
            desc: isZH ? "战斗时，人物头像下方显示：伤害统计数字" : "Bottom of player avatar during combat: DPS.",
            isTrue: true,
        },
        showDamageGraph: {
            id: "showDamageGraph",
            desc: isZH
                ? "战斗时，悬浮窗显示：伤害统计图表 [依赖上一项]"
                : "Floating window during combat: DPS chart. [Depends on the previous selection]",
            isTrue: true,
        },
    };
    readSettings();

    const MARKET_JSON_LOCAL_BACKUP = `{"time":1718652602,"market":{"Amber":{"ask":6400,"bid":6200},"Amethyst":{"ask":76000,"bid":70000},"Apple":{"ask":8,"bid":5},"Apple Gummy":{"ask":19,"bid":11},"Apple Yogurt":{"ask":290,"bid":155},"Aqua Arrow":{"ask":12000,"bid":10000},"Aqua Essence":{"ask":32,"bid":17},"Arabica Coffee Bean":{"ask":140,"bid":130},"Arcane Bow":{"ask":320000,"bid":200000},"Arcane Crossbow":{"ask":210000,"bid":150000},"Arcane Fire Staff":{"ask":235000,"bid":-1},"Arcane Log":{"ask":270,"bid":245},"Arcane Lumber":{"ask":840,"bid":800},"Arcane Nature Staff":{"ask":150000,"bid":-1},"Arcane Water Staff":{"ask":165000,"bid":-1},"Artisan Tea":{"ask":720,"bid":600},"Attack Coffee":{"ask":400,"bid":255},"Azure Boots":{"ask":38000,"bid":1350},"Azure Brush":{"ask":29000,"bid":2050},"Azure Buckler":{"ask":40000,"bid":-1},"Azure Bulwark":{"ask":13000,"bid":4000},"Azure Cheese":{"ask":320,"bid":275},"Azure Chisel":{"ask":50000,"bid":-1},"Azure Enhancer":{"ask":52000,"bid":6000},"Azure Gauntlets":{"ask":-1,"bid":-1},"Azure Hammer":{"ask":35000,"bid":4200},"Azure Hatchet":{"ask":52000,"bid":4200},"Azure Helmet":{"ask":36000,"bid":-1},"Azure Mace":{"ask":40000,"bid":15000},"Azure Milk":{"ask":52,"bid":47},"Azure Needle":{"ask":52000,"bid":5800},"Azure Plate Body":{"ask":47000,"bid":15000},"Azure Plate Legs":{"ask":44000,"bid":2050},"Azure Pot":{"ask":52000,"bid":5400},"Azure Shears":{"ask":52000,"bid":5000},"Azure Spatula":{"ask":37000,"bid":4700},"Azure Spear":{"ask":42000,"bid":-1},"Azure Sword":{"ask":44000,"bid":-1},"Bamboo Boots":{"ask":19500,"bid":-1},"Bamboo Branch":{"ask":41,"bid":28},"Bamboo Fabric":{"ask":340,"bid":200},"Bamboo Gloves":{"ask":8200,"bid":2650},"Bamboo Hat":{"ask":37000,"bid":4000},"Bamboo Robe Bottoms":{"ask":50000,"bid":30000},"Bamboo Robe Top":{"ask":84000,"bid":5400},"Bear Essence":{"ask":80,"bid":58},"Beast Boots":{"ask":45000,"bid":25000},"Beast Bracers":{"ask":66000,"bid":17000},"Beast Chaps":{"ask":110000,"bid":30000},"Beast Hide":{"ask":24,"bid":21},"Beast Hood":{"ask":82000,"bid":26000},"Beast Leather":{"ask":660,"bid":400},"Beast Tunic":{"ask":90000,"bid":26000},"Berserk":{"ask":360000,"bid":320000},"Birch Bow":{"ask":18000,"bid":960},"Birch Crossbow":{"ask":-1,"bid":720},"Birch Fire Staff":{"ask":14000,"bid":-1},"Birch Log":{"ask":60,"bid":52},"Birch Lumber":{"ask":275,"bid":205},"Birch Nature Staff":{"ask":28500,"bid":2000},"Birch Water Staff":{"ask":28000,"bid":720},"Black Bear Fluff":{"ask":56000,"bid":41000},"Black Bear Shoes":{"ask":150000,"bid":60000},"Black Tea Leaf":{"ask":18,"bid":16},"Blackberry":{"ask":44,"bid":28},"Blackberry Cake":{"ask":400,"bid":250},"Blackberry Donut":{"ask":340,"bid":300},"Blessed Tea":{"ask":980,"bid":720},"Blueberry":{"ask":30,"bid":24},"Blueberry Cake":{"ask":295,"bid":58},"Blueberry Donut":{"ask":380,"bid":78},"Brewing Tea":{"ask":70,"bid":-1},"Burble Brush":{"ask":64000,"bid":-1},"Burble Buckler":{"ask":115000,"bid":-1},"Burble Bulwark":{"ask":20500,"bid":-1},"Burble Chisel":{"ask":64000,"bid":11000},"Burble Enhancer":{"ask":66000,"bid":-1},"Burble Gauntlets":{"ask":58000,"bid":-1},"Burble Hatchet":{"ask":66000,"bid":9400},"Burble Helmet":{"ask":64000,"bid":-1},"Burble Mace":{"ask":120000,"bid":35000},"Burble Needle":{"ask":66000,"bid":-1},"Burble Plate Body":{"ask":90000,"bid":-1},"Burble Pot":{"ask":66000,"bid":9000},"Burble Shears":{"ask":64000,"bid":16500},"Burble Spatula":{"ask":64000,"bid":-1},"Burble Sword":{"ask":86000,"bid":-1},"Burble Tea Leaf":{"ask":80,"bid":56},"Cedar Bow":{"ask":21500,"bid":3500},"Cedar Fire Staff":{"ask":45000,"bid":3500},"Cedar Log":{"ask":94,"bid":68},"Cedar Lumber":{"ask":380,"bid":340},"Cedar Water Staff":{"ask":40000,"bid":3100},"Centaur Boots":{"ask":2000000,"bid":-1},"Centaur Hoof":{"ask":220000,"bid":200000},"Cheese Boots":{"ask":7000,"bid":66},"Cheese Brush":{"ask":2950,"bid":-1},"Cheese Buckler":{"ask":720,"bid":-1},"Cheese Chisel":{"ask":6600,"bid":-1},"Cheese Enhancer":{"ask":13000,"bid":-1},"Cheese Gauntlets":{"ask":6800,"bid":64},"Cheese Hammer":{"ask":2550,"bid":660},"Cheese Helmet":{"ask":5600,"bid":-1},"Cheese Mace":{"ask":5800,"bid":300},"Cheese Plate Body":{"ask":9200,"bid":150},"Cheese Plate Legs":{"ask":8600,"bid":-1},"Cheese Pot":{"ask":3300,"bid":540},"Cheese Spatula":{"ask":4700,"bid":115},"Cheese Spear":{"ask":100000,"bid":-1},"Cheese Sword":{"ask":4000,"bid":300},"Cleave":{"ask":140000,"bid":120000},"Cocoon":{"ask":135,"bid":110},"Coin":{"ask":-1,"bid":-1},"Cotton":{"ask":23,"bid":14},"Cotton Boots":{"ask":840,"bid":-1},"Cotton Fabric":{"ask":140,"bid":56},"Cotton Hat":{"ask":3000,"bid":-1},"Cotton Robe Bottoms":{"ask":1000,"bid":-1},"Cotton Robe Top":{"ask":3000,"bid":-1},"Crab Pincer":{"ask":20000,"bid":15000},"Crafting Tea":{"ask":480,"bid":260},"Crimson Boots":{"ask":58000,"bid":13000},"Crimson Buckler":{"ask":110000,"bid":-1},"Crimson Bulwark":{"ask":48000,"bid":-1},"Crimson Cheese":{"ask":380,"bid":350},"Crimson Enhancer":{"ask":70000,"bid":41000},"Crimson Gauntlets":{"ask":56000,"bid":14000},"Crimson Hammer":{"ask":76000,"bid":11500},"Crimson Helmet":{"ask":84000,"bid":34000},"Crimson Mace":{"ask":100000,"bid":14000},"Crimson Milk":{"ask":100,"bid":84},"Crimson Plate Body":{"ask":92000,"bid":28000},"Crimson Plate Legs":{"ask":94000,"bid":24500},"Crimson Pot":{"ask":45000,"bid":30000},"Crimson Spatula":{"ask":78000,"bid":18500},"Crimson Spear":{"ask":70000,"bid":62000},"Crimson Sword":{"ask":88000,"bid":52000},"Crushed Amber":{"ask":420,"bid":330},"Crushed Amethyst":{"ask":4800,"bid":4300},"Crushed Garnet":{"ask":880,"bid":410},"Crushed Moonstone":{"ask":1400,"bid":620},"Crushed Pearl":{"ask":920,"bid":780},"Cupcake":{"ask":240,"bid":5},"Donut":{"ask":275,"bid":52},"Dragon Fruit":{"ask":120,"bid":100},"Dragon Fruit Gummy":{"ask":400,"bid":370},"Earrings Of Armor":{"ask":3700000,"bid":-1},"Earrings Of Gathering":{"ask":3400000,"bid":520000},"Earrings Of Regeneration":{"ask":4000000,"bid":3600000},"Earrings Of Resistance":{"ask":1650000,"bid":30000},"Efficiency Tea":{"ask":640,"bid":500},"Elemental Affinity":{"ask":540000,"bid":520000},"Emp Tea Leaf":{"ask":86,"bid":80},"Enhancing Tea":{"ask":380,"bid":50},"Excelsa Coffee Bean":{"ask":330,"bid":290},"Eyessence":{"ask":80,"bid":66},"Fieriosa Coffee Bean":{"ask":260,"bid":180},"Fireball":{"ask":9400,"bid":8400},"Flame Arrow":{"ask":10500,"bid":6000},"Flame Blast":{"ask":150000,"bid":130000},"Flaming Cloth":{"ask":46000,"bid":19000},"Flaming Robe Top":{"ask":105000,"bid":60000},"Flax":{"ask":80,"bid":45},"Foraging Tea":{"ask":-1,"bid":56},"Garnet":{"ask":13000,"bid":12000},"Gathering Tea":{"ask":480,"bid":300},"Giant Pouch":{"ask":6000000,"bid":5400000},"Ginkgo Bow":{"ask":94000,"bid":68000},"Ginkgo Crossbow":{"ask":70000,"bid":30000},"Ginkgo Log":{"ask":100,"bid":46},"Ginkgo Lumber":{"ask":420,"bid":400},"Ginkgo Nature Staff":{"ask":96000,"bid":-1},"Gobo Boomstick":{"ask":20500,"bid":-1},"Gobo Boots":{"ask":25000,"bid":-1},"Gobo Bracers":{"ask":34000,"bid":-1},"Gobo Essence":{"ask":120,"bid":84},"Gobo Hide":{"ask":14,"bid":12},"Gobo Hood":{"ask":26000,"bid":10500},"Gobo Shooter":{"ask":20000,"bid":-1},"Gobo Slasher":{"ask":30000,"bid":25000},"Gobo Smasher":{"ask":22000,"bid":20500},"Gobo Tunic":{"ask":27500,"bid":-1},"Goggles":{"ask":41000,"bid":31000},"Golem Essence":{"ask":260,"bid":230},"Granite Bludgeon":{"ask":47000000,"bid":20000000},"Green Tea Leaf":{"ask":13,"bid":10},"Grizzly Bear Fluff":{"ask":45000,"bid":41000},"Gummy":{"ask":140,"bid":10},"Heal":{"ask":165000,"bid":140000},"Holy Boots":{"ask":155000,"bid":60000},"Holy Buckler":{"ask":285000,"bid":-1},"Holy Bulwark":{"ask":135000,"bid":-1},"Holy Cheese":{"ask":860,"bid":840},"Holy Enhancer":{"ask":170000,"bid":120000},"Holy Gauntlets":{"ask":360000,"bid":100000},"Holy Hammer":{"ask":180000,"bid":100000},"Holy Helmet":{"ask":145000,"bid":-1},"Holy Mace":{"ask":270000,"bid":-1},"Holy Milk":{"ask":300,"bid":285},"Holy Plate Body":{"ask":200000,"bid":115000},"Holy Plate Legs":{"ask":135000,"bid":-1},"Holy Pot":{"ask":185000,"bid":135000},"Holy Spatula":{"ask":190000,"bid":-1},"Holy Spear":{"ask":800000,"bid":-1},"Holy Sword":{"ask":390000,"bid":120000},"Icy Cloth":{"ask":28500,"bid":15000},"Icy Robe Bottoms":{"ask":98000,"bid":40000},"Icy Robe Top":{"ask":94000,"bid":60000},"Jade":{"ask":29500,"bid":26500},"Jungle Essence":{"ask":82,"bid":62},"Large Artisan's Crate":{"ask":-1,"bid":-1},"Large Pouch":{"ask":600000,"bid":-1},"Large Treasure Chest":{"ask":-1,"bid":-1},"Liberica Coffee Bean":{"ask":255,"bid":245},"Linen Boots":{"ask":16500,"bid":580},"Linen Gloves":{"ask":20000,"bid":580},"Linen Hat":{"ask":13500,"bid":-1},"Linen Robe Bottoms":{"ask":52000,"bid":-1},"Living Granite":{"ask":1700000,"bid":1350000},"Log":{"ask":30,"bid":26},"Lucky Coffee":{"ask":1000,"bid":800},"Magic Coffee":{"ask":390,"bid":350},"Magnet":{"ask":94000,"bid":56000},"Magnifying Glass":{"ask":780000,"bid":620000},"Maim":{"ask":94000,"bid":84000},"Marsberry":{"ask":35,"bid":28},"Marsberry Donut":{"ask":400,"bid":360},"Medium Artisan's Crate":{"ask":-1,"bid":-1},"Medium Meteorite Cache":{"ask":-1,"bid":-1},"Medium Treasure Chest":{"ask":-1,"bid":-1},"Milk":{"ask":33,"bid":31},"Milking Tea":{"ask":130,"bid":56},"Minor Heal":{"ask":16500,"bid":13500},"Mooberry":{"ask":90,"bid":76},"Mooberry Cake":{"ask":540,"bid":420},"Mooberry Donut":{"ask":500,"bid":350},"Moonstone":{"ask":23000,"bid":20500},"Necklace Of Efficiency":{"ask":5600000,"bid":1550000},"Necklace Of Wisdom":{"ask":6800000,"bid":6200000},"Orange Gummy":{"ask":68,"bid":33},"Orange Yogurt":{"ask":410,"bid":210},"Panda Gloves":{"ask":540000,"bid":300000},"Peach":{"ask":47,"bid":33},"Peach Gummy":{"ask":275,"bid":175},"Pearl":{"ask":13500,"bid":13000},"Pierce":{"ask":-1,"bid":-1},"Pincer Gloves":{"ask":45000,"bid":12000},"Plum":{"ask":72,"bid":60},"Plum Yogurt":{"ask":250,"bid":220},"Poke":{"ask":6200,"bid":6000},"Power Coffee":{"ask":600,"bid":450},"Precision":{"ask":30000,"bid":18500},"Purpleheart Bow":{"ask":50000,"bid":40000},"Purpleheart Crossbow":{"ask":37000,"bid":-1},"Purpleheart Fire Staff":{"ask":64000,"bid":-1},"Purpleheart Lumber":{"ask":430,"bid":420},"Purpleheart Nature Staff":{"ask":94000,"bid":-1},"Purpleheart Water Staff":{"ask":90000,"bid":41000},"Quick Shot":{"ask":3300,"bid":3200},"Radiant Fabric":{"ask":720,"bid":640},"Radiant Fiber":{"ask":135,"bid":115},"Radiant Gloves":{"ask":70000,"bid":-1},"Radiant Robe Bottoms":{"ask":210000,"bid":165000},"Radiant Robe Top":{"ask":230000,"bid":185000},"Rain Of Arrows":{"ask":160000,"bid":130000},"Rainbow Brush":{"ask":100000,"bid":50000},"Rainbow Buckler":{"ask":275000,"bid":-1},"Rainbow Bulwark":{"ask":78000,"bid":-1},"Rainbow Chisel":{"ask":120000,"bid":30000},"Rainbow Enhancer":{"ask":100000,"bid":62000},"Rainbow Gauntlets":{"ask":100000,"bid":-1},"Rainbow Hatchet":{"ask":110000,"bid":31000},"Rainbow Helmet":{"ask":70000,"bid":58000},"Rainbow Mace":{"ask":145000,"bid":-1},"Rainbow Needle":{"ask":80000,"bid":30000},"Rainbow Plate Body":{"ask":200000,"bid":-1},"Rainbow Plate Legs":{"ask":-1,"bid":70000},"Rainbow Shears":{"ask":120000,"bid":33000},"Rainbow Spatula":{"ask":100000,"bid":41000},"Rainbow Spear":{"ask":105000,"bid":74000},"Ranged Coffee":{"ask":600,"bid":500},"Ranger Necklace":{"ask":9800000,"bid":-1},"Red Tea Leaf":{"ask":110,"bid":52},"Redwood Crossbow":{"ask":135000,"bid":-1},"Redwood Fire Staff":{"ask":62000,"bid":-1},"Redwood Log":{"ask":32,"bid":25},"Redwood Nature Staff":{"ask":125000,"bid":-1},"Redwood Water Staff":{"ask":49000,"bid":-1},"Reptile Boots":{"ask":24000,"bid":580},"Reptile Chaps":{"ask":24000,"bid":1050},"Reptile Hide":{"ask":15,"bid":7},"Reptile Hood":{"ask":34000,"bid":-1},"Reptile Tunic":{"ask":27500,"bid":-1},"Ring Of Armor":{"ask":4500000,"bid":1300000},"Ring Of Gathering":{"ask":4000000,"bid":800000},"Ring Of Regeneration":{"ask":4100000,"bid":3400000},"Ring Of Resistance":{"ask":2000000,"bid":500000},"Robusta Coffee Bean":{"ask":180,"bid":150},"Rough Bracers":{"ask":9000,"bid":-1},"Rough Chaps":{"ask":3300,"bid":-1},"Rough Hide":{"ask":56,"bid":47},"Rough Leather":{"ask":430,"bid":240},"Rough Tunic":{"ask":2200,"bid":-1},"Scratch":{"ask":4000,"bid":1300},"Silk Boots":{"ask":94000,"bid":-1},"Silk Fabric":{"ask":820,"bid":740},"Silk Gloves":{"ask":76000,"bid":-1},"Silk Robe Bottoms":{"ask":295000,"bid":60000},"Silk Robe Top":{"ask":140000,"bid":-1},"Smack":{"ask":4300,"bid":3500},"Small Meteorite Cache":{"ask":-1,"bid":-1},"Small Pouch":{"ask":16500,"bid":-1},"Snail Shell":{"ask":3500,"bid":2050},"Snail Shell Helmet":{"ask":6000,"bid":-1},"Snake Fang":{"ask":2750,"bid":2000},"Sorcerer Boots":{"ask":300000,"bid":-1},"Sorcerer Essence":{"ask":235,"bid":215},"Sorcerer's Sole":{"ask":62000,"bid":60000},"Spaceberry Cake":{"ask":940,"bid":900},"Spaceberry Donut":{"ask":680,"bid":660},"Spacia Coffee Bean":{"ask":720,"bid":620},"Stalactite Shard":{"ask":1550000,"bid":1400000},"Stalactite Spear":{"ask":-1,"bid":25000000},"Stamina Coffee":{"ask":350,"bid":295},"Star Fruit":{"ask":245,"bid":225},"Star Fruit Gummy":{"ask":640,"bid":600},"Star Fruit Yogurt":{"ask":780,"bid":760},"Strawberry Cake":{"ask":520,"bid":380},"Strawberry Donut":{"ask":360,"bid":260},"Stunning Blow":{"ask":680000,"bid":390000},"Super Attack Coffee":{"ask":1500,"bid":1000},"Super Brewing Tea":{"ask":-1,"bid":180},"Super Cheesesmithing Tea":{"ask":3200,"bid":1850},"Super Crafting Tea":{"ask":5400,"bid":2000},"Super Defense Coffee":{"ask":1850,"bid":1400},"Super Enhancing Tea":{"ask":1350,"bid":1050},"Super Foraging Tea":{"ask":2900,"bid":275},"Super Magic Coffee":{"ask":6600,"bid":5800},"Super Milking Tea":{"ask":1950,"bid":145},"Super Power Coffee":{"ask":2650,"bid":2450},"Super Stamina Coffee":{"ask":2000,"bid":1650},"Super Tailoring Tea":{"ask":6800,"bid":760},"Super Woodcutting Tea":{"ask":2200,"bid":295},"Sweep":{"ask":76000,"bid":70000},"Swiftness Coffee":{"ask":960,"bid":700},"Tailoring Tea":{"ask":490,"bid":155},"Tome Of The Elements":{"ask":160000,"bid":135000},"Toughness":{"ask":28500,"bid":21500},"Toxic Pollen":{"ask":155000,"bid":115000},"Turtle Shell Body":{"ask":19500,"bid":9000},"Turtle Shell Legs":{"ask":23500,"bid":6000},"Twilight Essence":{"ask":200,"bid":125},"Umbral Bracers":{"ask":58000,"bid":-1},"Umbral Chaps":{"ask":115000,"bid":-1},"Umbral Hide":{"ask":64,"bid":35},"Umbral Leather":{"ask":720,"bid":620},"Umbral Tunic":{"ask":115000,"bid":-1},"Vampire Fang":{"ask":800000,"bid":560000},"Vampirism":{"ask":78000,"bid":39000},"Verdant Boots":{"ask":-1,"bid":320},"Verdant Brush":{"ask":9800,"bid":1350},"Verdant Bulwark":{"ask":17500,"bid":-1},"Verdant Cheese":{"ask":255,"bid":230},"Verdant Chisel":{"ask":16000,"bid":580},"Verdant Gauntlets":{"ask":-1,"bid":680},"Verdant Hammer":{"ask":25000,"bid":-1},"Verdant Hatchet":{"ask":35000,"bid":3000},"Verdant Mace":{"ask":16000,"bid":-1},"Verdant Milk":{"ask":54,"bid":50},"Verdant Needle":{"ask":35000,"bid":-1},"Verdant Plate Legs":{"ask":-1,"bid":560},"Verdant Pot":{"ask":34000,"bid":4000},"Verdant Shears":{"ask":15000,"bid":5000},"Verdant Spear":{"ask":16000,"bid":2600},"Verdant Sword":{"ask":16000,"bid":720},"Vision Helmet":{"ask":98000,"bid":-1},"Water Strike":{"ask":13000,"bid":12500},"Werewolf Claw":{"ask":310000,"bid":240000},"Werewolf Slasher":{"ask":-1,"bid":520000},"Wisdom Coffee":{"ask":880,"bid":840},"Wisdom Tea":{"ask":600,"bid":460},"Wizard Necklace":{"ask":6200000,"bid":-1},"Wooden Bow":{"ask":8400,"bid":-1},"Wooden Crossbow":{"ask":7800,"bid":-1},"Wooden Fire Staff":{"ask":4000,"bid":-1},"Wooden Water Staff":{"ask":-1,"bid":-1},"Yogurt":{"ask":245,"bid":80},"Burble Boots":{"ask":32000,"bid":-1},"Burble Cheese":{"ask":490,"bid":450},"Burble Hammer":{"ask":35000,"bid":9200},"Burble Milk":{"ask":100,"bid":92},"Cedar Nature Staff":{"ask":44000,"bid":-1},"Cheese":{"ask":115,"bid":92},"Cheese Bulwark":{"ask":19000,"bid":-1},"Cheese Hatchet":{"ask":6800,"bid":155},"Cheese Needle":{"ask":9600,"bid":-1},"Cheese Shears":{"ask":4000,"bid":-1},"Cheesesmithing Tea":{"ask":520,"bid":200},"Cooking Tea":{"ask":280,"bid":140},"Cotton Gloves":{"ask":330,"bid":-1},"Cowbell":{"ask":-1,"bid":-1},"Crimson Brush":{"ask":72000,"bid":-1},"Crimson Chisel":{"ask":80000,"bid":54000},"Crimson Hatchet":{"ask":80000,"bid":-1},"Crimson Shears":{"ask":-1,"bid":-1},"Critical Coffee":{"ask":1750,"bid":1550},"Crushed Jade":{"ask":1750,"bid":1650},"Defense Coffee":{"ask":500,"bid":330},"Dragon Fruit Yogurt":{"ask":520,"bid":490},"Flaming Robe Bottoms":{"ask":185000,"bid":120000},"Frenzy":{"ask":180000,"bid":175000},"Gobo Leather":{"ask":275,"bid":200},"Holy Chisel":{"ask":195000,"bid":180000},"Holy Hatchet":{"ask":190000,"bid":155000},"Holy Needle":{"ask":195000,"bid":150000},"Holy Shears":{"ask":185000,"bid":150000},"Ice Spear":{"ask":26500,"bid":23500},"Intelligence Coffee":{"ask":640,"bid":360},"Linen Fabric":{"ask":330,"bid":200},"Linen Robe Top":{"ask":16000,"bid":-1},"Lumber":{"ask":185,"bid":170},"Mirror Of Protection":{"ask":6200000,"bid":5800000},"Moolong Tea Leaf":{"ask":60,"bid":38},"Orange":{"ask":8,"bid":7},"Panda Fluff":{"ask":82000,"bid":50000},"Peach Yogurt":{"ask":330,"bid":300},"Plum Gummy":{"ask":150,"bid":94},"Processing Tea":{"ask":1450,"bid":720},"Purpleheart Log":{"ask":88,"bid":76},"Radiant Boots":{"ask":35000,"bid":-1},"Radiant Hat":{"ask":195000,"bid":125000},"Rainbow Boots":{"ask":88000,"bid":21000},"Rainbow Cheese":{"ask":420,"bid":370},"Rainbow Hammer":{"ask":110000,"bid":30000},"Rainbow Milk":{"ask":125,"bid":100},"Rainbow Pot":{"ask":86000,"bid":37000},"Rainbow Sword":{"ask":96000,"bid":80000},"Redwood Bow":{"ask":135000,"bid":-1},"Redwood Lumber":{"ask":310,"bid":200},"Reptile Bracers":{"ask":-1,"bid":-1},"Reptile Leather":{"ask":240,"bid":190},"Ring Of Rare Find":{"ask":4900000,"bid":3300000},"Rough Boots":{"ask":1850,"bid":-1},"Rough Hood":{"ask":7800,"bid":-1},"Shard Of Protection":{"ask":35000,"bid":34000},"Silk Hat":{"ask":285000,"bid":40000},"Small Artisan's Crate":{"ask":-1,"bid":-1},"Small Treasure Chest":{"ask":-1,"bid":-1},"Snake Fang Dirk":{"ask":6600,"bid":2500},"Spaceberry":{"ask":170,"bid":150},"Spike Shell":{"ask":340000,"bid":310000},"Star Fragment":{"ask":6400,"bid":6200},"Strawberry":{"ask":45,"bid":39},"Super Cooking Tea":{"ask":2000,"bid":740},"Super Intelligence Coffee":{"ask":2300,"bid":1850},"Super Ranged Coffee":{"ask":3400,"bid":1500},"Swamp Essence":{"ask":11,"bid":10},"Tome Of Healing":{"ask":76000,"bid":64000},"Turtle Shell":{"ask":6000,"bid":2750},"Umbral Boots":{"ask":30000,"bid":-1},"Umbral Hood":{"ask":170000,"bid":90000},"Vampire Fang Dirk":{"ask":16500000,"bid":6000000},"Verdant Buckler":{"ask":8800,"bid":-1},"Verdant Enhancer":{"ask":35000,"bid":5000},"Verdant Helmet":{"ask":30000,"bid":-1},"Verdant Spatula":{"ask":14500,"bid":-1},"Vision Shield":{"ask":900000,"bid":74000},"Wheat":{"ask":25,"bid":22},"Woodcutting Tea":{"ask":290,"bid":135},"Wooden Nature Staff":{"ask":8400,"bid":-1},"Cedar Crossbow":{"ask":24000,"bid":2600},"Earrings Of Rare Find":{"ask":3600000,"bid":2850000},"Egg":{"ask":19,"bid":12},"Entangle":{"ask":5600,"bid":3000},"Fighter Necklace":{"ask":16500000,"bid":-1},"Gator Vest":{"ask":5600,"bid":5200},"Ginkgo Fire Staff":{"ask":100000,"bid":-1},"Gobo Chaps":{"ask":24500,"bid":-1},"Gobo Stabber":{"ask":20500,"bid":-1},"Gourmet Tea":{"ask":480,"bid":350},"Grizzly Bear Shoes":{"ask":275000,"bid":150000},"Holy Brush":{"ask":180000,"bid":72000},"Large Meteorite Cache":{"ask":-1,"bid":-1},"Magnetic Gloves":{"ask":860000,"bid":-1},"Marsberry Cake":{"ask":520,"bid":450},"Medium Pouch":{"ask":86000,"bid":-1},"Polar Bear Fluff":{"ask":60000,"bid":41000},"Verdant Plate Body":{"ask":22000,"bid":800},"Ginkgo Water Staff":{"ask":175000,"bid":24500},"Polar Bear Shoes":{"ask":920000,"bid":62000},"Sugar":{"ask":8,"bid":7},"Crimson Needle":{"ask":74000,"bid":-1},"Burble Plate Legs":{"ask":86000,"bid":25000},"Burble Spear":{"ask":76000,"bid":35000},"Arcane Shield":{"ask":76000,"bid":-1},"Birch Shield":{"ask":5000,"bid":480},"Cedar Shield":{"ask":-1,"bid":-1},"Ginkgo Shield":{"ask":30000,"bid":-1},"Purpleheart Shield":{"ask":45000,"bid":-1},"Redwood Shield":{"ask":70000,"bid":41000},"Sighted Bracers":{"ask":820000,"bid":520000},"Spiked Bulwark":{"ask":-1,"bid":600000},"Wooden Shield":{"ask":170,"bid":-1},"Advanced Task Ring":{"ask":-1,"bid":-1},"Basic Task Ring":{"ask":-1,"bid":-1},"Expert Task Ring":{"ask":-1,"bid":-1},"Purple's Gift":{"ask":-1,"bid":-1},"Task Crystal":{"ask":-1,"bid":-1},"Task Token":{"ask":-1,"bid":-1},"Abyssal Essence":{"ask":235,"bid":170},"Channeling Coffee":{"ask":880,"bid":820},"Chrono Gloves":{"ask":4800000,"bid":3500000},"Chrono Sphere":{"ask":520000,"bid":500000},"Collector's Boots":{"ask":1450000,"bid":205000},"Colossus Core":{"ask":920000,"bid":860000},"Colossus Plate Body":{"ask":9800000,"bid":-1},"Colossus Plate Legs":{"ask":7800000,"bid":-1},"Demonic Core":{"ask":1050000,"bid":940000},"Demonic Plate Body":{"ask":-1,"bid":8000000},"Demonic Plate Legs":{"ask":12000000,"bid":-1},"Elusiveness":{"ask":23000,"bid":11500},"Enchanted Gloves":{"ask":6600000,"bid":-1},"Eye Of The Watcher":{"ask":490000,"bid":450000},"Eye Watch":{"ask":6000000,"bid":-1},"Firestorm":{"ask":500000,"bid":480000},"Fluffy Red Hat":{"ask":3200000,"bid":-1},"Frost Sphere":{"ask":540000,"bid":420000},"Frost Staff":{"ask":8200000,"bid":8000000},"Frost Surge":{"ask":620000,"bid":520000},"Gobo Defender":{"ask":250000,"bid":240000},"Gobo Rag":{"ask":82000,"bid":80000},"Infernal Battlestaff":{"ask":-1,"bid":-1},"Infernal Ember":{"ask":1250000,"bid":1200000},"Luna Robe Bottoms":{"ask":3100000,"bid":-1},"Luna Robe Top":{"ask":2800000,"bid":100000},"Luna Wing":{"ask":230000,"bid":220000},"Marine Chaps":{"ask":880000,"bid":-1},"Marine Scale":{"ask":62000,"bid":56000},"Marine Tunic":{"ask":-1,"bid":-1},"Nature's Veil":{"ask":720000,"bid":540000},"Puncture":{"ask":110000,"bid":100000},"Red Chef's Hat":{"ask":3800000,"bid":1300000},"Red Panda Fluff":{"ask":230000,"bid":180000},"Revenant Anima":{"ask":700000,"bid":600000},"Revenant Chaps":{"ask":8000000,"bid":-1},"Revenant Tunic":{"ask":8800000,"bid":5000000},"Shoebill Feather":{"ask":32000,"bid":26500},"Shoebill Shoes":{"ask":420000,"bid":200000},"Silencing Shot":{"ask":140000,"bid":130000},"Soul Fragment":{"ask":960000,"bid":740000},"Soul Hunter Crossbow":{"ask":-1,"bid":-1},"Steady Shot":{"ask":520000,"bid":430000},"Treant Bark":{"ask":18000,"bid":14000},"Treant Shield":{"ask":41000,"bid":-1},"Vampiric Bow":{"ask":15500000,"bid":-1},"Watchful Relic":{"ask":6000000,"bid":680000},"Bag Of 10 Cowbells":{"ask":275000,"bid":265000},"Aqua Aura":{"ask":2550000,"bid":2100000},"Critical Aura":{"ask":9800000,"bid":6800000},"Fierce Aura":{"ask":7400000,"bid":5600000},"Flame Aura":{"ask":7200000,"bid":4900000},"Insanity":{"ask":5800000,"bid":1600000},"Invincible":{"ask":19000000,"bid":12500000},"Provoke":{"ask":210000,"bid":145000},"Quick Aid":{"ask":920000,"bid":560000},"Rejuvenate":{"ask":2050000,"bid":1150000},"Revive":{"ask":1550000,"bid":760000},"Speed Aura":{"ask":9800000,"bid":6600000},"Sylvan Aura":{"ask":9000000,"bid":5600000},"Taunt":{"ask":125000,"bid":25000},"Acrobatic Hood":{"ask":-1,"bid":54000000},"Acrobat's Ribbon":{"ask":5800000,"bid":5600000},"Bishop's Codex":{"ask":88000000,"bid":62000000},"Bishop's Scroll":{"ask":7400000,"bid":6600000},"Blue Key Fragment":{"ask":450000,"bid":340000},"Brown Key Fragment":{"ask":2200000,"bid":2050000},"Burning Key Fragment":{"ask":6000000,"bid":5200000},"Chaotic Chain":{"ask":20500000,"bid":20000000},"Chaotic Flail":{"ask":-1,"bid":400000000},"Chimerical Chest":{"ask":-1,"bid":-1},"Chimerical Essence":{"ask":2650,"bid":2150},"Chimerical Key":{"ask":4300000,"bid":4000000},"Chimerical Quiver":{"ask":-1,"bid":-1},"Crippling Slash":{"ask":155000,"bid":115000},"Cursed Ball":{"ask":11000000,"bid":8400000},"Cursed Bow":{"ask":340000000,"bid":50000000},"Dark Key Fragment":{"ask":3700000,"bid":3300000},"Dodocamel Gauntlets":{"ask":50000000,"bid":40000000},"Dodocamel Plume":{"ask":6200000,"bid":5600000},"Earrings Of Threat":{"ask":4000000,"bid":400000},"Enchanted Chest":{"ask":-1,"bid":-1},"Enchanted Cloak":{"ask":-1,"bid":-1},"Enchanted Essence":{"ask":7400,"bid":6200},"Enchanted Key":{"ask":14000000,"bid":12500000},"Green Key Fragment":{"ask":450000,"bid":300000},"Griffin Chaps":{"ask":7600000,"bid":1000000},"Griffin Leather":{"ask":500000,"bid":420000},"Griffin Tunic":{"ask":6800000,"bid":1000000},"Impale":{"ask":27500,"bid":22500},"Jackalope Antler":{"ask":1800000,"bid":1600000},"Jackalope Staff":{"ask":39000000,"bid":14000000},"Knight's Aegis":{"ask":94000000,"bid":46000000},"Knight's Ingot":{"ask":6600000,"bid":5000000},"Magician's Cloth":{"ask":6600000,"bid":6200000},"Magician's Hat":{"ask":-1,"bid":46000000},"Mana Spring":{"ask":1100000,"bid":920000},"Manticore Shield":{"ask":-1,"bid":20500000},"Manticore Sting":{"ask":3100000,"bid":2750000},"Orange Key Fragment":{"ask":1050000,"bid":920000},"Penetrating Shot":{"ask":2550000,"bid":2050000},"Penetrating Strike":{"ask":360000,"bid":320000},"Pestilent Shot":{"ask":135000,"bid":100000},"Purple Key Fragment":{"ask":840000,"bid":780000},"Regal Jewel":{"ask":11500000,"bid":9000000},"Regal Sword":{"ask":-1,"bid":94000000},"Ring Of Threat":{"ask":3600000,"bid":400000},"Royal Cloth":{"ask":12500000,"bid":11500000},"Royal Fire Robe Bottoms":{"ask":-1,"bid":56000000},"Royal Fire Robe Top":{"ask":-1,"bid":70000000},"Royal Nature Robe Bottoms":{"ask":-1,"bid":-1},"Royal Nature Robe Top":{"ask":-1,"bid":-1},"Royal Water Robe Bottoms":{"ask":-1,"bid":100000000},"Royal Water Robe Top":{"ask":-1,"bid":45000000},"Sinister Cape":{"ask":-1,"bid":-1},"Sinister Chest":{"ask":-1,"bid":-1},"Sinister Essence":{"ask":3900,"bid":2850},"Sinister Key":{"ask":8200000,"bid":7400000},"Smoke Burst":{"ask":200000,"bid":125000},"Stone Key Fragment":{"ask":4900000,"bid":4600000},"Sundering Crossbow":{"ask":760000000,"bid":300000000},"Sundering Jewel":{"ask":27500000,"bid":24000000},"White Key Fragment":{"ask":1100000,"bid":1050000}}}`;
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
            if (settingsMap.showDamage.isTrue) {
                // Clear damage statistics panel
                players = [];
                monstersHP = [];
                startTime = null;
                endTime = null;
                totalDuration = 0;
                totalDamage = new Array(players.length).fill(0);
                monsterCounts = {};
                monsterEvasion = {};
            }
        } else if (obj && obj.type === "action_completed") {
            const action = obj.endCharacterAction;
            if (action.isDone === false) {
                for (const a of currentActionsHridList) {
                    if (a.id === action.id) {
                        a.currentCount = action.currentCount;
                    }
                }
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
        } else if (obj && obj.type === "new_battle") {
            if (settingsMap.showDamage.isTrue) {
                if (startTime && endTime) {
                    totalDuration += (endTime - startTime) / 1000;
                }
                startTime = Date.now();
                endTime = null;
                monstersHP = obj.monsters.map((monster) => monster.currentHitpoints);
                players = obj.players;
                if (!totalDamage.length) {
                    totalDamage = new Array(players.length).fill(0);
                }
                // Accumulate monster counts and store evasion ratings by combat style
                obj.monsters.forEach((monster) => {
                    const name = monster.name;
                    monsterCounts[name] = (monsterCounts[name] || 0) + 1;
                    if (!monsterEvasion[name]) {
                        monsterEvasion[name] = {};
                    }
                    players.forEach((player) => {
                        if (player.combatDetails && player.combatDetails.combatStats.combatStyleHrids) {
                            player.combatDetails.combatStats.combatStyleHrids.forEach((styleHrid) => {
                                const style = styleHrid.split("/").pop(); // Get the combat style (e.g., "ranged")
                                const evasionRating = monster.combatDetails[`${style}EvasionRating`];
                                monsterEvasion[name][player.name + "-" + style] = evasionRating;
                            });
                        }
                    });
                });
            }
        } else if (obj && obj.type === "battle_updated" && monstersHP.length) {
            if (settingsMap.showDamage.isTrue) {
                const mMap = obj.mMap;
                monstersHP.forEach((mHP, mIndex) => {
                    const monster = mMap[mIndex];
                    if (monster) {
                        const playerIndices = Object.keys(obj.pMap);
                        playerIndices.forEach((userIndex) => {
                            const hpDiff = mHP - monster.cHP;
                            if (hpDiff > 0) {
                                totalDamage[userIndex] += hpDiff;
                            }
                        });
                        monstersHP[mIndex] = monster.cHP;
                    }
                });
                endTime = Date.now();
                updateStatisticsPanel();
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
                    elem.placeholder = `${isZH ? "物品价值: " : "Items value: "}${numberFormatter(networthAskInv)} / ${numberFormatter(
                        networthBidInv
                    )}`;
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
                            ? `<div style="color: ${SCRIPT_COLOR_ALERT}">${
                                  isZH ? "网络问题无法更新市场数据" : "Can't update market prices due to Internet error"
                              }</div>`
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
            return Number(sec / 86400).toFixed(1) + (isZH ? " 天" : " days");
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
        <div style="color: ${SCRIPT_COLOR_TOOLTIP};">${isZH ? "日均价: " : "Daily average price: "}${numberFormatter(ask)} / ${numberFormatter(
                bid
            )} (${ask && ask > 0 ? numberFormatter(ask * amount) : ""} / ${bid && bid > 0 ? numberFormatter(bid * amount) : ""})</div>
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
                    pricePer100Hp ? pricePer100Hp.toFixed(0) + (isZH ? "金/100hp, " : "coins/100hp, ") : ""
                }${hpPerMiniute.toFixed(0)}hp/min, ${usePerday.toFixed(0)}${isZH ? "个/天" : "/day"}</div>`;
            } else if (mp && cd) {
                const mpPerMiniute = (60 / (cd / 1000000000)) * mp;
                const pricePer100Mp = ask ? ask / (mp / 100) : null;
                const usePerday = (24 * 60 * 60) / (cd / 1000000000);
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}">${
                    pricePer100Mp ? pricePer100Mp.toFixed(0) + (isZH ? "金/100mp, " : "coins/100hp, ") : ""
                }${mpPerMiniute.toFixed(0)}mp/min, ${usePerday.toFixed(0)}${isZH ? "个/天" : "/day"}</div>`;
            } else if (cd) {
                const usePerday = (24 * 60 * 60) / (cd / 1000000000);
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}">${usePerday.toFixed(0)}${isZH ? "个/天" : "/day"}</div>`;
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

                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">${
                    isZH ? "原料: " : "Source materials: "
                }${numberFormatter(totalAskPrice)}  / ${numberFormatter(totalBidPrice)}</div>`;
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

                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">${
                    isZH
                        ? "生产利润(卖单价进、买单价出；不包括Processing Tea、社区buff、稀有掉落；刷新网页更新人物数据)："
                        : "Production profit(Sell price in, bid price out; Not including processing tea, comm buffs, rare drops; Refresh page to update player data): "
                }</div>`;
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">x${droprate} ${
                    isZH ? "基础掉率" : "base drop rate,"
                } +${toolPercent}%${isZH ? "工具速度" : " tool speed,"} +${levelEffBuff}%${isZH ? "等级效率" : " level eff,"} +${houseEffBuff}%${
                    isZH ? "房子效率" : " house eff,"
                } +${teaBuffs.efficiency}%${isZH ? "茶效率" : " tea eff,"} +${itemEffiBuff}%${isZH ? "装备效率" : " equipment eff,"} +${
                    teaBuffs.quantity
                }%${isZH ? "茶额外数量" : " tea extra outcome,"} +${teaBuffs.lessResource}%${isZH ? "茶减少消耗" : " tea lower resource"}</div>`;
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">${
                    isZH ? "每小时生产" : "Production per hour"
                } ${Number((produceItemPerHour + extraQuantityPerHour) * droprate).toFixed(1)}${isZH ? " 个" : " items"}</div>`;
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP};">${isZH ? "利润: " : "Profit: "}${numberFormatter(
                    bid - (totalAskPrice * (1 - teaBuffs.lessResource / 100)) / droprate
                )}${isZH ? "/个" : "/item"}, ${numberFormatter(
                    produceItemPerHour * (bid * droprate - totalAskPrice * (1 - teaBuffs.lessResource / 100)) + extraQuantityPerHour * bid * droprate
                )}${isZH ? "/小时" : "/hour"}, ${numberFormatter(
                    24 *
                        (produceItemPerHour * (bid * droprate - totalAskPrice * (1 - teaBuffs.lessResource / 100)) +
                            extraQuantityPerHour * bid * droprate)
                )}${isZH ? "/天" : "/day"}</div>`;
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

                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">${
                    isZH
                        ? "生产利润(卖单价进、买单价出；不包括Processing Tea、社区buff、稀有掉落；刷新网页更新人物数据)："
                        : "Production profit(Sell price in, bid price out; Not including processing tea, comm buffs, rare drops; Refresh page to update player data): "
                }</div>`;
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">x${droprate} ${
                    isZH ? "基础掉率" : "base drop rate,"
                } +${toolPercent}%${isZH ? "工具速度" : " tool speed,"} +${levelEffBuff}%${isZH ? "等级效率" : " level eff,"} +${houseEffBuff}%${
                    isZH ? "房子效率" : " house eff,"
                } +${teaBuffs.efficiency}%${isZH ? "茶效率" : " tea eff,"} +${itemEffiBuff}%${isZH ? "装备效率" : " equipment eff,"} +${
                    teaBuffs.quantity
                }%${isZH ? "茶额外数量" : " tea extra outcome,"} +${teaBuffs.lessResource}%${isZH ? "茶减少消耗" : " tea lower resource"}</div>`;
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP}; font-size: 10px;">${
                    isZH ? "每小时生产" : "Production per hour"
                }${Number(produceItemPerHour + extraQuantityPerHour).toFixed(1)}${isZH ? " 个" : " items"}</div>`;
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP};">${isZH ? "利润: " : "Profit: "}${numberFormatter(bid)}${
                    isZH ? "/个" : "/item"
                }, ${numberFormatter(produceItemPerHour * bid + extraQuantityPerHour * bid)}${isZH ? "/小时" : "/hour"}, ${numberFormatter(
                    24 * (produceItemPerHour * bid + extraQuantityPerHour * bid)
                )}${isZH ? "/天" : "/day"}</div>`;
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
        const duration = Number(
            getOriTextFromElement(panel.querySelectorAll("div.SkillActionDetail_value__dQjYH")[4]).replace(/,/g, ".").replace("s", "")
        );
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
        hTMLStr = `<div id="quickInputButtons" style="color: ${SCRIPT_COLOR_MAIN}; text-align: left;">${isZH ? "做 " : "Do "}</div>`;
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
        quickInputButtonsDiv.append(document.createTextNode(isZH ? " 小时" : " hours"));

        quickInputButtonsDiv.append(document.createElement("div"));
        quickInputButtonsDiv.append(document.createTextNode(isZH ? "做 " : "Do "));
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
        quickInputButtonsDiv.append(document.createTextNode(isZH ? " 次" : " times"));

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
            hTMLStr = `<div id="tillLevel" style="color: ${SCRIPT_COLOR_MAIN}; text-align: left;">${
                isZH ? "到 " : "To reach level "
            }<input id="tillLevelInput" type="number" value="${currentLevel + 1}" min="${currentLevel + 1}" max="200">${
                isZH ? " 级还需做 " : ", need to do "
            }<span id="tillLevelNumber">${need.numOfActions}${isZH ? " 次" : " times "}[${timeReadable(need.timeSec)}]${
                isZH ? " (刷新网页更新当前等级)" : " (Refresh page to update current level)"
            }</span></div>`;

            quickInputButtonsDiv.insertAdjacentHTML("afterend", hTMLStr);
            const tillLevelInput = panel.querySelector("input#tillLevelInput");
            const tillLevelNumber = panel.querySelector("span#tillLevelNumber");
            tillLevelInput.onchange = () => {
                const targetLevel = Number(tillLevelInput.value);
                if (targetLevel > currentLevel && targetLevel <= 200) {
                    const need = calculateNeedToLevel(currentLevel, targetLevel, effBuff, duration, exp);
                    tillLevelNumber.textContent = `${need.numOfActions}${isZH ? " 次" : " times "}[${timeReadable(need.timeSec)}]${
                        isZH ? " (刷新网页更新当前等级)" : " (Refresh page to update current level)"
                    }`;
                } else {
                    tillLevelNumber.textContent = "Error";
                }
            };
            tillLevelInput.addEventListener("keyup", function (evt) {
                const targetLevel = Number(tillLevelInput.value);
                if (targetLevel > currentLevel && targetLevel <= 200) {
                    const need = calculateNeedToLevel(currentLevel, targetLevel, effBuff, duration, exp);
                    tillLevelNumber.textContent = `${need.numOfActions}${isZH ? " 次" : " times "}[${timeReadable(need.timeSec)}]${
                        isZH ? " (刷新网页更新当前等级)" : " (Refresh page to update current level)"
                    }`;
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
                `<div id="expPerHour" style="color: ${SCRIPT_COLOR_MAIN}; text-align: left;">${isZH ? "每小时经验: " : "Exp/hour: "}${numberFormatter(
                    Math.round((3600 / duration) * exp * effBuff)
                )} (+${Number((effBuff - 1) * 100).toFixed(1)}%${isZH ? "效率" : " eff"})</div>`
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

            let htmlStr = `<div id="totalProfit"  style="color: ${SCRIPT_COLOR_MAIN}; text-align: left;">${
                isZH ? "综合利润: " : "Overall profit: "
            }${numberFormatter(numOfActionsPerHour * virtualItemBid + extraQuantityPerHour * virtualItemBid)}${
                isZH ? "/小时" : "/hour"
            }, ${numberFormatter(24 * numOfActionsPerHour * virtualItemBid + extraQuantityPerHour * virtualItemBid)}${isZH ? "/天" : "/day"}</div>`;
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
                            `<div id="script_battleNumbers" style="color: ${SCRIPT_COLOR_MAIN};">${
                                isZH ? "每小时战斗: " : "Encounters/hour: "
                            }${efficiencyPerHour}${isZH ? " 次" : ""}</div>`
                        );
                    }
                }
                // 总收入
                document
                    .querySelector("div#script_battleNumbers")
                    .insertAdjacentHTML(
                        "afterend",
                        `<div id="script_totalIncome" style="color: ${SCRIPT_COLOR_MAIN};">${isZH ? "总收获: " : "Total revenue: "}${numberFormatter(
                            totalPriceAsk
                        )} / ${numberFormatter(totalPriceAskBid)}</div>`
                    );
                // 平均收入
                if (battleDurationSec) {
                    document
                        .querySelector("div#script_totalIncome")
                        .insertAdjacentHTML(
                            "afterend",
                            `<div id="script_averageIncome" style="color: ${SCRIPT_COLOR_MAIN};">${
                                isZH ? "每小时收获: " : "Revenue/hour: "
                            }${numberFormatter(totalPriceAsk / (battleDurationSec / 60 / 60))} / ${numberFormatter(
                                totalPriceAskBid / (battleDurationSec / 60 / 60)
                            )}</div>`
                        );
                    document
                        .querySelector("div#script_averageIncome")
                        .insertAdjacentHTML(
                            "afterend",
                            `<div id="script_totalIncomeDay" style="color: ${SCRIPT_COLOR_MAIN};">${
                                isZH ? "每天收获: " : "Revenue/day: "
                            }${numberFormatter((totalPriceAsk / (battleDurationSec / 60 / 60)) * 24)} / ${numberFormatter(
                                (totalPriceAskBid / (battleDurationSec / 60 / 60)) * 24
                            )}</div>`
                        );
                } else {
                    console.error("handleBattleSummary unable to display average income due to null battleDurationSec");
                }
                // 总经验
                document
                    .querySelector("div#script_totalIncomeDay")
                    .insertAdjacentHTML(
                        "afterend",
                        `<div id="script_totalSkillsExp" style="color: ${SCRIPT_COLOR_MAIN};">${isZH ? "总经验: " : "Total exp: "}${numberFormatter(
                            totalSkillsExp
                        )}</div>`
                    );
                // 平均经验
                if (battleDurationSec) {
                    document
                        .querySelector("div#script_totalSkillsExp")
                        .insertAdjacentHTML(
                            "afterend",
                            `<div id="script_averageSkillsExp" style="color: ${SCRIPT_COLOR_MAIN};">${
                                isZH ? "每小时总经验: " : "Total exp/hour: "
                            }${numberFormatter(totalSkillsExp / (battleDurationSec / 60 / 60))}</div>`
                        );

                    for (const [key, value] of Object.entries(message.unit.totalSkillExperienceMap)) {
                        let skillName = key.replace("/skills/", "");
                        let str = skillName.charAt(0).toUpperCase() + skillName.slice(1);
                        document
                            .querySelector("div#script_totalSkillsExp")
                            .parentElement.insertAdjacentHTML(
                                "beforeend",
                                `<div style="color: ${SCRIPT_COLOR_MAIN};">${isZH ? "每小时" : ""}${str}${
                                    isZH ? "经验: " : " exp/hour: "
                                }${numberFormatter(value / (battleDurationSec / 60 / 60))}</div>`
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
            } else if (settingsMap.showsKeyInfoInIcon.isTrue && (itemHrid.includes("_key_fragment") || itemHrid.includes("_key"))) {
                const map = new Map();
                map.set("/items/blue_key_fragment", isZH ? "图3" : "Z3");
                map.set("/items/green_key_fragment", isZH ? "图4" : "Z4");
                map.set("/items/purple_key_fragment", isZH ? "图5" : "Z5");
                map.set("/items/white_key_fragment", isZH ? "图6" : "Z6");
                map.set("/items/orange_key_fragment", isZH ? "图7" : "Z7");
                map.set("/items/brown_key_fragment", isZH ? "图8" : "Z8");
                map.set("/items/stone_key_fragment", isZH ? "图9" : "Z9");
                map.set("/items/dark_key_fragment", isZH ? "图10" : "Z10");
                map.set("/items/burning_key_fragment", isZH ? "图11" : "Z11");

                map.set("/items/chimerical_key", "3.4.5.8");
                map.set("/items/sinister_key", "5.7.8.10");
                map.set("/items/enchanted_key", "6.7.9.11");

                if (!div.querySelector("div.script_key")) {
                    div.insertAdjacentHTML(
                        "beforeend",
                        `<div class="script_key" style="z-index: 1; position: absolute; top: 2px; right: 2px; text-align: right; color: ${SCRIPT_COLOR_MAIN};">${map.get(
                            itemHrid
                        )}</div>`
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
                `<span id="script_filter_level" style="float: left; color: ${SCRIPT_COLOR_MAIN};">${isZH ? "等级: 大于等于 " : "Equipment level: >= "}
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
                `<span id="script_filter_level_to" style="float: left; color: ${SCRIPT_COLOR_MAIN};">${isZH ? "小于 " : "< "}
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
                `<span id="script_filter_skill" style="float: left; color: ${SCRIPT_COLOR_MAIN};">${isZH ? "职业: " : "Class: "}
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
                `<span id="script_filter_location" style="float: left; color: ${SCRIPT_COLOR_MAIN};">${isZH ? "部位: " : "Slot: "}
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
                        `<span class="script_taskMapIndex" style="text-align: right; color: ${SCRIPT_COLOR_MAIN};"> ${
                            isZH ? "图" : "Z"
                        }${index}</span>`
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
        let hTMLStr = `<div id="tillLevel" style="color: ${SCRIPT_COLOR_MAIN}; text-align: left;">${
            isZH ? "到 " : "To "
        }<input id="tillLevelInput" type="number" value="${currentLevel + 1}" min="${currentLevel + 1}" max="200">${
            isZH ? " 级还需 " : " level need "
        }<span id="tillLevelNumber">${numBooks}${
            isZH ? " 本书 (刷新网页更新当前等级)" : " books (Refresh page to update current level.)"
        }</span></div>`;
        panel.insertAdjacentHTML("beforeend", hTMLStr);
        const tillLevelInput = panel.querySelector("input#tillLevelInput");
        const tillLevelNumber = panel.querySelector("span#tillLevelNumber");
        tillLevelInput.onchange = () => {
            const targetLevel = Number(tillLevelInput.value);
            if (targetLevel > currentLevel && targetLevel <= 200) {
                let numBooks = getNeedBooksToLevel(currentLevel, currentExp, targetLevel, abilityPerBookExp);
                tillLevelNumber.textContent = `${numBooks}${
                    isZH ? " 本书 (刷新网页更新当前等级)" : " books (Refresh page to update current level.)"
                }`;
            } else {
                tillLevelNumber.textContent = "Error";
            }
        };
        tillLevelInput.addEventListener("keyup", function (evt) {
            const targetLevel = Number(tillLevelInput.value);
            if (targetLevel > currentLevel && targetLevel <= 200) {
                let numBooks = getNeedBooksToLevel(currentLevel, currentExp, targetLevel, abilityPerBookExp);
                tillLevelNumber.textContent = `${numBooks}${
                    isZH ? " 本书 (刷新网页更新当前等级)" : " books (Refresh page to update current level.)"
                }`;
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
                div.innerHTML = isZH ? "插件设置" : "Script settings";
                div.addEventListener("click", () => {
                    const array = document.querySelectorAll(".NavigationBar_navigationLink__3eAHA");
                    array[array.length - 1]?.click();
                });
                targetNode.insertAdjacentElement("afterbegin", div);

                div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = isZH ? "强化模拟 Enhancelator" : "Enhancement sim Enhancelator";
                div.addEventListener("click", () => {
                    window.open("https://doh-nuts.github.io/Enhancelator/", "_blank");
                });
                targetNode.insertAdjacentElement("afterbegin", div);

                div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = isZH ? "利润计算 Cowculator" : "Profit calc Cowculator";
                div.addEventListener("click", () => {
                    window.open("https://mwisim.github.io/cowculator/", "_blank");
                });
                targetNode.insertAdjacentElement("afterbegin", div);

                div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = isZH ? "利润计算 Mooneycalc" : "Profit calc Mooneycalc";
                div.addEventListener("click", () => {
                    window.open("https://mooneycalc.vercel.app/", "_blank");
                });
                targetNode.insertAdjacentElement("afterbegin", div);

                div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = isZH ? "战斗模拟（批量）" : "Combat sim (Batch)";
                div.addEventListener("click", () => {
                    window.open("http://43.129.194.214:5000/mwisim.github.io", "_blank");
                });
                targetNode.insertAdjacentElement("afterbegin", div);

                div = document.createElement("div");
                div.setAttribute("class", "NavigationBar_minorNavigationLink__31K7Y");
                div.style.color = SCRIPT_COLOR_MAIN;
                div.innerHTML = isZH ? "战斗模拟 MWISim" : "Combat sim MWISim";
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

            let str = isZH ? "到 ∞ " : "Complete at ∞ ";
            if (!isAccumulatedTimeInfinite) {
                accumulatedTimeSec += totalTimeSec;
                const currentTime = new Date();
                currentTime.setSeconds(currentTime.getSeconds() + accumulatedTimeSec);
                str = `${isZH ? "到 " : "Complete at "}${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(
                    2,
                    "0"
                )}:${String(currentTime.getSeconds()).padStart(2, "0")}`;
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
        const html = `<div id="script_queueTotalTime" style="color: ${SCRIPT_COLOR_MAIN};">${isZH ? "总时间：" : "Total time: "}${
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
                    `<div style="color: ${SCRIPT_COLOR_ALERT};">${
                        isZH ? "由于网络问题无法强化模拟: 1. 手机可能不支持脚本联网；2. 请尝试科学网络；" : "Enhancement sim Internet error"
                    }</div>`
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

        let appendHTMLStr = `<div style="color: ${SCRIPT_COLOR_TOOLTIP};">${
            isZH ? "不支持模拟+1装备" : "Enhancement sim of +1 equipments not supported"
        }</div>`;
        if (best) {
            let needMatStr = "";
            for (const [key, value] of Object.entries(best.costs.needMap)) {
                needMatStr += `<div>${key} ${isZH ? "单价: " : "price per item: "}${numberFormatter(value)}<div>`;
            }
            appendHTMLStr = `<div style="color: ${SCRIPT_COLOR_TOOLTIP};"><div>${
                isZH
                    ? "强化模拟（默认90级强化，2级房子，5级工具，0级手套，超级茶，幸运茶，卖单价收货，无工时费）："
                    : "Enhancement simulator: Default level 90 enhancing, level 2 house, level 5 tool, level 0 gloves, super tea, blessed tea, sell order price in, no player time fee"
            }</div><div>${isZH ? "总成本 " : "Total cost "}${numberFormatter(best.totalCost.toFixed(0))}</div><div>${isZH ? "耗时 " : "Time spend "}${
                best.simResult.totalActionTimeStr
            }</div>${
                best.protect_count > 0
                    ? `<div>${isZH ? "从 " : "Use protection from level "}` + best.protect_at + `${isZH ? " 级开始保护" : ""}</div>`
                    : `<div>${isZH ? "不需要保护" : "No protection use"}</div>`
            }<div>${isZH ? "保护 " : "Protection "}${best.protect_count.toFixed(1)}${isZH ? " 次" : " times"}</div><div>${
                isZH ? "+0底子: " : "+0 Base item: "
            }${numberFormatter(best.costs.baseCost)}</div><div>${
                best.protect_count > 0
                    ? (isZH ? "保护单价: " : "Price per protection: ") +
                      initData_itemDetailMap[best.costs.choiceOfProtection].name +
                      " " +
                      numberFormatter(best.costs.minProtectionCost)
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
    // Customization
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
                    `<div style="float: left; color: ${SCRIPT_COLOR_MAIN}">${
                        isZH ? "MWITools 设置 （刷新生效）：" : "MWITools Settings (refresh page to apply): "
                    }</div></br>`
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
                    `<div style="float: left;">${
                        isZH
                            ? "代码里搜索“自定义”可以手动修改字体颜色、强化模拟默认参数"
                            : `Search "Customization" in code to customize font colors and default enhancement simulation parameters.`
                    }</div></br>`
                );
                insertElem.insertAdjacentHTML(
                    "beforeend",
                    `<div style="float: left;">${
                        isZH
                            ? "推荐配合使用我的另一个插件：https://greasyfork.org/en/scripts/494468-mooneycalc-importer"
                            : `Check out my other script for exporting player data to 3rd-party tool websites: https://greasyfork.org/en/scripts/494468-mooneycalc-importer`
                    }</div></br>`
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
                warningStr = isZH ? "正穿着生产装备" : "Production equipment equipted";
            }
        } else if (currentActionHrid.includes("/actions/cooking/") || currentActionHrid.includes("/actions/brewing/")) {
            if (!hasHat && hasItemHridInInv("/items/red_chefs_hat")) {
                warningStr = isZH ? "没穿生产帽" : "Not wearing production hat";
            }
        } else if (
            currentActionHrid.includes("/actions/cheesesmithing/") ||
            currentActionHrid.includes("/actions/crafting/") ||
            currentActionHrid.includes("/actions/tailoring/")
        ) {
            if (!hasOffHand && hasItemHridInInv("/items/eye_watch")) {
                warningStr = isZH ? "没穿生产副手" : "Not wearing production off-hand";
            }
        } else if (
            currentActionHrid.includes("/actions/milking/") ||
            currentActionHrid.includes("/actions/foraging/") ||
            currentActionHrid.includes("/actions/woodcutting/")
        ) {
            if (!hasBoot && hasItemHridInInv("/items/collectors_boots")) {
                warningStr = isZH ? "没穿生产鞋" : "Not wearing production boots";
            }
        } else if (currentActionHrid.includes("/actions/enhancing")) {
            if (!hasGlove && hasItemHridInInv("/items/enchanted_gloves")) {
                warningStr = isZH ? "没穿强化手套" : "Not wearing enhancing gloves";
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
            text: isZH ? "动作队列为空" : "Action queue is empty.",
            title: "MWITools",
        });
    }

    /* 市场价格自动输入最小压价 */
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
        const title = getOriTextFromElement(node.querySelector(".MarketplacePanel_header__yahJo"));
        if (!title || title.includes(" Now")) {
            return;
        }
        const label = node.querySelector("span.MarketplacePanel_bestPrice__3bgKp");
        const inputDiv = node.querySelector(".MarketplacePanel_inputContainer__3xmB2 .MarketplacePanel_priceInputs__3iWxy");
        if (!label || !inputDiv) {
            console.error("handleMarketNewOrder can not find elements");
            return;
        }
        label.click();
        if (getOriTextFromElement(label.parentElement).toLowerCase().includes("best buy")) {
            inputDiv.querySelectorAll(".MarketplacePanel_buttonContainer__vJQud")[2]?.querySelector("div")?.click();
        } else if (getOriTextFromElement(label.parentElement).toLowerCase().includes("best sell")) {
            inputDiv.querySelectorAll(".MarketplacePanel_buttonContainer__vJQud")[1]?.querySelector("div")?.click();
        }
    }

    /* 伤害统计 */
    // 此功能基于以下作者的代码：
    // 伤害统计 by ponchain
    // 图表 by Stella
    // 头像下方显示数字 by Truth_Light
    const lang = {
        toggleButtonHide: isZH ? "收起" : "Hide",
        toggleButtonShow: isZH ? "展开" : "Show",
        players: isZH ? "玩家" : "Players",
        dpsTextDPS: isZH ? "DPS" : "DPS",
        dpsTextTotalDamage: isZH ? "总伤害" : "Total Damage",
        totalRuntime: isZH ? "运行时间" : "Runtime",
        totalTeamDPS: isZH ? "团队DPS" : "Total Team DPS",
        totalTeamDamage: isZH ? "团队总伤害" : "Total Team Damage",
        damagePercentage: isZH ? "伤害占比" : "Damage %",
        monstername: isZH ? "怪物" : "Monster",
        encountertimes: isZH ? "遭遇数" : "Encounter",
        hitChance: isZH ? "命中率" : "Hit Chance",
        aura: isZH ? "光环" : "Aura",
    };

    let totalDamage = [];
    let totalDuration = 0;
    let startTime = null;
    let endTime = null;
    let monstersHP = [];
    let players = [];
    let dragging = false;
    let panelExpanded = true;
    let chart = null;
    let monsterCounts = {}; // Object to store monster counts
    let monsterEvasion = {}; // Object to store monster evasion ratings by combat style
    const calculateHitChance = (accuracy, evasion) => {
        const hitChance = (Math.pow(accuracy, 1.4) / (Math.pow(accuracy, 1.4) + Math.pow(evasion, 1.4))) * 100;
        return hitChance;
    };

    const getStatisticsDom = () => {
        if (!document.querySelector(".script_dps_panel")) {
            let panel = document.createElement("div");
            panel.style.position = "fixed";
            panel.style.top = "50px";
            panel.style.left = "50px";
            panel.style.background = "#f0f0f0";
            panel.style.border = "1px solid #ccc";
            panel.style.zIndex = "9999";
            panel.style.cursor = "move";
            panel.style.fontSize = "12px";
            panel.style.padding = "2px";
            panel.style.resize = "both"; // Enable resizing
            panel.style.overflow = "auto"; // Ensure content is scrollable when resized
            panel.style.width = "400px";

            panel.innerHTML = `
                <div id="panelHeader" style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: ${SCRIPT_COLOR_MAIN};">DPS</span>
                    <button id="script_toggleButton">${lang.toggleButtonHide}</button>
                </div>
                <div id="script_panelContent">
                    <canvas id="script_dpsChart" width="300" height="200"></canvas>
                    <div id="script_dpsText"></div>
                    <div id="script_hitChanceTable" style="margin-top: 10px;"></div>
                </div>`;
            panel.className = "script_dps_panel";
            let offsetX, offsetY;

            panel.addEventListener("mousedown", function (e) {
                const rect = panel.getBoundingClientRect();
                const isResizing = e.clientX > rect.right - 10 || e.clientY > rect.bottom - 10;
                if (isResizing || e.target.id === "script_toggleButton") return;
                dragging = true;
                offsetX = e.clientX - panel.offsetLeft;
                offsetY = e.clientY - panel.offsetTop;
            });

            document.addEventListener("mousemove", function (e) {
                if (dragging) {
                    var newX = e.clientX - offsetX;
                    var newY = e.clientY - offsetY;
                    panel.style.left = newX + "px";
                    panel.style.top = newY + "px";
                }
            });

            document.addEventListener("mouseup", function () {
                dragging = false;
            });

            panel.addEventListener("touchstart", function (e) {
                const rect = panel.getBoundingClientRect();
                const isResizing = e.clientX > rect.right - 10 || e.clientY > rect.bottom - 10;
                if (isResizing || e.target.id === "script_toggleButton") return;
                dragging = true;
                let touch = e.touches[0];
                offsetX = touch.clientX - panel.offsetLeft;
                offsetY = touch.clientY - panel.offsetTop;
            });

            document.addEventListener("touchmove", function (e) {
                if (dragging) {
                    let touch = e.touches[0];
                    var newX = touch.clientX - offsetX;
                    var newY = touch.clientY - offsetY;
                    panel.style.left = newX + "px";
                    panel.style.top = newY + "px";
                }
            });

            document.addEventListener("touchend", function () {
                dragging = false;
            });

            document.body.appendChild(panel);

            // Toggle button functionality
            document.getElementById("script_toggleButton").addEventListener("click", function () {
                panelExpanded = !panelExpanded;
                this.textContent = lang.toggleButtonShow;
                const panelContent = document.getElementById("script_panelContent");
                if (panelExpanded) {
                    panelContent.style.display = "block";
                    this.textContent = lang.toggleButtonHide;
                    panel.style.width = "auto";
                    panel.style.height = "auto";
                } else {
                    panelContent.style.display = "none";
                    this.textContent = lang.toggleButtonShow;
                    panel.style.width = "auto";
                    panel.style.height = "auto";
                }
            });

            // Create chart
            // Chart.defaults.color = "black";
            const ctx = document.getElementById("script_dpsChart").getContext("2d");
            const numPlayers = players.length;
            const chartHeight = numPlayers * 35; // 设置每个条目的高度
            ctx.canvas.height = chartHeight;
            chart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: [],
                    datasets: [
                        {
                            data: [],
                            backgroundColor: [
                                "rgba(75, 192, 192, 0.2)",
                                "rgba(54, 162, 235, 0.2)",
                                "rgba(255, 206, 86, 0.2)",
                                "rgba(75, 192, 192, 0.2)",
                                "rgba(153, 102, 255, 0.2)",
                                "rgba(255, 159, 64, 0.2)",
                            ],
                            borderColor: [
                                "rgba(75, 192, 192, 1)",
                                "rgba(54, 162, 235, 1)",
                                "rgba(255, 206, 86, 1)",
                                "rgba(75, 192, 192, 1)",
                                "rgba(153, 102, 255, 1)",
                                "rgba(255, 159, 64, 1)",
                            ],
                            borderWidth: 1,
                            barPercentage: 0.9,
                            categoryPercentage: 1.0,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    indexAxis: "y",
                    scales: {
                        x: {
                            beginAtZero: true,
                            grace: "20%",
                            display: false,
                            grid: {
                                display: false,
                            },
                        },
                        y: {
                            grid: {
                                display: false,
                            },
                        },
                    },
                    layout: {
                        padding: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                        },
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            enabled: false,
                        },
                        datalabels: {
                            anchor: "end",
                            align: "right",
                            color: function (context) {
                                const value = context.dataset.data[context.dataIndex];
                                return value > 0 ? "black" : "transparent";
                            },
                            font: {
                                weight: "bold",
                            },
                            formatter: function (value) {
                                return `${value.toLocaleString()}`;
                            },
                            clip: false,
                            display: true,
                        },
                    },
                },
                plugins: [ChartDataLabels],
            });
        }
        return document.querySelector(".script_dps_panel");
    };

    const updateStatisticsPanel = () => {
        const totalTime = totalDuration + (endTime - startTime) / 1000;
        const dps = totalDamage.map((damage) => (totalTime ? Math.round(damage / totalTime) : 0));
        const totalTeamDamage = totalDamage.reduce((acc, damage) => acc + damage, 0);
        const totalTeamDPS = totalTime ? Math.round(totalTeamDamage / totalTime) : 0;

        // 人物头像下方显示数字
        const playersContainer = document.querySelector(".BattlePanel_combatUnitGrid__2hTAM");
        if (playersContainer) {
            players.forEach((player, index) => {
                const playerElement = playersContainer.children[index];
                if (playerElement) {
                    const statusElement = playerElement.querySelector(".CombatUnit_status__3bH7W");
                    if (statusElement) {
                        let dpsElement = statusElement.querySelector(".dps-info");
                        if (!dpsElement) {
                            dpsElement = document.createElement("div");
                            dpsElement.className = "dps-info";
                            statusElement.appendChild(dpsElement);
                        }
                        dpsElement.textContent = `DPS: ${dps[index].toLocaleString()} (${numberFormatter(totalDamage[index])})`;
                    }
                }
            });
        }

        // 显示图表
        if (settingsMap.showDamageGraph.isTrue && !dragging) {
            const panel = getStatisticsDom();
            chart.data.labels = players.map((player) => player?.name);
            chart.data.datasets[0].data = dps;
            chart.update();

            // Update text information
            const days = Math.floor(totalTime / (24 * 3600));
            const hours = Math.floor((totalTime % (24 * 3600)) / 3600);
            const minutes = Math.floor((totalTime % 3600) / 60);
            const seconds = Math.floor(totalTime % 60);
            const formattedTime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            const dpsText = document.getElementById("script_dpsText");
            const playerRows = players
                .map((player, index) => {
                    const dpsFormatted = dps[index].toLocaleString();
                    const totalDamageFormatted = totalDamage[index].toLocaleString();
                    const damagePercentage = totalTeamDamage ? ((totalDamage[index] / totalTeamDamage) * 100).toFixed(2) : 0;

                    // Get auraskill for the current player
                    let auraskill = "N/A";
                    if (player.combatAbilities && Array.isArray(player.combatAbilities)) {
                        const firstAbility = player.combatAbilities[0];
                        if (firstAbility && firstAbility.abilityHrid) {
                            auraskill = firstAbility.abilityHrid.split("/").pop().replace(/_/g, " ");
                            const validSkills = [
                                "revive",
                                "insanity",
                                "invincible",
                                "fierce aura",
                                "aqua aura",
                                "sylvan aura",
                                "flame aura",
                                "speed aura",
                                "critical aura",
                            ];
                            if (!validSkills.includes(auraskill)) {
                                auraskill = "N/A";
                            }
                        }
                    }

                    return `
                    <tr>
                        <td>${player.name}</td>
                        <td>${auraskill}</td>
                        <td>${dpsFormatted}</td>
                        <td>${totalDamageFormatted}</td>
                        <td>${damagePercentage}%</td>
                    </tr>`;
                })
                .join("");

            // Display monster counts
            const monsterRows = Object.entries(monsterCounts)
                .map(([name, count]) => {
                    return `<tr><td>${name} (${count})</td></tr>`;
                })
                .join("");

            dpsText.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="text-align: left;">
                    <th>${lang.players}</th>
                    <th>${lang.aura}</th>
                    <th>${lang.dpsTextDPS}</th>
                    <th>${lang.dpsTextTotalDamage}</th>
                    <th>${lang.damagePercentage}</th>
                </tr>
            </thead>
            <tbody>
                ${playerRows}
            </tbody>
            <tbody>
                <tr style="border-top: 2px solid black; font-weight: bold; text-align: left;">
                    <td>${formattedTime}</td>
                    <td></td>
                    <td>${totalTeamDPS.toLocaleString()}</td>
                    <td>${totalTeamDamage.toLocaleString()}</td>
                    <td>100%</td>
                </tr>
            </tbody>
        </table>`;

            // Update hit chance table
            const hitChanceTable = document.getElementById("script_hitChanceTable");
            const hitChanceRows = players
                .map((player) => {
                    const playerName = player.name;
                    const playerHitChances = Object.entries(monsterCounts)
                        .map(([monsterName, count]) => {
                            const combatStyle = player.combatDetails.combatStats.combatStyleHrids[0].split("/").pop(); // Assuming only one combat style for simplicity
                            const evasionRating = monsterEvasion[monsterName][`${player.name}-${combatStyle}`];
                            const accuracy = player.combatDetails[`${combatStyle}AccuracyRating`];
                            const hitChance = calculateHitChance(accuracy, evasionRating);
                            return `<td>${hitChance.toFixed(0)}%</td>`;
                        })
                        .join("");
                    return `<tr><td>${playerName}</td>${playerHitChances}</tr>`;
                })
                .join("");

            hitChanceTable.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="font-size: smaller; white-space: normal; text-align: left;">${lang.hitChance}</th>
                    ${Object.entries(monsterCounts)
                        .map(
                            ([monsterName, count]) =>
                                `<th style="font-size: smaller; white-space: normal; text-align: left;">${monsterName} (${count})</th>`
                        )
                        .join("")}
                </tr>
            </thead>
            <tbody>
                ${hitChanceRows}
            </tbody>
        </table>`;
        }
    };
})();
