// ==UserScript==
// @name         MWITools
// @namespace    http://tampermonkey.net/
// @version      16.8
// @description  Tools for MilkyWayIdle. Shows total action time. Shows market prices. Shows action number quick inputs. Shows how many actions are needed to reach certain skill level. Shows skill exp percentages. Shows total networth. Shows combat summary. Shows combat maps index. Shows item level on item icons. Shows how many ability books are needed to reach certain level. Shows market equipment filters.
// @author       bot7420
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @match        https://amvoidguy.github.io/MWICombatSimulatorTest/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      raw.githubusercontent.com
// @require      https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.2/math.js
// @require      https://cdn.jsdelivr.net/npm/chart.js@3.7.0/dist/chart.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0/dist/chartjs-plugin-datalabels.min.js
// ==/UserScript==

(() => {
    "use strict";
    const userLanguage = navigator.language || navigator.userLanguage;
    const isZH = userLanguage.startsWith("zh");
    const sampleNumber = 1111.1;
    const sampleLocaleNumber = new Intl.NumberFormat().format(sampleNumber);
    const THOUSAND_SEPERATOR = sampleLocaleNumber.replaceAll("1", "").at(0);
    const DECIMAL_SEPERATOR = sampleLocaleNumber.replaceAll("1", "").at(1);

    /* 自定义插件字体颜色 */
    /* 找颜色自行网上搜索"CSS颜色" */
    /* 可以是颜色名称，比如"red"；也可以是颜色Hex，比如"#ED694D" */
    // Customization
    let SCRIPT_COLOR_MAIN = "green"; // 脚本主要字体颜色
    let SCRIPT_COLOR_TOOLTIP = "darkgreen"; // 物品悬浮窗的字体颜色
    const SCRIPT_COLOR_ALERT = "red"; // 警告字体颜色

    if (document.URL.includes("amvoidguy.github.io")) {
        // Customization
        // Features for https://amvoidguy.github.io/MWICombatSimulatorTest/. Remove the following two lines of code to disable.
        addImportButtonForAmvoidguy();
        observeResultsForAmvoidguy();
        return;
    }

    const MARKET_API_URL = "https://raw.githubusercontent.com/holychikenz/MWIApi/main/medianmarket.json";

    let settingsMap = {
        useOrangeAsMainColor: {
            id: "useOrangeAsMainColor",
            desc: isZH ? "使用橙色字体" : "Use orange as the main color for the script.",
            isTrue: true,
        },
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
        actionPanel_totalTime_quickInputs: {
            id: "actionPanel_totalTime_quickInputs",
            desc: isZH ? "动作面板显示：快速输入次数 [依赖上一项]" : "Action panel: Quick input numbers. [Depends on the previous selection]",
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
                ? "右上角显示：流动资产(+2及以上物品按强化模拟成本计算)"
                : "Top right: Current assets (Items with at least 2 enhancement levels are valued by enchancing simulator).",
            isTrue: true,
        },
        invWorth: {
            id: "invWorth",
            desc: isZH
                ? "仓库搜索栏下方显示：仓库和战力总结 [依赖上一项]"
                : "Below inventory search bar: Inventory and character summery. [Depends on the previous selection]",
            isTrue: true,
        },
        invSort: {
            id: "invSort",
            desc: isZH ? "仓库显示：仓库物品排序 [依赖上一项]" : "Inventory: Sort inventory items. [Depends on the previous selection]",
            isTrue: true,
        },
        profileBuildScore: {
            id: "profileBuildScore",
            desc: isZH ? "人物面板显示：战力分" : "Profile panel: Build score.",
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
            isTrue: false,
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

    if (settingsMap.useOrangeAsMainColor.isTrue && SCRIPT_COLOR_MAIN === "green") {
        SCRIPT_COLOR_MAIN = "orange";
    }
    if (settingsMap.useOrangeAsMainColor.isTrue && SCRIPT_COLOR_TOOLTIP === "darkgreen") {
        SCRIPT_COLOR_TOOLTIP = "#804600";
    }

    const MARKET_JSON_LOCAL_BACKUP = `{"time":1734029101,"market":{"Amber":{"ask":21000,"bid":20500},"Amethyst":{"ask":31000,"bid":29500},"Apple":{"ask":12,"bid":8},"Apple Gummy":{"ask":13,"bid":10},"Apple Yogurt":{"ask":350,"bid":150},"Aqua Arrow":{"ask":31000,"bid":28500},"Aqua Essence":{"ask":24,"bid":18},"Arabica Coffee Bean":{"ask":190,"bid":170},"Arcane Bow":{"ask":700000,"bid":110000},"Arcane Crossbow":{"ask":620000,"bid":480000},"Arcane Fire Staff":{"ask":480000,"bid":180000},"Arcane Log":{"ask":470,"bid":410},"Arcane Lumber":{"ask":1950,"bid":1750},"Arcane Nature Staff":{"ask":350000,"bid":170000},"Arcane Water Staff":{"ask":540000,"bid":84000},"Artisan Tea":{"ask":2425,"bid":2200},"Attack Coffee":{"ask":1500,"bid":400},"Azure Boots":{"ask":165000,"bid":8200},"Azure Brush":{"ask":36000,"bid":7000},"Azure Buckler":{"ask":37750,"bid":-1},"Azure Bulwark":{"ask":35000,"bid":-1},"Azure Cheese":{"ask":740,"bid":680},"Azure Chisel":{"ask":145000,"bid":-1},"Azure Enhancer":{"ask":62000,"bid":20000},"Azure Gauntlets":{"ask":-1,"bid":10500},"Azure Hammer":{"ask":82000,"bid":7000},"Azure Hatchet":{"ask":96000,"bid":2050},"Azure Helmet":{"ask":62000,"bid":12000},"Azure Mace":{"ask":84000,"bid":30000},"Azure Milk":{"ask":190,"bid":160},"Azure Needle":{"ask":155000,"bid":2050},"Azure Plate Body":{"ask":60000,"bid":24500},"Azure Plate Legs":{"ask":275000,"bid":2400},"Azure Pot":{"ask":140000,"bid":2100},"Azure Shears":{"ask":290000,"bid":2050},"Azure Spatula":{"ask":52000,"bid":2100},"Azure Spear":{"ask":82000,"bid":42000},"Azure Sword":{"ask":84000,"bid":3500},"Bamboo Boots":{"ask":26500,"bid":8000},"Bamboo Branch":{"ask":68,"bid":30},"Bamboo Fabric":{"ask":215,"bid":200},"Bamboo Gloves":{"ask":34000,"bid":10500},"Bamboo Hat":{"ask":42000,"bid":12000},"Bamboo Robe Bottoms":{"ask":45000,"bid":22000},"Bamboo Robe Top":{"ask":64000,"bid":5200},"Bear Essence":{"ask":115,"bid":100},"Beast Boots":{"ask":260000,"bid":8000},"Beast Bracers":{"ask":100000,"bid":10500},"Beast Chaps":{"ask":400000,"bid":15000},"Beast Hide":{"ask":24,"bid":20},"Beast Hood":{"ask":160000,"bid":12000},"Beast Leather":{"ask":620,"bid":580},"Beast Tunic":{"ask":300000,"bid":18000},"Berserk":{"ask":247500,"bid":215000},"Birch Bow":{"ask":28500,"bid":1050},"Birch Crossbow":{"ask":23500,"bid":1550},"Birch Fire Staff":{"ask":34000,"bid":800},"Birch Log":{"ask":49,"bid":38},"Birch Lumber":{"ask":560,"bid":270},"Birch Nature Staff":{"ask":34000,"bid":840},"Birch Water Staff":{"ask":34000,"bid":760},"Black Bear Fluff":{"ask":70000,"bid":56000},"Black Bear Shoes":{"ask":400000,"bid":100000},"Black Tea Leaf":{"ask":18,"bid":16},"Blackberry":{"ask":84,"bid":69},"Blackberry Cake":{"ask":520,"bid":285},"Blackberry Donut":{"ask":680,"bid":295},"Blessed Tea":{"ask":2550,"bid":1900},"Blueberry":{"ask":43,"bid":39.5},"Blueberry Cake":{"ask":680,"bid":295},"Blueberry Donut":{"ask":255,"bid":125},"Brewing Tea":{"ask":475,"bid":20},"Burble Brush":{"ask":100000,"bid":5200},"Burble Buckler":{"ask":420000,"bid":7600},"Burble Bulwark":{"ask":-1,"bid":18000},"Burble Chisel":{"ask":270000,"bid":25000},"Burble Enhancer":{"ask":450000,"bid":40000},"Burble Gauntlets":{"ask":-1,"bid":5800},"Burble Hatchet":{"ask":80000,"bid":40000},"Burble Helmet":{"ask":185000,"bid":7000},"Burble Mace":{"ask":-1,"bid":54000},"Burble Needle":{"ask":320000,"bid":26500},"Burble Plate Body":{"ask":170000,"bid":6400},"Burble Pot":{"ask":300000,"bid":27000},"Burble Shears":{"ask":-1,"bid":40000},"Burble Spatula":{"ask":115000,"bid":50000},"Burble Sword":{"ask":115000,"bid":6600},"Burble Tea Leaf":{"ask":34,"bid":25},"Cedar Bow":{"ask":-1,"bid":3500},"Cedar Fire Staff":{"ask":88000,"bid":-1},"Cedar Log":{"ask":150,"bid":122.5},"Cedar Lumber":{"ask":780,"bid":660},"Cedar Water Staff":{"ask":88000,"bid":2600},"Centaur Boots":{"ask":1000000,"bid":-1},"Centaur Hoof":{"ask":135000,"bid":125000},"Cheese Boots":{"ask":4200,"bid":120},"Cheese Brush":{"ask":4200,"bid":-1},"Cheese Buckler":{"ask":1200000,"bid":-1},"Cheese Chisel":{"ask":5600,"bid":120},"Cheese Enhancer":{"ask":5600,"bid":120},"Cheese Gauntlets":{"ask":28500,"bid":64},"Cheese Hammer":{"ask":5800,"bid":120},"Cheese Helmet":{"ask":160000,"bid":-1},"Cheese Mace":{"ask":10500,"bid":145},"Cheese Plate Body":{"ask":16500,"bid":145},"Cheese Plate Legs":{"ask":9000,"bid":115},"Cheese Pot":{"ask":6000,"bid":-1},"Cheese Spatula":{"ask":5800,"bid":120},"Cheese Spear":{"ask":15500,"bid":700},"Cheese Sword":{"ask":5000,"bid":155},"Cleave":{"ask":76000,"bid":43000},"Cocoon":{"ask":225,"bid":185},"Coin":{"ask":-1,"bid":-1},"Cotton":{"ask":81,"bid":42},"Cotton Boots":{"ask":1950,"bid":-1},"Cotton Fabric":{"ask":360,"bid":245},"Cotton Hat":{"ask":4900,"bid":-1},"Cotton Robe Bottoms":{"ask":5400,"bid":-1},"Cotton Robe Top":{"ask":-1,"bid":-1},"Crab Pincer":{"ask":8200,"bid":6800},"Crafting Tea":{"ask":1150,"bid":185},"Crimson Boots":{"ask":-1,"bid":6800},"Crimson Buckler":{"ask":-1,"bid":72000},"Crimson Bulwark":{"ask":120000,"bid":-1},"Crimson Cheese":{"ask":900,"bid":830},"Crimson Enhancer":{"ask":175000,"bid":52000},"Crimson Gauntlets":{"ask":190000,"bid":-1},"Crimson Hammer":{"ask":400000,"bid":54000},"Crimson Helmet":{"ask":150000,"bid":90000},"Crimson Mace":{"ask":160000,"bid":80000},"Crimson Milk":{"ask":290,"bid":275},"Crimson Plate Body":{"ask":250000,"bid":100000},"Crimson Plate Legs":{"ask":-1,"bid":80000},"Crimson Pot":{"ask":175000,"bid":-1},"Crimson Spatula":{"ask":140000,"bid":50000},"Crimson Spear":{"ask":-1,"bid":110000},"Crimson Sword":{"ask":680000,"bid":14000},"Crushed Amber":{"ask":1350,"bid":960},"Crushed Amethyst":{"ask":2400,"bid":1850},"Crushed Garnet":{"ask":1850,"bid":1550},"Crushed Moonstone":{"ask":3250,"bid":2650},"Crushed Pearl":{"ask":1650,"bid":760},"Cupcake":{"ask":400,"bid":225},"Donut":{"ask":470,"bid":105},"Dragon Fruit":{"ask":200,"bid":170},"Dragon Fruit Gummy":{"ask":430,"bid":360},"Earrings Of Armor":{"ask":8600000,"bid":4600000},"Earrings Of Gathering":{"ask":16000000,"bid":4600000},"Earrings Of Regeneration":{"ask":9200000,"bid":5900000},"Earrings Of Resistance":{"ask":-1,"bid":4550000},"Efficiency Tea":{"ask":1150,"bid":920},"Elemental Affinity":{"ask":185000,"bid":160000},"Emp Tea Leaf":{"ask":520,"bid":460},"Enhancing Tea":{"ask":1100,"bid":490},"Excelsa Coffee Bean":{"ask":520,"bid":475},"Eyessence":{"ask":94,"bid":82},"Fieriosa Coffee Bean":{"ask":580,"bid":480},"Fireball":{"ask":11000,"bid":10000},"Flame Arrow":{"ask":32000,"bid":25000},"Flame Blast":{"ask":90000,"bid":88000},"Flaming Cloth":{"ask":56000,"bid":42000},"Flaming Robe Top":{"ask":260000,"bid":180000},"Flax":{"ask":100,"bid":66},"Foraging Tea":{"ask":660,"bid":195},"Garnet":{"ask":30500,"bid":29500},"Gathering Tea":{"ask":700,"bid":470},"Giant Pouch":{"ask":6000000,"bid":5200000},"Ginkgo Bow":{"ask":540000,"bid":30000},"Ginkgo Crossbow":{"ask":200000,"bid":95000},"Ginkgo Log":{"ask":182.5,"bid":105},"Ginkgo Lumber":{"ask":920,"bid":760},"Ginkgo Nature Staff":{"ask":86000,"bid":15000},"Gobo Boomstick":{"ask":80000,"bid":71000},"Gobo Boots":{"ask":60000,"bid":8000},"Gobo Bracers":{"ask":86000,"bid":-1},"Gobo Essence":{"ask":98,"bid":88},"Gobo Hide":{"ask":13.5,"bid":12},"Gobo Hood":{"ask":93000,"bid":8200},"Gobo Shooter":{"ask":82000,"bid":70000},"Gobo Slasher":{"ask":84000,"bid":72000},"Gobo Smasher":{"ask":82000,"bid":72000},"Gobo Tunic":{"ask":90000,"bid":12000},"Goggles":{"ask":202500,"bid":125000},"Golem Essence":{"ask":260,"bid":240},"Granite Bludgeon":{"ask":18500000,"bid":-1},"Green Tea Leaf":{"ask":20,"bid":15},"Grizzly Bear Fluff":{"ask":68000,"bid":60000},"Gummy":{"ask":140,"bid":-1},"Heal":{"ask":76000,"bid":58000},"Holy Boots":{"ask":460000,"bid":-1},"Holy Buckler":{"ask":600000,"bid":370000},"Holy Bulwark":{"ask":680000,"bid":310000},"Holy Cheese":{"ask":1750,"bid":1650},"Holy Enhancer":{"ask":460000,"bid":-1},"Holy Gauntlets":{"ask":470000,"bid":205000},"Holy Hammer":{"ask":440000,"bid":400000},"Holy Helmet":{"ask":280000,"bid":-1},"Holy Mace":{"ask":580000,"bid":510000},"Holy Milk":{"ask":560,"bid":540},"Holy Plate Body":{"ask":1000000,"bid":310000},"Holy Plate Legs":{"ask":700000,"bid":400000},"Holy Pot":{"ask":520000,"bid":295000},"Holy Spatula":{"ask":400000,"bid":-1},"Holy Spear":{"ask":600000,"bid":400000},"Holy Sword":{"ask":460000,"bid":400000},"Icy Cloth":{"ask":52000,"bid":44000},"Icy Robe Bottoms":{"ask":200000,"bid":120000},"Icy Robe Top":{"ask":540000,"bid":185000},"Jade":{"ask":31000,"bid":29500},"Jungle Essence":{"ask":70,"bid":46},"Large Artisan's Crate":{"ask":-1,"bid":-1},"Large Pouch":{"ask":500000,"bid":360000},"Large Treasure Chest":{"ask":-1,"bid":-1},"Liberica Coffee Bean":{"ask":395,"bid":370},"Linen Boots":{"ask":33000,"bid":7000},"Linen Gloves":{"ask":36000,"bid":2800},"Linen Hat":{"ask":78000,"bid":5600},"Linen Robe Bottoms":{"ask":63000,"bid":10000},"Living Granite":{"ask":520000,"bid":480000},"Log":{"ask":72,"bid":42},"Lucky Coffee":{"ask":1750,"bid":1350},"Magic Coffee":{"ask":700,"bid":660},"Magnet":{"ask":320000,"bid":205000},"Magnifying Glass":{"ask":460000,"bid":425000},"Maim":{"ask":230000,"bid":125000},"Marsberry":{"ask":155,"bid":135},"Marsberry Donut":{"ask":790,"bid":700},"Medium Artisan's Crate":{"ask":-1,"bid":-1},"Medium Meteorite Cache":{"ask":-1,"bid":-1},"Medium Treasure Chest":{"ask":-1,"bid":-1},"Milk":{"ask":42,"bid":35},"Milking Tea":{"ask":500,"bid":205},"Minor Heal":{"ask":10500,"bid":1600},"Mooberry":{"ask":150,"bid":110},"Mooberry Cake":{"ask":930,"bid":800},"Mooberry Donut":{"ask":620,"bid":500},"Moonstone":{"ask":46000,"bid":45000},"Necklace Of Efficiency":{"ask":17000000,"bid":7800000},"Necklace Of Wisdom":{"ask":30000000,"bid":8000000},"Orange Gummy":{"ask":32,"bid":22},"Orange Yogurt":{"ask":600,"bid":300},"Panda Gloves":{"ask":430000,"bid":205000},"Peach":{"ask":62,"bid":44},"Peach Gummy":{"ask":282.5,"bid":220},"Pearl":{"ask":14000,"bid":13000},"Pierce":{"ask":-1,"bid":-1},"Pincer Gloves":{"ask":33000,"bid":13000},"Plum":{"ask":130,"bid":110},"Plum Yogurt":{"ask":720,"bid":410},"Poke":{"ask":4300,"bid":2050},"Power Coffee":{"ask":990,"bid":680},"Precision":{"ask":54000,"bid":52000},"Purpleheart Bow":{"ask":105000,"bid":31000},"Purpleheart Crossbow":{"ask":98000,"bid":45000},"Purpleheart Fire Staff":{"ask":880000,"bid":15000},"Purpleheart Lumber":{"ask":780,"bid":700},"Purpleheart Nature Staff":{"ask":100000,"bid":50000},"Purpleheart Water Staff":{"ask":-1,"bid":-1},"Quick Shot":{"ask":4100,"bid":2050},"Radiant Fabric":{"ask":2625,"bid":2475},"Radiant Fiber":{"ask":580,"bid":540},"Radiant Gloves":{"ask":185000,"bid":125000},"Radiant Robe Bottoms":{"ask":430000,"bid":360000},"Radiant Robe Top":{"ask":600000,"bid":330000},"Rain Of Arrows":{"ask":150000,"bid":145000},"Rainbow Brush":{"ask":500000,"bid":-1},"Rainbow Buckler":{"ask":-1,"bid":62000},"Rainbow Bulwark":{"ask":400000,"bid":105000},"Rainbow Chisel":{"ask":240000,"bid":60000},"Rainbow Enhancer":{"ask":222500,"bid":31000},"Rainbow Gauntlets":{"ask":370000,"bid":132500},"Rainbow Hatchet":{"ask":245000,"bid":-1},"Rainbow Helmet":{"ask":290000,"bid":78000},"Rainbow Mace":{"ask":380000,"bid":220000},"Rainbow Needle":{"ask":220000,"bid":58000},"Rainbow Plate Body":{"ask":290000,"bid":30000},"Rainbow Plate Legs":{"ask":275000,"bid":155000},"Rainbow Shears":{"ask":310000,"bid":200000},"Rainbow Spatula":{"ask":235000,"bid":86000},"Rainbow Spear":{"ask":500000,"bid":-1},"Ranged Coffee":{"ask":770,"bid":640},"Ranger Necklace":{"ask":-1,"bid":7600000},"Red Tea Leaf":{"ask":54,"bid":50},"Redwood Crossbow":{"ask":235000,"bid":120000},"Redwood Fire Staff":{"ask":200000,"bid":100000},"Redwood Log":{"ask":46,"bid":36},"Redwood Nature Staff":{"ask":300000,"bid":100000},"Redwood Water Staff":{"ask":200000,"bid":100000},"Reptile Boots":{"ask":33000,"bid":9600},"Reptile Chaps":{"ask":29000,"bid":2000},"Reptile Hide":{"ask":150,"bid":33},"Reptile Hood":{"ask":20500,"bid":760},"Reptile Tunic":{"ask":27000,"bid":1250},"Ring Of Armor":{"ask":8600000,"bid":4500000},"Ring Of Gathering":{"ask":20000000,"bid":4500000},"Ring Of Regeneration":{"ask":9600000,"bid":4500000},"Ring Of Resistance":{"ask":8400000,"bid":4500000},"Robusta Coffee Bean":{"ask":295,"bid":205},"Rough Bracers":{"ask":-1,"bid":-1},"Rough Chaps":{"ask":14500,"bid":115},"Rough Hide":{"ask":115,"bid":76},"Rough Leather":{"ask":390,"bid":370},"Rough Tunic":{"ask":10000,"bid":-1},"Scratch":{"ask":5000,"bid":2200},"Silk Boots":{"ask":80000,"bid":20000},"Silk Fabric":{"ask":1525,"bid":1300},"Silk Gloves":{"ask":90000,"bid":30000},"Silk Robe Bottoms":{"ask":260000,"bid":15000},"Silk Robe Top":{"ask":200000,"bid":18000},"Smack":{"ask":4050,"bid":2150},"Small Meteorite Cache":{"ask":-1,"bid":-1},"Small Pouch":{"ask":37500,"bid":-1},"Snail Shell":{"ask":6600,"bid":6000},"Snail Shell Helmet":{"ask":30000,"bid":13000},"Snake Fang":{"ask":3100,"bid":2150},"Sorcerer Boots":{"ask":460000,"bid":165000},"Sorcerer Essence":{"ask":122.5,"bid":110},"Sorcerer's Sole":{"ask":75000,"bid":72000},"Spaceberry Cake":{"ask":1650,"bid":1350},"Spaceberry Donut":{"ask":980,"bid":880},"Spacia Coffee Bean":{"ask":860,"bid":800},"Stalactite Shard":{"ask":495000,"bid":470000},"Stalactite Spear":{"ask":-1,"bid":8000000},"Stamina Coffee":{"ask":540,"bid":250},"Star Fruit":{"ask":410,"bid":380},"Star Fruit Gummy":{"ask":880,"bid":860},"Star Fruit Yogurt":{"ask":1400,"bid":1350},"Strawberry Cake":{"ask":740,"bid":46},"Strawberry Donut":{"ask":285,"bid":40},"Stunning Blow":{"ask":267500,"bid":185000},"Super Attack Coffee":{"ask":3700,"bid":2100},"Super Brewing Tea":{"ask":3400,"bid":-1},"Super Cheesesmithing Tea":{"ask":4350,"bid":2000},"Super Crafting Tea":{"ask":5000,"bid":3800},"Super Defense Coffee":{"ask":3800,"bid":2400},"Super Enhancing Tea":{"ask":4100,"bid":3400},"Super Foraging Tea":{"ask":3900,"bid":1450},"Super Magic Coffee":{"ask":4200,"bid":4100},"Super Milking Tea":{"ask":6400,"bid":-1},"Super Power Coffee":{"ask":4600,"bid":4200},"Super Stamina Coffee":{"ask":2800,"bid":2400},"Super Tailoring Tea":{"ask":7200,"bid":-1},"Super Woodcutting Tea":{"ask":3900,"bid":2250},"Sweep":{"ask":98000,"bid":78000},"Swiftness Coffee":{"ask":2400,"bid":1700},"Tailoring Tea":{"ask":640,"bid":400},"Tome Of The Elements":{"ask":1000000,"bid":760000},"Toughness":{"ask":56000,"bid":52000},"Toxic Pollen":{"ask":105000,"bid":80000},"Turtle Shell Body":{"ask":44000,"bid":-1},"Turtle Shell Legs":{"ask":170000,"bid":-1},"Twilight Essence":{"ask":275,"bid":240},"Umbral Bracers":{"ask":165000,"bid":54000},"Umbral Chaps":{"ask":350000,"bid":39000},"Umbral Hide":{"ask":260,"bid":210},"Umbral Leather":{"ask":2075,"bid":1900},"Umbral Tunic":{"ask":350000,"bid":45000},"Vampire Fang":{"ask":500000,"bid":470000},"Vampirism":{"ask":48000,"bid":22500},"Verdant Boots":{"ask":24500,"bid":-1},"Verdant Brush":{"ask":-1,"bid":1150},"Verdant Bulwark":{"ask":28750,"bid":-1},"Verdant Cheese":{"ask":520,"bid":440},"Verdant Chisel":{"ask":560000,"bid":12000},"Verdant Gauntlets":{"ask":98000,"bid":1600},"Verdant Hammer":{"ask":33000,"bid":-1},"Verdant Hatchet":{"ask":140000,"bid":600},"Verdant Mace":{"ask":38000,"bid":11500},"Verdant Milk":{"ask":120,"bid":98},"Verdant Needle":{"ask":47000,"bid":12000},"Verdant Plate Legs":{"ask":98000,"bid":2600},"Verdant Pot":{"ask":90000,"bid":600},"Verdant Shears":{"ask":-1,"bid":-1},"Verdant Spear":{"ask":38000,"bid":-1},"Verdant Sword":{"ask":38000,"bid":-1},"Vision Helmet":{"ask":182500,"bid":56000},"Water Strike":{"ask":8700,"bid":8200},"Werewolf Claw":{"ask":580000,"bid":470000},"Werewolf Slasher":{"ask":12000000,"bid":6600000},"Wisdom Coffee":{"ask":1350,"bid":1250},"Wisdom Tea":{"ask":890,"bid":820},"Wizard Necklace":{"ask":15500000,"bid":7600000},"Wooden Bow":{"ask":19500,"bid":195},"Wooden Crossbow":{"ask":9100,"bid":145},"Wooden Fire Staff":{"ask":11500,"bid":145},"Wooden Water Staff":{"ask":2450,"bid":155},"Yogurt":{"ask":1550,"bid":200},"Burble Boots":{"ask":96000,"bid":35000},"Burble Cheese":{"ask":1200,"bid":900},"Burble Hammer":{"ask":350000,"bid":-1},"Burble Milk":{"ask":270,"bid":207.5},"Cedar Nature Staff":{"ask":88000,"bid":-1},"Cheese":{"ask":240,"bid":195},"Cheese Bulwark":{"ask":-1,"bid":-1},"Cheese Hatchet":{"ask":5800,"bid":120},"Cheese Needle":{"ask":6000,"bid":2950},"Cheese Shears":{"ask":3600,"bid":-1},"Cheesesmithing Tea":{"ask":840,"bid":400},"Cooking Tea":{"ask":430,"bid":26},"Cotton Gloves":{"ask":2650,"bid":370},"Cowbell":{"ask":-1,"bid":-1},"Crimson Brush":{"ask":109999.5,"bid":15500},"Crimson Chisel":{"ask":440000,"bid":30000},"Crimson Hatchet":{"ask":190000,"bid":45000},"Crimson Shears":{"ask":165000,"bid":-1},"Critical Coffee":{"ask":3100,"bid":2350},"Crushed Jade":{"ask":2250,"bid":1750},"Defense Coffee":{"ask":680,"bid":370},"Dragon Fruit Yogurt":{"ask":980,"bid":920},"Flaming Robe Bottoms":{"ask":280000,"bid":120000},"Frenzy":{"ask":175000,"bid":170000},"Gobo Leather":{"ask":540,"bid":370},"Holy Chisel":{"ask":460000,"bid":400000},"Holy Hatchet":{"ask":480000,"bid":410000},"Holy Needle":{"ask":590000,"bid":400000},"Holy Shears":{"ask":560000,"bid":410000},"Ice Spear":{"ask":29500,"bid":27250},"Intelligence Coffee":{"ask":580,"bid":410},"Linen Fabric":{"ask":340,"bid":285},"Linen Robe Top":{"ask":72000,"bid":10000},"Lumber":{"ask":370,"bid":105},"Mirror Of Protection":{"ask":9200000,"bid":8500000},"Moolong Tea Leaf":{"ask":33,"bid":32},"Orange":{"ask":13,"bid":7},"Panda Fluff":{"ask":74000,"bid":54000},"Peach Yogurt":{"ask":720,"bid":680},"Plum Gummy":{"ask":105,"bid":70},"Processing Tea":{"ask":2150,"bid":1850},"Purpleheart Log":{"ask":160,"bid":120},"Radiant Boots":{"ask":220000,"bid":125000},"Radiant Hat":{"ask":380000,"bid":295000},"Rainbow Boots":{"ask":207500,"bid":14500},"Rainbow Cheese":{"ask":1250,"bid":1125},"Rainbow Hammer":{"ask":200000,"bid":50000},"Rainbow Milk":{"ask":310,"bid":290},"Rainbow Pot":{"ask":250000,"bid":70000},"Rainbow Sword":{"ask":430000,"bid":230000},"Redwood Bow":{"ask":-1,"bid":120000},"Redwood Lumber":{"ask":560,"bid":480},"Reptile Bracers":{"ask":42000,"bid":-1},"Reptile Leather":{"ask":480,"bid":370},"Ring Of Rare Find":{"ask":-1,"bid":4500000},"Rough Boots":{"ask":1500,"bid":-1},"Rough Hood":{"ask":10000,"bid":-1},"Shard Of Protection":{"ask":50000,"bid":49000},"Silk Hat":{"ask":130000,"bid":11000},"Small Artisan's Crate":{"ask":-1,"bid":-1},"Small Treasure Chest":{"ask":-1,"bid":-1},"Snake Fang Dirk":{"ask":13000,"bid":5200},"Spaceberry":{"ask":185,"bid":170},"Spike Shell":{"ask":68000,"bid":25000},"Star Fragment":{"ask":14000,"bid":13000},"Strawberry":{"ask":100,"bid":82},"Super Cooking Tea":{"ask":7400,"bid":1650},"Super Intelligence Coffee":{"ask":2850,"bid":2000},"Super Ranged Coffee":{"ask":4200,"bid":4100},"Swamp Essence":{"ask":42,"bid":36},"Tome Of Healing":{"ask":105000,"bid":86000},"Turtle Shell":{"ask":10000,"bid":8200},"Umbral Boots":{"ask":165000,"bid":54000},"Umbral Hood":{"ask":295000,"bid":220000},"Vampire Fang Dirk":{"ask":10000000,"bid":5600000},"Verdant Buckler":{"ask":-1,"bid":-1},"Verdant Enhancer":{"ask":88000,"bid":15000},"Verdant Helmet":{"ask":98000,"bid":1600},"Verdant Spatula":{"ask":145000,"bid":-1},"Vision Shield":{"ask":600000,"bid":150000},"Wheat":{"ask":33.5,"bid":30.5},"Woodcutting Tea":{"ask":780,"bid":360},"Wooden Nature Staff":{"ask":170000,"bid":180},"Cedar Crossbow":{"ask":48500,"bid":25500},"Earrings Of Rare Find":{"ask":-1,"bid":4600000},"Egg":{"ask":38,"bid":31.5},"Entangle":{"ask":12000,"bid":11500},"Fighter Necklace":{"ask":16000000,"bid":7600000},"Gator Vest":{"ask":28500,"bid":16000},"Ginkgo Fire Staff":{"ask":200000,"bid":20000},"Gobo Chaps":{"ask":78000,"bid":31000},"Gobo Stabber":{"ask":89000,"bid":72000},"Gourmet Tea":{"ask":620,"bid":520},"Grizzly Bear Shoes":{"ask":460000,"bid":280000},"Holy Brush":{"ask":520000,"bid":400000},"Large Meteorite Cache":{"ask":-1,"bid":-1},"Magnetic Gloves":{"ask":4000000,"bid":1000000},"Marsberry Cake":{"ask":1150,"bid":980},"Medium Pouch":{"ask":100000,"bid":-1},"Polar Bear Fluff":{"ask":98000,"bid":74000},"Verdant Plate Body":{"ask":58000,"bid":660},"Ginkgo Water Staff":{"ask":190000,"bid":15000},"Polar Bear Shoes":{"ask":760000,"bid":450000},"Sugar":{"ask":9,"bid":8},"Crimson Needle":{"ask":430000,"bid":37000},"Burble Plate Legs":{"ask":92000,"bid":6400},"Burble Spear":{"ask":190000,"bid":52000},"Arcane Shield":{"ask":217500,"bid":120000},"Birch Shield":{"ask":62000,"bid":500},"Cedar Shield":{"ask":100000,"bid":4000},"Ginkgo Shield":{"ask":580000,"bid":-1},"Purpleheart Shield":{"ask":200000,"bid":30000},"Redwood Shield":{"ask":200000,"bid":52000},"Sighted Bracers":{"ask":700000,"bid":-1},"Spiked Bulwark":{"ask":8600000,"bid":-1},"Wooden Shield":{"ask":2450,"bid":-1},"Advanced Task Ring":{"ask":-1,"bid":-1},"Basic Task Ring":{"ask":-1,"bid":-1},"Expert Task Ring":{"ask":-1,"bid":-1},"Purple's Gift":{"ask":-1,"bid":-1},"Task Crystal":{"ask":-1,"bid":-1},"Task Token":{"ask":-1,"bid":-1},"Abyssal Essence":{"ask":252.5,"bid":240},"Channeling Coffee":{"ask":2575,"bid":2200},"Chrono Gloves":{"ask":7200000,"bid":-1},"Chrono Sphere":{"ask":600000,"bid":520000},"Collector's Boots":{"ask":3200000,"bid":2450000},"Colossus Core":{"ask":890000,"bid":820000},"Colossus Plate Body":{"ask":8400000,"bid":1500000},"Colossus Plate Legs":{"ask":-1,"bid":1200000},"Demonic Core":{"ask":880000,"bid":860000},"Demonic Plate Body":{"ask":10000000,"bid":5200000},"Demonic Plate Legs":{"ask":12000000,"bid":3000000},"Elusiveness":{"ask":32000,"bid":23500},"Enchanted Gloves":{"ask":6600000,"bid":5000000},"Eye Of The Watcher":{"ask":560000,"bid":500000},"Eye Watch":{"ask":5800000,"bid":4900000},"Firestorm":{"ask":360000,"bid":350000},"Fluffy Red Hat":{"ask":6800000,"bid":4500000},"Frost Sphere":{"ask":480000,"bid":430000},"Frost Staff":{"ask":9800000,"bid":6000000},"Frost Surge":{"ask":320000,"bid":300000},"Gobo Defender":{"ask":560000,"bid":400000},"Gobo Rag":{"ask":340000,"bid":265000},"Infernal Battlestaff":{"ask":13000000,"bid":-1},"Infernal Ember":{"ask":580000,"bid":490000},"Luna Robe Bottoms":{"ask":1950000,"bid":96000},"Luna Robe Top":{"ask":2350000,"bid":-1},"Luna Wing":{"ask":200000,"bid":140000},"Marine Chaps":{"ask":370000,"bid":150000},"Marine Scale":{"ask":50000,"bid":26000},"Marine Tunic":{"ask":560000,"bid":175000},"Nature's Veil":{"ask":690000,"bid":500000},"Puncture":{"ask":130000,"bid":115000},"Red Chef's Hat":{"ask":4800000,"bid":4000000},"Red Panda Fluff":{"ask":470000,"bid":440000},"Revenant Anima":{"ask":880000,"bid":860000},"Revenant Chaps":{"ask":7600000,"bid":4300000},"Revenant Tunic":{"ask":9400000,"bid":6400000},"Shoebill Feather":{"ask":76000,"bid":41000},"Shoebill Shoes":{"ask":-1,"bid":350000},"Silencing Shot":{"ask":130000,"bid":125000},"Soul Fragment":{"ask":500000,"bid":480000},"Soul Hunter Crossbow":{"ask":4999999.5,"bid":2700000},"Steady Shot":{"ask":150000,"bid":145000},"Treant Bark":{"ask":48000,"bid":31000},"Treant Shield":{"ask":210000,"bid":105000},"Vampiric Bow":{"ask":-1,"bid":3600000},"Watchful Relic":{"ask":9800000,"bid":4500000},"Bag Of 10 Cowbells":{"ask":500000,"bid":460000},"Aqua Aura":{"ask":1300000,"bid":1225000},"Critical Aura":{"ask":6000000,"bid":2850000},"Fierce Aura":{"ask":6400000,"bid":3700000},"Flame Aura":{"ask":1650000,"bid":1450000},"Insanity":{"ask":3400000,"bid":2700000},"Invincible":{"ask":1600000,"bid":1250000},"Provoke":{"ask":76000,"bid":23500},"Quick Aid":{"ask":200000,"bid":190000},"Rejuvenate":{"ask":320000,"bid":270000},"Revive":{"ask":1350000,"bid":1175000},"Speed Aura":{"ask":2950000,"bid":2075000},"Sylvan Aura":{"ask":3100000,"bid":1600000},"Taunt":{"ask":64000,"bid":54000},"Acrobatic Hood":{"ask":50000000,"bid":40000000},"Acrobat's Ribbon":{"ask":3400000,"bid":3300000},"Bishop's Codex":{"ask":81000000,"bid":50000000},"Bishop's Scroll":{"ask":5800000,"bid":5200000},"Blue Key Fragment":{"ask":360000,"bid":330000},"Brown Key Fragment":{"ask":425000,"bid":410000},"Burning Key Fragment":{"ask":1350000,"bid":1300000},"Chaotic Chain":{"ask":5200000,"bid":4900000},"Chaotic Flail":{"ask":-1,"bid":100000000},"Chimerical Chest":{"ask":-1,"bid":-1},"Chimerical Essence":{"ask":400,"bid":380},"Chimerical Key":{"ask":-1,"bid":-1},"Chimerical Quiver":{"ask":-1,"bid":-1},"Crippling Slash":{"ask":54000,"bid":26000},"Cursed Ball":{"ask":3500000,"bid":3000000},"Cursed Bow":{"ask":-1,"bid":-1},"Dark Key Fragment":{"ask":920000,"bid":800000},"Dodocamel Gauntlets":{"ask":-1,"bid":16500000},"Dodocamel Plume":{"ask":3300000,"bid":3100000},"Earrings Of Threat":{"ask":-1,"bid":-1},"Enchanted Chest":{"ask":-1,"bid":-1},"Enchanted Cloak":{"ask":-1,"bid":-1},"Enchanted Essence":{"ask":1600,"bid":1500},"Enchanted Key":{"ask":-1,"bid":-1},"Green Key Fragment":{"ask":285000,"bid":255000},"Griffin Chaps":{"ask":-1,"bid":-1},"Griffin Leather":{"ask":940000,"bid":560000},"Griffin Tunic":{"ask":-1,"bid":-1},"Impale":{"ask":31000,"bid":26750},"Jackalope Antler":{"ask":1850000,"bid":1650000},"Jackalope Staff":{"ask":35000000,"bid":-1},"Knight's Aegis":{"ask":90000000,"bid":-1},"Knight's Ingot":{"ask":5400000,"bid":5100000},"Magician's Cloth":{"ask":3700000,"bid":3300000},"Magician's Hat":{"ask":-1,"bid":45000000},"Mana Spring":{"ask":205000,"bid":160000},"Manticore Shield":{"ask":-1,"bid":12750000},"Manticore Sting":{"ask":1850000,"bid":1700000},"Orange Key Fragment":{"ask":290000,"bid":280000},"Penetrating Shot":{"ask":210000,"bid":200000},"Penetrating Strike":{"ask":42000,"bid":36000},"Pestilent Shot":{"ask":31000,"bid":27000},"Purple Key Fragment":{"ask":285000,"bid":265000},"Regal Jewel":{"ask":5800000,"bid":5400000},"Regal Sword":{"ask":280000000,"bid":145000000},"Ring Of Threat":{"ask":-1,"bid":-1},"Royal Cloth":{"ask":5800000,"bid":5400000},"Royal Fire Robe Bottoms":{"ask":66000000,"bid":46000000},"Royal Fire Robe Top":{"ask":-1,"bid":60000000},"Royal Nature Robe Bottoms":{"ask":-1,"bid":47000000},"Royal Nature Robe Top":{"ask":-1,"bid":50000000},"Royal Water Robe Bottoms":{"ask":72000000,"bid":38000000},"Royal Water Robe Top":{"ask":-1,"bid":58000000},"Sinister Cape":{"ask":-1,"bid":-1},"Sinister Chest":{"ask":-1,"bid":-1},"Sinister Essence":{"ask":750,"bid":720},"Sinister Key":{"ask":-1,"bid":-1},"Smoke Burst":{"ask":52000,"bid":20500},"Stone Key Fragment":{"ask":1550000,"bid":1500000},"Sundering Crossbow":{"ask":-1,"bid":220000000},"Sundering Jewel":{"ask":8800000,"bid":7800000},"White Key Fragment":{"ask":800000,"bid":740000},"Arcane Reflection":{"ask":56000,"bid":53000},"Chimerical Chest Key":{"ask":1350000,"bid":1250000},"Chimerical Entry Key":{"ask":350000,"bid":260000},"Enchanted Chest Key":{"ask":3800000,"bid":3700000},"Enchanted Entry Key":{"ask":620000,"bid":600000},"Griffin Bulwark":{"ask":-1,"bid":94000000},"Griffin Talon":{"ask":3400000,"bid":3100000},"Sinister Chest Key":{"ask":2050000,"bid":1500000},"Sinister Entry Key":{"ask":410000,"bid":390000},"Advanced Task Badge":{"ask":-1,"bid":-1},"Alchemy Essence":{"ask":310,"bid":237.5},"Alchemy Tea":{"ask":1000,"bid":760},"Azure Alembic":{"ask":68000,"bid":15000},"Basic Task Badge":{"ask":-1,"bid":-1},"Brewing Essence":{"ask":280,"bid":220},"Burble Alembic":{"ask":860000,"bid":35999.5},"Catalyst Of Coinification":{"ask":4900,"bid":4100},"Catalyst Of Decomposition":{"ask":6900,"bid":4500},"Catalyst Of Transmutation":{"ask":8700,"bid":7000},"Catalytic Tea":{"ask":2300,"bid":2150},"Cheese Alembic":{"ask":5400,"bid":120},"Cheesesmithing Essence":{"ask":390,"bid":310},"Chimerical Token":{"ask":-1,"bid":-1},"Cooking Essence":{"ask":270,"bid":250},"Crafting Essence":{"ask":370,"bid":310},"Crimson Alembic":{"ask":460000,"bid":54000},"Crushed Philosopher's Stone":{"ask":2100000,"bid":1750000},"Crushed Sunstone":{"ask":7000,"bid":6600},"Earrings Of Critical Strike":{"ask":11000000,"bid":5800000},"Earrings Of Essence Find":{"ask":7800000,"bid":4500000},"Enchanted Token":{"ask":-1,"bid":-1},"Enhancing Essence":{"ask":820,"bid":740},"Expert Task Badge":{"ask":-1,"bid":-1},"Foraging Essence":{"ask":270,"bid":227.5},"Gluttonous Energy":{"ask":15500000,"bid":12500000},"Gluttonous Pouch":{"ask":-1,"bid":23500000},"Guzzling Energy":{"ask":35000000,"bid":33000000},"Guzzling Pouch":{"ask":-1,"bid":370000000},"Holy Alembic":{"ask":500000,"bid":440000},"Milking Essence":{"ask":285,"bid":250},"Necklace Of Speed":{"ask":25000000,"bid":9600000},"Philosopher's Earrings":{"ask":-1,"bid":250000000},"Philosopher's Necklace":{"ask":600000000,"bid":300000000},"Philosopher's Ring":{"ask":-1,"bid":-1},"Philosopher's Stone":{"ask":500000000,"bid":470000000},"Prime Catalyst":{"ask":350000,"bid":220000},"Rainbow Alembic":{"ask":330000,"bid":-1},"Ring Of Critical Strike":{"ask":9400000,"bid":5600000},"Ring Of Essence Find":{"ask":9800000,"bid":4500000},"Sinister Token":{"ask":-1,"bid":-1},"Sunstone":{"ask":460000,"bid":440000},"Super Alchemy Tea":{"ask":4500,"bid":-1},"Tailoring Essence":{"ask":300,"bid":240},"Ultra Alchemy Tea":{"ask":9200,"bid":8400},"Ultra Attack Coffee":{"ask":12500,"bid":5800},"Ultra Brewing Tea":{"ask":56000,"bid":-1},"Ultra Cheesesmithing Tea":{"ask":12250,"bid":-1},"Ultra Cooking Tea":{"ask":17000,"bid":-1},"Ultra Crafting Tea":{"ask":19000,"bid":-1},"Ultra Defense Coffee":{"ask":13500,"bid":8800},"Ultra Enhancing Tea":{"ask":10500,"bid":8600},"Ultra Foraging Tea":{"ask":7800,"bid":5600},"Ultra Intelligence Coffee":{"ask":14000,"bid":-1},"Ultra Magic Coffee":{"ask":11500,"bid":11000},"Ultra Milking Tea":{"ask":22750,"bid":1000},"Ultra Power Coffee":{"ask":11500,"bid":10750},"Ultra Ranged Coffee":{"ask":11500,"bid":10000},"Ultra Stamina Coffee":{"ask":13000,"bid":6000},"Ultra Tailoring Tea":{"ask":17000,"bid":-1},"Ultra Woodcutting Tea":{"ask":14500,"bid":-1},"Verdant Alembic":{"ask":34000,"bid":-1},"Woodcutting Essence":{"ask":330,"bid":255}}}`;
    let isUsingExpiredMarketJson = false;

    let initData_characterSkills = null;
    let initData_characterItems = null;
    let initData_combatAbilities = null;
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

    if (localStorage.getItem("initClientData")) {
        const obj = JSON.parse(localStorage.getItem("initClientData"));
        console.log(obj);
        GM_setValue("init_client_data", localStorage.getItem("initClientData"));

        initData_actionDetailMap = obj.actionDetailMap;
        initData_levelExperienceTable = obj.levelExperienceTable;
        initData_itemDetailMap = obj.itemDetailMap;
        initData_actionCategoryDetailMap = obj.actionCategoryDetailMap;
        initData_abilityDetailMap = obj.abilityDetailMap;
    }

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
            console.log(obj);
            GM_setValue("init_character_data", message);

            initData_characterSkills = obj.characterSkills;
            initData_characterItems = obj.characterItems;
            initData_characterHouseRoomMap = obj.characterHouseRoomMap;
            initData_actionTypeDrinkSlotsMap = obj.actionTypeDrinkSlotsMap;
            initData_characterAbilities = obj.characterAbilities;
            initData_myMarketListings = obj.myMarketListings;
            initData_combatAbilities = obj.combatUnit.combatAbilities;
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
            console.log(obj);
            GM_setValue("init_client_data", message);

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
                if (currentActionsHridList.length === 0 || !currentActionsHridList[0].actionHrid.startsWith("/actions/combat/")) {
                    // Clear damage statistics panel
                    players = [];
                    monsters = [];
                    monstersHP = [];
                    startTime = null;
                    endTime = null;
                    totalDuration = 0;
                    totalDamage = new Array(players.length).fill(0);
                    monsterCounts = {};
                    monsterEvasion = {};
                }
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
            GM_setValue("new_battle", message); // This is the only place to get other party members' equipted consumables.

            if (settingsMap.showDamage.isTrue) {
                if (startTime && endTime) {
                    totalDuration += (endTime - startTime) / 1000;
                }
                startTime = Date.now();
                endTime = null;
                monstersHP = obj.monsters.map((monster) => monster.currentHitpoints);
                if (!players || players.length === 0) {
                    players = obj.players;
                }
                const playerIndices = Object.keys(players);
                playerIndices.forEach((userIndex) => {
                    players[userIndex].currentAction = players[userIndex].preparingAbilityHrid
                        ? players[userIndex].preparingAbilityHrid
                        : players[userIndex].isPreparingAutoAttack
                        ? "auto"
                        : "idle";
                });
                monsters = obj.monsters;
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
        } else if (obj && obj.type === "profile_shared") {
            let profileExportListString = GM_getValue("profile_export_list", null);
            let profileExportList = null;
            // Remove invalid
            // GM_setValue("profile_export_list", JSON.stringify(new Array())); // Remove stored profiles. Only for testing.
            if (profileExportListString) {
                profileExportList = JSON.parse(profileExportListString);
                if (!profileExportList || !profileExportList.filter) {
                    console.error("Found invalid profileExportList in store. profileExportList cleared.");
                    GM_setValue("profile_export_list", JSON.stringify(new Array()));
                }
            } else {
                GM_setValue("profile_export_list", JSON.stringify(new Array()));
            }

            obj.characterID = obj.profile.characterSkills[0].characterID;
            obj.characterName = obj.profile.sharableCharacter.name;
            obj.timestamp = Date.now();

            profileExportListString = GM_getValue("profile_export_list", null) || JSON.stringify(new Array());
            profileExportList = JSON.parse(profileExportListString);
            profileExportList = profileExportList.filter((item) => item.characterID !== obj.characterID);
            profileExportList.unshift(obj);
            if (profileExportList.length > 20) {
                profileExportList.pop();
            }
            // console.log(profileExportList);
            GM_setValue("profile_export_list", JSON.stringify(profileExportList));

            addExportButton(obj);

            if (settingsMap.profileBuildScore.isTrue) {
                showBuildScoreOnProfile(obj);
            }
        } else if (obj && obj.type === "battle_updated" && monstersHP.length) {
            /* Logging start */
            //     console.log("------");
            //     const mMap = obj.mMap;
            //     if (Object.keys(mMap).length === 0) {
            //         const playerIndices = Object.keys(obj.pMap);
            //         if (playerIndices.length === 0) {
            //             console.log(`【错误：无变化】`);
            //         }
            //         playerIndices.forEach((userIndex) => {
            //             const statusTxt = `${obj.pMap.isStunned ? "【眩晕】" : ""}${
            //                 obj.pMap[userIndex].abilityHrid ? "【" + obj.pMap[userIndex].abilityHrid.replace("/abilities/", "") + "】" : ""
            //             }${obj.pMap[userIndex].isAutoAtk ? "【普攻】" : ""}`;
            //             console.log(
            //                 `【玩家自行变化】${statusTxt} ${players[userIndex].name} 上个动作【${players[userIndex].currentAction.replace(
            //                     "/abilities/",
            //                     ""
            //                 )}】`
            //             );
            //         });
            //     }
            //     monstersHP.forEach((mHP, mIndex) => {
            //         const monster = mMap[mIndex];
            //         if (monster) {
            //             const playerIndices = Object.keys(obj.pMap);
            //             if (playerIndices.length === 0) {
            //                 const hpDiff = mHP - monster.cHP;
            //                 console.log(`【怪物自行变化】${monsters[mIndex].name} 自行变化 ${hpDiff} 点血量`);
            //             }
            //             playerIndices.forEach((userIndex) => {
            //                 const hpDiff = mHP - monster.cHP;
            //                 const statusTxt = `${obj.pMap.isStunned ? "【眩晕】" : ""}${
            //                     obj.pMap[userIndex].abilityHrid ? "【" + obj.pMap[userIndex].abilityHrid.replace("/abilities/", "") + "】" : ""
            //                 }${obj.pMap[userIndex].isAutoAtk ? "【普攻】" : ""}`;
            //                 if (hpDiff > 0) {
            //                     console.log(
            //                         `【伤害】${statusTxt} ${players[userIndex].name} 对 ${
            //                             monsters[mIndex].name
            //                         } 造成了 ${hpDiff} 点伤害 上个动作【${players[userIndex].currentAction.replace("/abilities/", "")}】`
            //                     );
            //                 } else if (hpDiff === 0) {
            //                     console.log(
            //                         `【Miss】${statusTxt} ${players[userIndex].name} 对 ${monsters[mIndex].name} MISS (造成0点伤害) 上个动作【${players[
            //                             userIndex
            //                         ].currentAction.replace("/abilities/", "")}】`
            //                     );
            //                 } else {
            //                     console.log(
            //                         `【治疗】${statusTxt} ${players[userIndex].name} 对 ${
            //                             monsters[mIndex].name
            //                         } 造成了 ${-hpDiff} 点治疗 上个动作【${players[userIndex].currentAction.replace("/abilities/", "")}】`
            //                     );
            //                 }
            //             });
            //         }
            //     });
            /* Logging end */
            if (settingsMap.showDamage.isTrue) {
                const mMap = obj.mMap;
                const pMap = obj.pMap;
                const playerIndices = Object.keys(obj.pMap);

                monstersHP.forEach((mHP, mIndex) => {
                    const monster = mMap[mIndex];
                    if (monster) {
                        const hpDiff = mHP - monster.cHP;
                        monstersHP[mIndex] = monster.cHP;
                        if (hpDiff > 0) {
                            if (playerIndices.length > 1) {
                                // Damage is resulted by ManaSpring from one of the players.
                                playerIndices.forEach((userIndex) => {
                                    const action = pMap[userIndex].abilityHrid
                                        ? pMap[userIndex].abilityHrid
                                        : pMap[userIndex].isAutoAtk
                                        ? "auto"
                                        : null;
                                    // console.log(`${players[userIndex].name} ${players[userIndex].currentAction} -> ${action}`);
                                    if (players[userIndex].currentAction !== action && players[userIndex].currentAction?.includes("mana_spring")) {
                                        if (!players[userIndex].damageMap) {
                                            players[userIndex].damageMap = new Map();
                                        }
                                        players[userIndex].damageMap.set(
                                            players[userIndex].currentAction,
                                            players[userIndex].damageMap.has(players[userIndex].currentAction)
                                                ? players[userIndex].damageMap.get(players[userIndex].currentAction) + hpDiff
                                                : hpDiff
                                        );
                                        totalDamage[userIndex] += hpDiff;
                                        // console.log("mana_spring by " + players[userIndex].name);
                                        // console.log(players[userIndex].damageMap);
                                    }
                                });
                            } else {
                                if (!players[playerIndices[0]].damageMap) {
                                    players[playerIndices[0]].damageMap = new Map();
                                }
                                players[playerIndices[0]].damageMap.set(
                                    players[playerIndices[0]].currentAction,
                                    players[playerIndices[0]].damageMap.has(players[playerIndices[0]].currentAction)
                                        ? players[playerIndices[0]].damageMap.get(players[playerIndices[0]].currentAction) + hpDiff
                                        : hpDiff
                                );
                                totalDamage[playerIndices[0]] += hpDiff;
                                // console.log(players[playerIndices[0]].damageMap);
                            }
                        }
                    }
                });

                playerIndices.forEach((userIndex) => {
                    players[userIndex].currentAction = pMap[userIndex].abilityHrid
                        ? pMap[userIndex].abilityHrid
                        : pMap[userIndex].isAutoAtk
                        ? "auto"
                        : "idle";
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
        let marketListingsNetworthAsk = 0;
        let marketListingsNetworthBid = 0;
        let equippedNetworthAsk = 0;
        let equippedNetworthBid = 0;
        let inventoryNetworthAsk = 0;
        let inventoryNetworthBid = 0;

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
                if (item.itemLocationHrid !== "/item_locations/inventory") {
                    equippedNetworthAsk += item.count * (totalCost > 0 ? totalCost : 0);
                    equippedNetworthBid += item.count * (totalCost > 0 ? totalCost : 0);
                } else {
                    inventoryNetworthAsk += item.count * (totalCost > 0 ? totalCost : 0);
                    inventoryNetworthBid += item.count * (totalCost > 0 ? totalCost : 0);
                }
            } else if (marketPrices) {
                if (item.itemLocationHrid !== "/item_locations/inventory") {
                    equippedNetworthAsk += item.count * (marketPrices.ask > 0 ? marketPrices.ask : 0);
                    equippedNetworthBid += item.count * (marketPrices.bid > 0 ? marketPrices.bid : 0);
                } else {
                    inventoryNetworthAsk += item.count * (marketPrices.ask > 0 ? marketPrices.ask : 0);
                    inventoryNetworthBid += item.count * (marketPrices.bid > 0 ? marketPrices.bid : 0);
                }
            } else {
                console.log("calculateNetworth cannot find price of " + itemName);
            }
        }

        for (const item of initData_myMarketListings) {
            const itemName = initData_itemDetailMap[item.itemHrid]?.name;
            const quantity = item.orderQuantity - item.filledQuantity;
            const enhancementLevel = item.enhancementLevel;
            const marketPrices = marketAPIJson.market[itemName];
            if (!marketPrices) {
                console.log("calculateNetworth cannot get marketPrices of " + itemName);
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
                    marketListingsNetworthAsk += quantity * (marketPrices.ask > 0 ? marketPrices.ask : 0);
                    marketListingsNetworthBid += quantity * (marketPrices.bid > 0 ? marketPrices.bid : 0);
                } else {
                    input_data.item_hrid = item.itemHrid;
                    input_data.stop_at = enhancementLevel;
                    const best = await findBestEnhanceStrat(input_data);
                    let totalCost = best?.totalCost;
                    totalCost = totalCost ? Math.round(totalCost) : 0;
                    marketListingsNetworthAsk += quantity * (totalCost > 0 ? totalCost : 0);
                    marketListingsNetworthBid += quantity * (totalCost > 0 ? totalCost : 0);
                }
                marketListingsNetworthAsk += item.unclaimedCoinCount;
                marketListingsNetworthBid += item.unclaimedCoinCount;
            } else {
                marketListingsNetworthAsk += quantity * item.price;
                marketListingsNetworthBid += quantity * item.price;
                marketListingsNetworthAsk += item.unclaimedItemCount * (marketPrices.ask > 0 ? marketPrices.ask : 0);
                marketListingsNetworthBid += item.unclaimedItemCount * (marketPrices.bid > 0 ? marketPrices.bid : 0);
            }
        }

        networthAsk = equippedNetworthAsk + inventoryNetworthAsk + marketListingsNetworthAsk;
        networthBid = equippedNetworthBid + inventoryNetworthBid + marketListingsNetworthBid;

        /* 仓库搜索栏下方显示人物总结 */
        // Some code of networth summery is by Stella.
        const addInventorySummery = async (invElem) => {
            const [battleHouseScore, nonBattleHouseScore, abilityScore, equipmentScore] = await getSelfBuildScores(
                equippedNetworthAsk * 0.5 + equippedNetworthBid * 0.5
            );
            const totalScore = battleHouseScore + abilityScore + equipmentScore;
            const totalHouseScore = battleHouseScore + nonBattleHouseScore;
            const totalNetworth = networthAsk * 0.5 + networthBid * 0.5 + (totalHouseScore + abilityScore) * 1000000;

            invElem.insertAdjacentHTML(
                "beforebegin",
                `<div style="text-align: left; color: ${SCRIPT_COLOR_MAIN}; font-size: 14px;">
                    <!-- 战力打造分 -->
                    <div style="cursor: pointer; font-weight: bold" id="toggleScores">${
                        isZH ? "+ 战力打造分: " : "+ Character Build Score: "
                    }${totalScore.toFixed(1)}</div>
                    <div id="buildScores" style="display: none; margin-left: 20px;">
                            <div>${isZH ? "房子分：" : "House score: "}${battleHouseScore.toFixed(1)}</div>
                            <div>${isZH ? "技能分：" : "Ability score: "}${abilityScore.toFixed(1)}</div>
                            <div>${isZH ? "装备分：" : "Equipment score: "}${equipmentScore.toFixed(1)}</div>
                    </div>

                    <!-- 总NetWorth -->
                    <div style="cursor: pointer; font-weight: bold;" id="toggleNetWorth">
                        ${isZH ? "+ 总NetWorth：" : "+ Total NetWorth: "}${numberFormatter(totalNetworth)}
                    </div>

                    <div id="netWorthDetails" style="display: none; margin-left: 20px;">
                        <!-- 流动资产 -->
                        <div style="cursor: pointer;" id="toggleCurrentAssets">
                            ${isZH ? "+ 流动资产价值" : "+ Current assets value"}
                        </div>
                        <div id="currentAssets" style="display: none; margin-left: 20px;">
                            <div>${isZH ? "装备价值：" : "Equipment value: "}${numberFormatter(equippedNetworthAsk)}</div>
                            <div>${isZH ? "库存价值：" : "Inventory value: "}${numberFormatter(inventoryNetworthAsk)}</div>
                            <div>${isZH ? "订单价值：" : "Market listing value: "}${numberFormatter(marketListingsNetworthAsk)}</div>
                        </div>

                        <!-- 非流动资产 -->
                        <div style="cursor: pointer;" id="toggleNonCurrentAssets">
                            ${isZH ? "+ 非流动资产价值" : "+ Fixed assets value"}
                        </div>
                        <div id="nonCurrentAssets" style="display: none; margin-left: 20px;">
                            <div>${isZH ? "房子价值：" : "Houses value: "}${numberFormatter(totalHouseScore * 1000000)}</div>
                            <div>${isZH ? "技能价值：" : "Abilities value: "}${numberFormatter(abilityScore * 1000000)}</div>
                        </div>
                    </div>
                </div>`
            );

            // 监听点击事件，控制折叠和展开
            const toggleScores = document.getElementById("toggleScores");
            const ScoreDetails = document.getElementById("buildScores");
            const toggleButton = document.getElementById("toggleNetWorth");
            const netWorthDetails = document.getElementById("netWorthDetails");
            const toggleCurrentAssets = document.getElementById("toggleCurrentAssets");
            const currentAssets = document.getElementById("currentAssets");
            const toggleNonCurrentAssets = document.getElementById("toggleNonCurrentAssets");
            const nonCurrentAssets = document.getElementById("nonCurrentAssets");

            toggleScores.addEventListener("click", () => {
                const isCollapsed = ScoreDetails.style.display === "none";
                ScoreDetails.style.display = isCollapsed ? "block" : "none";
                toggleScores.textContent = (isCollapsed ? "↓ " : "+ ") + (isZH ? "战力打造分: " : "Character Build Score: ") + totalScore.toFixed(1);
            });

            toggleButton.addEventListener("click", () => {
                const isCollapsed = netWorthDetails.style.display === "none";
                netWorthDetails.style.display = isCollapsed ? "block" : "none";
                toggleButton.textContent =
                    (isCollapsed ? "↓ " : "+ ") + (isZH ? "总NetWorth：" : "Total NetWorth: ") + numberFormatter(totalNetworth);
                currentAssets.style.display = isCollapsed ? "block" : "none";
                toggleCurrentAssets.textContent = (isCollapsed ? "↓ " : "+ ") + (isZH ? "流动资产价值" : "Current assets value");
                nonCurrentAssets.style.display = isCollapsed ? "block" : "none";
                toggleNonCurrentAssets.textContent = (isCollapsed ? "↓ " : "+ ") + (isZH ? "非流动资产价值" : "Fixed assets value");
            });

            toggleCurrentAssets.addEventListener("click", () => {
                const isCollapsed = currentAssets.style.display === "none";
                currentAssets.style.display = isCollapsed ? "block" : "none";
                toggleCurrentAssets.textContent = (isCollapsed ? "↓ " : "+ ") + (isZH ? "流动资产价值" : "Current assets value");
            });

            toggleNonCurrentAssets.addEventListener("click", () => {
                const isCollapsed = nonCurrentAssets.style.display === "none";
                nonCurrentAssets.style.display = isCollapsed ? "block" : "none";
                toggleNonCurrentAssets.textContent = (isCollapsed ? "↓ " : "+ ") + (isZH ? "非流动资产价值" : "Fixed assets value");
            });
        };

        const waitForHeader = () => {
            const targetNode = document.querySelector("div.Header_totalLevel__8LY3Q");
            if (targetNode) {
                targetNode.insertAdjacentHTML(
                    "afterend",
                    `<div style="font-size: 13px; font-weight: 500; color: ${SCRIPT_COLOR_MAIN}; text-wrap: nowrap;">Current Assets: ${numberFormatter(
                        networthAsk
                    )} / ${numberFormatter(networthBid)}${
                        isUsingExpiredMarketJson && settingsMap.networkAlert.isTrue
                            ? `<div style="color: ${SCRIPT_COLOR_ALERT};">${isZH ? "无法从API更新市场数据" : "Can't update market prices"}</div>`
                            : ""
                    }</div>`
                );
            } else {
                setTimeout(waitForHeader, 200);
            }
        };
        waitForHeader();

        const waitForInv = () => {
            const targetNodes = document.querySelectorAll("div.Inventory_items__6SXv0");
            for (const node of targetNodes) {
                if (settingsMap.invWorth.isTrue) {
                    if (!node.classList.contains("script_buildScore_added")) {
                        node.classList.add("script_buildScore_added");
                        addInventorySummery(node);
                    }
                }
                if (settingsMap.invSort.isTrue) {
                    if (!node.classList.contains("script_invSort_added")) {
                        node.classList.add("script_invSort_added");
                        addInvSortButton(node);
                    }
                }
            }
            setTimeout(waitForInv, 1000);
        };
        waitForInv();
    }

    /* 仓库物品排序 */
    // by daluo, bot7420
    async function addInvSortButton(invElem) {
        const price_data = await fetchMarketJSON();
        if (!price_data || !price_data.market) {
            console.error("addInvSortButton fetchMarketJSON null");
            return;
        }

        const askButton = `<button
            id="script_sortByAsk_btn"
            style="border-radius: 3px; background-color: ${SCRIPT_COLOR_MAIN}; color: black;">
            ${isZH ? "出售价" : "Ask"}
            </button>`;
        const bidButton = `<button
            id="script_sortByBid_btn"
            style="border-radius: 3px; background-color: ${SCRIPT_COLOR_MAIN}; color: black;">
            ${isZH ? "收购价" : "Bid"}
            </button>`;
        const noneButton = `<button
            id="script_sortByNone_btn"
            style="border-radius: 3px; background-color: ${SCRIPT_COLOR_MAIN}; color: black;">
            ${isZH ? "无" : "None"}
            </button>`;
        const buttonsDiv = `<div style="color: ${SCRIPT_COLOR_MAIN}; font-size: 14px; text-align: left; ">${
            isZH ? "物品排序：" : "Sort items by: "
        }${askButton} ${bidButton} ${noneButton}</div>`;
        invElem.insertAdjacentHTML("beforebegin", buttonsDiv);

        invElem.parentElement.querySelector("button#script_sortByAsk_btn").addEventListener("click", function (e) {
            sortItemsBy("ask");
        });
        invElem.parentElement.querySelector("button#script_sortByBid_btn").addEventListener("click", function (e) {
            sortItemsBy("bid");
        });
        invElem.parentElement.querySelector("button#script_sortByNone_btn").addEventListener("click", function (e) {
            sortItemsBy("none");
        });

        const sortItemsBy = (order) => {
            for (const typeDiv of invElem.children) {
                const typeName = getOriTextFromElement(typeDiv.getElementsByClassName("Inventory_categoryButton__35s1x")[0]);
                const notNeedSortTypes = ["Loots", "Currencies", "Equipment"];
                if (notNeedSortTypes.includes(typeName)) {
                    continue;
                }

                typeDiv.querySelector(".Inventory_label__XEOAx").style.order = Number.MIN_SAFE_INTEGER;

                const itemElems = typeDiv.querySelectorAll(".Item_itemContainer__x7kH1");
                for (const itemElem of itemElems) {
                    const itemName = itemElem.querySelector("svg").attributes["aria-label"].value;
                    let itemCount = itemElem.querySelector(".Item_count__1HVvv").innerText;
                    itemCount = Number(itemCount.toLowerCase().replaceAll("k", "000").replaceAll("m", "000000"));
                    const askPrice = price_data.market[itemName] && price_data.market[itemName].ask > 0 ? price_data.market[itemName].ask : 0;
                    const bidPrice = price_data.market[itemName] && price_data.market[itemName].bid > 0 ? price_data.market[itemName].bid : 0;
                    const itemAskmWorth = askPrice * itemCount;
                    const itemBidWorth = bidPrice * itemCount;

                    // 价格角标
                    if (!itemElem.querySelector("#script_stack_price")) {
                        const priceElemHTML = `<div
                            id="script_stack_price"
                            style="z-index: 1; position: absolute; top: 2px; left: 2px; text-align: left;">
                        </div>`;
                        itemElem.querySelector(".Item_item__2De2O.Item_clickable__3viV6").insertAdjacentHTML("beforeend", priceElemHTML);
                    }
                    const priceElem = itemElem.querySelector("#script_stack_price");

                    // 排序
                    if (order === "ask") {
                        itemElem.style.order = -itemAskmWorth;
                        priceElem.textContent = numberFormatter(itemAskmWorth);
                    } else if (order === "bid") {
                        itemElem.style.order = -itemBidWorth;
                        priceElem.textContent = numberFormatter(itemBidWorth);
                    } else if (order === "none") {
                        itemElem.style.order = 0;
                        priceElem.textContent = "";
                    }
                }
            }
        };
    }

    /* 计算打造分 */
    // BuildScore algorithm by Ratatatata (https://greasyfork.org/zh-CN/scripts/511240)
    async function getSelfBuildScores(equippedNetworth) {
        // 房子分：战斗相关房子升级所需总金币
        const battleHouses = ["dining_room", "library", "dojo", "gym", "armory", "archery_range", "mystical_study"];
        let battleHouseScore = 0;
        let nonBattleHouseScore = 0;
        for (const key in initData_characterHouseRoomMap) {
            if (battleHouses.some((house) => initData_characterHouseRoomMap[key].houseRoomHrid.includes(house))) {
                battleHouseScore += (await getHouseFullBuildPrice(initData_characterHouseRoomMap[key])) / 1000000;
            } else {
                nonBattleHouseScore += (await getHouseFullBuildPrice(initData_characterHouseRoomMap[key])) / 1000000;
            }
        }

        // 技能分：当前使用的战斗技能所需技能书总价，单位M
        let abilityScore = 0;
        try {
            abilityScore = await calculateAbilityScore();
        } catch (error) {
            console.error("Error in calculateAbilityScore()", error);
        }
        // console.log("abilityScore " + abilityScore);

        // 装备分：当前身上装备总价，单位M
        let equipmentScore = equippedNetworth / 1000000;
        // console.log("equipmentScore " + equipmentScore);

        return [battleHouseScore, nonBattleHouseScore, abilityScore, equipmentScore];
    }

    // 计算单个房子完整造价
    async function getHouseFullBuildPrice(house) {
        const marketAPIJson = await fetchMarketJSON();
        if (!marketAPIJson) {
            return 0;
        }
        const clientObj = JSON.parse(GM_getValue("init_client_data", ""));

        const upgradeCostsMap = clientObj.houseRoomDetailMap[house.houseRoomHrid].upgradeCostsMap;
        const level = house.level;

        let cost = 0;
        for (let i = 1; i <= level; i++) {
            for (const item of upgradeCostsMap[i]) {
                const itemName = clientObj.itemDetailMap[item.itemHrid].name;
                const marketPrices = marketAPIJson.market[itemName];
                if (marketPrices) {
                    cost += item.count * getWeightedMarketPrice(marketPrices);
                } else {
                    console.log("getHouseFullBuildPrice cannot find price of " + itemName);
                }
            }
        }
        return cost;
    }

    function getWeightedMarketPrice(marketPrices, ratio = 0.5) {
        let ask = marketPrices.ask;
        let bid = marketPrices.bid;
        if (ask > 0 && bid < 0) {
            bid = ask;
        }
        if (bid > 0 && ask < 0) {
            ask = bid;
        }
        const weightedPrice = ask * ratio + bid * (1 - ratio);
        return weightedPrice;
    }

    // 技能价格计算
    async function calculateAbilityScore() {
        const marketAPIJson = await fetchMarketJSON();
        if (!marketAPIJson) {
            return 0;
        }
        let exp_50_skill = ["poke", "scratch", "smack", "quick_shot", "water_strike", "fireball", "entangle", "minor_heal"];
        const getNeedBooksToLevel = (targetLevel, abilityPerBookExp) => {
            const needExp = initData_levelExperienceTable[targetLevel];
            let needBooks = needExp / abilityPerBookExp;
            needBooks += 1;
            return needBooks.toFixed(1);
        };
        // 技能净值
        let price = 0;
        initData_combatAbilities.forEach((item) => {
            let numBooks = 0;
            if (exp_50_skill.some((skill) => item.abilityHrid.includes(skill))) {
                numBooks = getNeedBooksToLevel(item.level, 50);
            } else {
                numBooks = getNeedBooksToLevel(item.level, 500);
            }
            const itemName = initData_itemDetailMap[item.abilityHrid.replace("/abilities/", "/items/")].name;
            const marketPrices = marketAPIJson.market[itemName];
            if (marketPrices) {
                price += numBooks * getWeightedMarketPrice(marketPrices);
            } else {
                console.log("calculateAbilityScore cannot find price of " + itemName);
            }
            // console.log(`技能:${itemName},价值${numBooks * (marketPrices.bid > 0 ? marketPrices.bid : 0)}`)
        });

        return (price /= 1000000);
    }

    /* 查看人物面板显示打造分 */
    // by Ratatatata (https://greasyfork.org/zh-CN/scripts/511240)
    function getInfoPanel() {
        const selectedElement = document.querySelector(`div.SharableProfile_overviewTab__W4dCV`);
        if (selectedElement) {
            return selectedElement;
        } else {
            return new Promise((resolve) => {
                setTimeout(() => resolve(getInfoPanel()), 500);
            });
        }
    }

    async function showBuildScoreOnProfile(profile_shared_obj) {
        const [battleHouseScore, abilityScore, equipmentScore] = await getBuildScoreByProfile(profile_shared_obj);
        const totalBuildScore = battleHouseScore + abilityScore + equipmentScore;
        const isEquipmentHiddenText = abilityScore + equipmentScore <= 0 ? (isZH ? " (装备隐藏)" : " (Equipment hidden)") : " ";

        const panel = await getInfoPanel();
        panel.insertAdjacentHTML(
            "beforeend",
            `<div style="text-align: left; color: ${SCRIPT_COLOR_MAIN}; font-size: 14px;">
                <div style="cursor: pointer; font-weight: bold" id="toggleScores_profile">${
                    isZH ? "+ 战力打造分: " : "+ Character Build Score: "
                }${totalBuildScore.toFixed(1)}${isEquipmentHiddenText}</div>
                <div id="buildScores_profile" style="display: none; margin-left: 20px;">
                        <div>${isZH ? "房子分：" : "House score: "}${battleHouseScore.toFixed(1)}</div>
                        <div>${isZH ? "技能分：" : "Ability score: "}${abilityScore.toFixed(1)}</div>
                        <div>${isZH ? "装备分：" : "Equipment score: "}${equipmentScore.toFixed(1)}</div>
                </div>
            </div>`
        );
        // 监听点击事件，控制折叠和展开
        const toggleScores = document.getElementById("toggleScores_profile");
        const ScoreDetails = document.getElementById("buildScores_profile");
        toggleScores.addEventListener("click", () => {
            const isCollapsed = ScoreDetails.style.display === "none";
            ScoreDetails.style.display = isCollapsed ? "block" : "none";
            toggleScores.textContent =
                (isCollapsed ? "↓ " : "+ ") +
                (isZH ? "战力打造分: " : "Character Build Score: ") +
                totalBuildScore.toFixed(1) +
                isEquipmentHiddenText;
        });
    }

    // 计算打造分
    async function getBuildScoreByProfile(profile_shared_obj) {
        // 房子分：战斗相关房子升级所需总金币
        const battleHouses = ["dining_room", "library", "dojo", "gym", "armory", "archery_range", "mystical_study"];
        let battleHouseScore = 0;
        for (const key in profile_shared_obj.profile.characterHouseRoomMap) {
            if (battleHouses.some((house) => profile_shared_obj.profile.characterHouseRoomMap[key].houseRoomHrid.includes(house))) {
                battleHouseScore += (await getHouseFullBuildPrice(profile_shared_obj.profile.characterHouseRoomMap[key])) / 1000000;
            }
        }
        // console.log("房屋分：" + battleHouseScore);
        if (profile_shared_obj.profile.hideWearableItems) {
            // 对方未展示装备
            return [battleHouseScore, 0, 0];
        }

        // 技能分：当前使用的战斗技能所需技能书总价，单位M
        let abilityScore = 0;
        try {
            abilityScore = await calculateSkill(profile_shared_obj);
            // console.log("技能分：" + abilityScore);
        } catch (error) {
            console.error("Error in calculate skill:", error);
        }

        // 装备分：当前身上装备总价，单位M
        let equipmentScore = 0;
        try {
            equipmentScore = await calculateEquipment(profile_shared_obj);
            // console.log("装备分：" + equipmentScore);
        } catch (error) {
            console.error("Error in calculateEquipmen:", error);
        }

        return [battleHouseScore, abilityScore, equipmentScore];
    }

    // 技能价格计算
    async function calculateSkill(profile_shared_obj) {
        const marketAPIJson = await fetchMarketJSON();
        if (!marketAPIJson) {
            return 0;
        }
        let obj = profile_shared_obj.profile;
        let exp_50_skill = ["poke", "scratch", "smack", "quick_shot", "water_strike", "fireball", "entangle", "minor_heal"];
        const getNeedBooksToLevel = (targetLevel, abilityPerBookExp) => {
            const needExp = initData_levelExperienceTable[targetLevel];
            let needBooks = needExp / abilityPerBookExp;
            needBooks += 1;
            return needBooks.toFixed(1);
        };
        // 技能净值
        let price = 0;
        obj.equippedAbilities.forEach((item) => {
            let numBooks = 0;
            if (exp_50_skill.some((skill) => item.abilityHrid.includes(skill))) {
                numBooks = getNeedBooksToLevel(item.level, 50);
            } else {
                numBooks = getNeedBooksToLevel(item.level, 500);
            }
            const itemName = initData_itemDetailMap[item.abilityHrid.replace("/abilities/", "/items/")].name;
            const marketPrices = marketAPIJson.market[itemName];
            if (marketPrices) {
                price += numBooks * getWeightedMarketPrice(marketPrices);
            } else {
                console.log("calculateSkill cannot find price of " + itemName);
            }
            // console.log(`技能:${itemName},价值${numBooks * (marketPrices.bid > 0 ? marketPrices.bid : 0)}`)
        });

        return (price /= 1000000);
    }

    // 装备价格计算
    async function calculateEquipment(profile_shared_obj) {
        const marketAPIJson = await fetchMarketJSON();
        if (!marketAPIJson) {
            return 0;
        }
        let obj = profile_shared_obj.profile;
        // 装备净值
        let networthAsk = 0;
        let networthBid = 0;
        for (const key in obj.wearableItemMap) {
            let item = obj.wearableItemMap[key];
            const enhanceLevel = obj.wearableItemMap[key].enhancementLevel;
            const itemName = initData_itemDetailMap[obj.wearableItemMap[key].itemHrid].name;
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
            } else {
                console.log("calculateEquipment cannot find price of " + itemName);
            }
        }

        return (networthAsk * 0.5 + networthBid * 0.5) / 1000000;
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
        const targetNode = document.querySelector("div.Header_actionName__31-L2 > div.Header_displayName__1hN09");
        if (targetNode.textContent.includes("[")) {
            return;
        }

        let totalTimeStr = "Error";
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

        targetNode.textContent += totalTimeStr;
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
        "/action_types/alchemy": "alchemySpeed",
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
        "/action_types/alchemy": "/house_rooms/laboratory",
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
        let totalBuff = 0;
        for (const item of initData_characterItems) {
            if (item.itemLocationHrid.includes("_tool")) {
                const buffName = actionHridToToolsSpeedBuffNamesMap[initData_actionDetailMap[actionHrid].type];
                const enhanceBonus = 1 + itemEnhanceLevelToBuffBonusMap[item.enhancementLevel] / 100;
                const buff = initData_itemDetailMap[item.itemHrid].equipmentDetail.noncombatStats[buffName] || 0;
                totalBuff += buff * enhanceBonus;
            }
        }
        return Number(totalBuff * 100).toFixed(1);
    }

    function getItemEffiBuffByActionHrid(actionHrid) {
        let buff = 0;
        const propertyName = initData_actionDetailMap[actionHrid].type.replace("/action_types/", "") + "Efficiency";
        for (const item of initData_characterItems) {
            if (item.itemLocationHrid === "/item_locations/inventory") {
                continue;
            }
            const itemDetail = initData_itemDetailMap[item.itemHrid];

            const specificStat = itemDetail?.equipmentDetail?.noncombatStats[propertyName];
            if (specificStat && specificStat > 0) {
                let enhanceBonus = 1;
                if (item.itemLocationHrid.includes("earrings") || item.itemLocationHrid.includes("ring") || item.itemLocationHrid.includes("neck")) {
                    enhanceBonus = 1 + (itemEnhanceLevelToBuffBonusMap[item.enhancementLevel] * 5) / 100;
                } else {
                    enhanceBonus = 1 + itemEnhanceLevelToBuffBonusMap[item.enhancementLevel] / 100;
                }
                buff += specificStat * enhanceBonus;
            }

            const skillingStat = itemDetail?.equipmentDetail?.noncombatStats["skillingEfficiency"];
            if (skillingStat && skillingStat > 0) {
                let enhanceBonus = 1;
                if (item.itemLocationHrid.includes("earrings") || item.itemLocationHrid.includes("ring") || item.itemLocationHrid.includes("neck")) {
                    enhanceBonus = 1 + (itemEnhanceLevelToBuffBonusMap[item.enhancementLevel] * 5) / 100;
                } else {
                    enhanceBonus = 1 + itemEnhanceLevelToBuffBonusMap[item.enhancementLevel] / 100;
                }
                buff += skillingStat * enhanceBonus;
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
        // NOT_IMPLEMENTED Processing (+15% chance to convert product into processed material) — milking, foraging, woodcutting
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
            amount = +getOriTextFromElement(amountSpan).split(": ")[1].replaceAll(THOUSAND_SEPERATOR, "");
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
                // 出售市场税
                const bidAfterTax = bid * 0.98;

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
                    bidAfterTax - (totalAskPrice * (1 - teaBuffs.lessResource / 100)) / droprate
                )}${isZH ? "/个" : "/item"}, ${numberFormatter(
                    produceItemPerHour * (bidAfterTax * droprate - totalAskPrice * (1 - teaBuffs.lessResource / 100)) +
                        extraQuantityPerHour * bidAfterTax * droprate
                )}${isZH ? "/小时" : "/hour"}, ${numberFormatter(
                    24 *
                        (produceItemPerHour * (bidAfterTax * droprate - totalAskPrice * (1 - teaBuffs.lessResource / 100)) +
                            extraQuantityPerHour * bidAfterTax * droprate)
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
                // 出售市场税
                const bidAfterTax = bid * 0.98;

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
                appendHTMLStr += `<div style="color: ${SCRIPT_COLOR_TOOLTIP};">${isZH ? "利润: " : "Profit: "}${numberFormatter(bidAfterTax)}${
                    isZH ? "/个" : "/item"
                }, ${numberFormatter(produceItemPerHour * bidAfterTax + extraQuantityPerHour * bidAfterTax)}${
                    isZH ? "/小时" : "/hour"
                }, ${numberFormatter(24 * (produceItemPerHour * bidAfterTax + extraQuantityPerHour * bidAfterTax))}${isZH ? "/天" : "/day"}</div>`;
            }
        }

        insertAfterElem.insertAdjacentHTML("afterend", appendHTMLStr);
    }

    async function fetchMarketJSON(forceFetch = false) {
        // Broswer does not support fetch
        const sendRequest = GM.xmlHttpRequest || GM_xmlhttpRequest;
        if (typeof sendRequest != "function") {
            console.error("fetchMarketJSON null function");
            isUsingExpiredMarketJson = true;
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

        // Has recently fetched
        if (
            !forceFetch &&
            localStorage.getItem("MWITools_marketAPI_timestamp") &&
            Date.now() - localStorage.getItem("MWITools_marketAPI_timestamp") < 1800000 // 30 min
        ) {
            return JSON.parse(localStorage.getItem("MWITools_marketAPI_json"));
        }

        // Start fetch
        console.log("fetchMarketJSON fetch github start");
        let jsonStr = null;
        jsonStr = await new Promise((resolve, reject) => {
            sendRequest({
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

        // Fetch failed
        if (!jsonStr) {
            isUsingExpiredMarketJson = true;
            if (
                JSON.parse(localStorage.getItem("MWITools_marketAPI_json")) &&
                localStorage.getItem("MWITools_marketAPI_timestamp") &&
                JSON.parse(MARKET_JSON_LOCAL_BACKUP).time * 1000 < localStorage.getItem("MWITools_marketAPI_timestamp")
            ) {
                console.error("fetchMarketJSON network error, using previously fetched version");
                jsonStr = localStorage.getItem("MWITools_marketAPI_json");
            } else {
                console.error("fetchMarketJSON network error, using hard-coded backup version");
                jsonStr = MARKET_JSON_LOCAL_BACKUP;
            }
        } else {
            isUsingExpiredMarketJson = false;
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
                            added.querySelector("div.SkillActionDetail_regularComponent__3oCgr")
                        ) {
                            handleActionPanel(added.querySelector("div.SkillActionDetail_regularComponent__3oCgr"));
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
        const exp = Number(
            getOriTextFromElement(panel.querySelector("div.SkillActionDetail_expGain__F5xHu"))
                .replaceAll(THOUSAND_SEPERATOR, "")
                .replaceAll(DECIMAL_SEPERATOR, ".")
        );

        const duration = Number(
            getOriTextFromElement(panel.querySelectorAll("div.SkillActionDetail_value__dQjYH")[5])
                .replaceAll(THOUSAND_SEPERATOR, "")
                .replaceAll(DECIMAL_SEPERATOR, ".")
                .replace("s", "")
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
        const gatherDiv = inputElem.parentNode.parentNode.parentNode;
        gatherDiv.insertAdjacentHTML("afterend", hTMLStr);
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

        let appendAfterElem = showTotalTimeDiv;

        // 显示快捷按钮
        if (settingsMap.actionPanel_totalTime_quickInputs.isTrue) {
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

            appendAfterElem = quickInputButtonsDiv;
        }

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

            appendAfterElem.insertAdjacentHTML("afterend", hTMLStr);
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
        let totalRawCoins = 0; // For IC

        if (hasMarketJson) {
            for (const loot of Object.values(message.unit.totalLootMap)) {
                const itemName = initData_itemDetailMap[loot.itemHrid].name;
                const itemCount = loot.count;
                if (itemName === "Coin") {
                    totalRawCoins += itemCount;
                }
                if (marketJson.market[itemName]) {
                    totalPriceAsk += marketJson.market[itemName].ask * itemCount;
                    totalPriceAskBid += marketJson.market[itemName].bid * itemCount;
                } else {
                    console.log("handleBattleSummary failed to read price of " + loot.itemHrid);
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
                    document
                        .querySelector("div#script_totalIncomeDay")
                        .insertAdjacentHTML(
                            "afterend",
                            `<div id="script_avgRawCoinHour" style="color: ${SCRIPT_COLOR_MAIN};">${
                                isZH ? "每小时仅金币收获: " : "Raw coins/hour: "
                            }${numberFormatter(totalRawCoins / (battleDurationSec / 60 / 60))}</div>`
                        );
                }
                // 总经验
                document
                    .querySelector("div#script_avgRawCoinHour")
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

            if (initData_itemDetailMap[itemHrid]?.equipmentDetail && itemLevel && itemLevel > 0) {
                if (!div.querySelector("div.script_itemLevel")) {
                    div.insertAdjacentHTML(
                        "beforeend",
                        `<div class="script_itemLevel" style="z-index: 1; position: absolute; top: 2px; right: 2px; text-align: right; color: ${SCRIPT_COLOR_MAIN};">${itemLevel}</div>`
                    );
                }
                if (
                    !initData_itemDetailMap[itemHrid]?.equipmentDetail?.type?.includes("_tool") &&
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

                map.set("/items/chimerical_entry_key", isZH ? "牢1" : "D1");
                map.set("/items/sinister_entry_key", isZH ? "牢2" : "D2");
                map.set("/items/enchanted_entry_key", isZH ? "牢3" : "D3");

                map.set("/items/chimerical_chest_key", "3.4.5.8");
                map.set("/items/sinister_chest_key", "5.7.8.10");
                map.set("/items/enchanted_chest_key", "6.7.9.11");

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
                    <option value="others">Others</option>
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
        if (!itemDetal.equipmentDetail) {
            return;
        }

        const itemLevel = itemDetal.itemLevel;
        const type = itemDetal.equipmentDetail.type;
        const levelRequirements = itemDetal.equipmentDetail.levelRequirements;

        let isType = false;
        isType = type && type.includes(onlyShowItemsType);
        if (onlyShowItemsType === "all") {
            isType = true;
        }

        let isRequired = false;
        for (const requirement of levelRequirements) {
            if (requirement.skillHrid.includes(onlyShowItemsSkillReq)) {
                isRequired = true;
            }
        }
        if (onlyShowItemsSkillReq === "others") {
            const combatTypes = ["attack", "power", "defense", "ranged", "magic"];
            isRequired = !combatTypes.some((type) => {
                for (const requirement of levelRequirements) {
                    if (requirement.skillHrid.includes(type)) {
                        return true;
                    }
                }
            });
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
                if (action.hrid.includes("/combat/")) {
                    if (action.name === monsterName) {
                        actionObj = action;
                        break;
                    } else if (action.combatZoneInfo.fightInfo.battlesPerBoss === 10) {
                        const monsterHrid = "/monsters/" + monsterName.toLowerCase().replaceAll(" ", "_");
                        if (monsterHrid === action.combatZoneInfo.fightInfo.bossSpawns[0].combatMonsterHrid) {
                            actionObj = action;
                            break;
                        }
                    }
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
        const itemName = getOriTextFromElement(panel.querySelector("h1.ItemDictionary_title__27cTd"))
            .toLowerCase()
            .replaceAll(" ", "_")
            .replaceAll("'", "");
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
                div.innerHTML = isZH ? "战斗模拟 AmVoidGuy" : "Combat sim AmVoidGuy";
                div.addEventListener("click", () => {
                    window.open("https://amvoidguy.github.io/MWICombatSimulatorTest/dist/index.html", "_blank");
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
                    ? "强化模拟（默认100级强化，4级房子，10级工具，5级手套，究极茶，幸运茶，卖单价收货，无工时费）："
                    : "Enhancement simulator: Default level 100 enhancing, level 4 house, level 10 tool, level 5 gloves, ultra tea, blessed tea, sell order price in, no player time fee"
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
        const effective_level =
            input_data.enhancing_level +
            (input_data.tea_enhancing ? 3 : 0) +
            (input_data.tea_super_enhancing ? 6 : 0) +
            (input_data.tea_ultra_enhancing ? 8 : 0);
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

        enhancing_level: 95, // 人物 Enhancing 技能等级
        laboratory_level: 4, // 房子等级
        enhancer_bonus: 4.64, // 工具提高成功率，0级=3.6，5级=4.03，10级=4.64
        glove_bonus: 11.2, // 手套提高强化速度，0级=10，5级=11.2，10级=12.9

        tea_enhancing: false, // 强化茶
        tea_super_enhancing: false, // 超级强化茶
        tea_ultra_enhancing: true,
        tea_blessed: true, // 祝福茶

        priceAskBidRatio: 1, // 取市场卖单价买单价比例，1=只用卖单价，0=只用买单价
    };

    function getCosts(hrid, price_data) {
        const itemDetailObj = initData_itemDetailMap[hrid];

        // +0本体成本
        const baseCost = getRealisticBaseItemPrice(hrid, price_data);

        // 保护成本
        let minProtectionPrice = null;
        let minProtectionHrid = null;
        let protect_item_hrids =
            itemDetailObj.protectionItemHrids == null
                ? [hrid, "/items/mirror_of_protection"]
                : [hrid, "/items/mirror_of_protection"].concat(itemDetailObj.protectionItemHrids);
        protect_item_hrids.forEach((protection_hrid, i) => {
            const this_cost = getRealisticBaseItemPrice(protection_hrid, price_data);
            if (i === 0) {
                minProtectionPrice = this_cost;
                minProtectionHrid = protection_hrid;
            } else {
                if (this_cost > 0 && (minProtectionPrice < 0 || this_cost < minProtectionPrice)) {
                    minProtectionPrice = this_cost;
                    minProtectionHrid = protection_hrid;
                }
            }
        });

        // 强化材料成本
        const needMap = {};
        let totalNeedPrice = 0;
        for (const need of itemDetailObj.enhancementCosts) {
            const price = getItemMarketPrice(need.itemHrid, price_data);
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

    function getRealisticBaseItemPrice(hrid, price_data) {
        const itemDetailObj = initData_itemDetailMap[hrid];
        const productionCost = getItemProductionCost(itemDetailObj.name, price_data);

        const fullName = initData_itemDetailMap[hrid].name;
        const item_price_data = price_data.market[fullName];
        const ask = item_price_data?.ask;
        const bid = item_price_data?.bid;

        let result = 0;

        if (ask && ask > 0) {
            if (bid && bid > 0) {
                // Both ask and bid.
                if (ask / bid > 1.3) {
                    result = Math.max(bid, productionCost);
                } else {
                    result = ask;
                }
            } else {
                // Only ask.
                if (ask / productionCost > 1.3) {
                    result = productionCost;
                } else {
                    result = Math.max(ask, productionCost);
                }
            }
        } else {
            if (bid && bid > 0) {
                // Only bid.
                result = Math.max(bid, productionCost);
            } else {
                // Neither ask nor bid.
                result = productionCost;
            }
        }

        return result;
    }

    function getItemMarketPrice(hrid, price_data) {
        const fullName = initData_itemDetailMap[hrid].name;
        const item_price_data = price_data.market[fullName];

        // Return 0 if the item does not have neither ask nor bid prices.
        if (!item_price_data || (item_price_data.ask < 0 && item_price_data.bid < 0)) {
            // console.log("getItemMarketPrice() return 0 due to neither ask nor bid prices: " + fullName);
            return 0;
        }

        // Return the other price if the item does not have ask or bid price.
        let ask = item_price_data.ask;
        let bid = item_price_data.bid;
        if (ask > 0 && bid < 0) {
            return ask;
        }
        if (bid > 0 && ask < 0) {
            return bid;
        }

        let final_cost = ask * input_data.priceAskBidRatio + bid * (1 - input_data.priceAskBidRatio);
        return final_cost;
    }

    function getItemProductionCost(itemName, jsonObj) {
        const actionHrid = getActionHridFromItemName(itemName);
        if (!actionHrid || !initData_actionDetailMap[actionHrid]) {
            return -1;
        }

        const inputItems = JSON.parse(JSON.stringify(initData_actionDetailMap[actionHrid].inputItems));
        const upgradedFromItemHrid = initData_actionDetailMap[actionHrid]?.upgradeItemHrid;
        if (upgradedFromItemHrid) {
            inputItems.push({ itemHrid: upgradedFromItemHrid, count: 1 });
        }

        let totalAskPrice = 0;
        let totalBidPrice = 0;
        for (let item of inputItems) {
            const itemDetail = initData_itemDetailMap[item.itemHrid];
            if (!itemDetail) {
                return -1;
            }
            let itemAskPrice = jsonObj?.market[itemDetail.name]?.ask;
            let itemBidPrice = jsonObj?.market[itemDetail.name]?.bid;
            if (itemAskPrice === undefined || itemAskPrice === -1) {
                if (itemBidPrice === undefined || itemBidPrice === -1) {
                    return -1; // Ask和Bid价都没有，返回-1
                }
                itemAskPrice = itemBidPrice;
            }
            if (itemBidPrice === undefined || itemBidPrice === -1) {
                itemBidPrice = itemAskPrice;
            }
            totalAskPrice += itemAskPrice * item.count;
            totalBidPrice += itemBidPrice * item.count;
        }
        return totalAskPrice * input_data.priceAskBidRatio + totalBidPrice * (1 - input_data.priceAskBidRatio);
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
            inputDiv.querySelectorAll(".MarketplacePanel_buttonContainer__vJQud")[2]?.querySelector("div button")?.click();
        } else if (getOriTextFromElement(label.parentElement).toLowerCase().includes("best sell")) {
            inputDiv.querySelectorAll(".MarketplacePanel_buttonContainer__vJQud")[1]?.querySelector("div button")?.click();
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
    let monsters = [];
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

    /* 为 https://amvoidguy.github.io/MWICombatSimulatorTest/ 添加导入按钮 */
    // Parts of code regarding group export are by Ratatatata (https://greasyfork.org/en/scripts/507255).
    function addImportButtonForAmvoidguy() {
        const checkElem = () => {
            const selectedElement = document.querySelector(`button#buttonImportExport`);
            if (selectedElement) {
                clearInterval(timer);
                let button = document.createElement("button");
                selectedElement.parentNode.parentElement.parentElement.insertBefore(button, selectedElement.parentElement.parentElement.nextSibling);
                button.textContent = isZH
                    ? "单人/组队导入(刷新游戏网页更新人物数据)"
                    : "Import solo/group (Refresh game page to update character set)";
                button.style.backgroundColor = "green";
                button.style.padding = "5px";
                button.onclick = function () {
                    console.log("Mooneycalc-Importer: Import button onclick");
                    const getPriceButton = document.querySelector(`button#buttonGetPrices`);
                    if (getPriceButton) {
                        console.log("Click getPriceButton");
                        getPriceButton.click();
                    }
                    importDataForAmvoidguy(button);
                    return false;
                };
            }
        };
        let timer = setInterval(checkElem, 200);
    }

    async function importDataForAmvoidguy(button) {
        const [exportObj, playerIDs, importedPlayerPositions, zone, isZoneDungeon, isParty] = constructGroupExportObj();
        console.log(exportObj);
        console.log(playerIDs);

        document.querySelector(`a#group-combat-tab`).click();
        const importInputElem = document.querySelector(`input#inputSetGroupCombatAll`);
        importInputElem.value = JSON.stringify(exportObj);
        document.querySelector(`button#buttonImportSet`).click();

        document.querySelector(`a#player1-tab`).textContent = playerIDs[0];
        document.querySelector(`a#player2-tab`).textContent = playerIDs[1];
        document.querySelector(`a#player3-tab`).textContent = playerIDs[2];
        document.querySelector(`a#player4-tab`).textContent = playerIDs[3];
        document.querySelector(`a#player5-tab`).textContent = playerIDs[4];

        // Select zone or dungeon
        if (zone) {
            if (isZoneDungeon) {
                document.querySelector(`input#simDungeonToggle`).checked = true;
                document.querySelector(`input#simDungeonToggle`).dispatchEvent(new Event("change"));
                const selectDungeon = document.querySelector(`select#selectDungeon`);
                for (let i = 0; i < selectZone.options.length; i++) {
                    if (selectDungeon.options[i].value === zone) {
                        selectDungeon.options[i].selected = true;
                        break;
                    }
                }
            } else {
                document.querySelector(`input#simDungeonToggle`).checked = false;
                document.querySelector(`input#simDungeonToggle`).dispatchEvent(new Event("change"));
                const selectZone = document.querySelector(`select#selectZone`);
                for (let i = 0; i < selectZone.options.length; i++) {
                    if (selectZone.options[i].value === zone) {
                        selectZone.options[i].selected = true;
                        break;
                    }
                }
            }
        }

        // Select sim players
        for (let i = 0; i < 5; i++) {
            if (importedPlayerPositions[i]) {
                if (document.querySelector(`input#player${i + 1}.form-check-input.player-checkbox`)) {
                    document.querySelector(`input#player${i + 1}.form-check-input.player-checkbox`).checked = true;
                    document.querySelector(`input#player${i + 1}.form-check-input.player-checkbox`).dispatchEvent(new Event("change"));
                }
            } else {
                if (document.querySelector(`input#player${i + 1}.form-check-input.player-checkbox`)) {
                    document.querySelector(`input#player${i + 1}.form-check-input.player-checkbox`).checked = false;
                    document.querySelector(`input#player${i + 1}.form-check-input.player-checkbox`).dispatchEvent(new Event("change"));
                }
            }
        }

        // Input simulation time
        document.querySelector(`input#inputSimulationTime`).value = 24;

        button.textContent = isZH ? "已导入" : "Imported";
        if (!isParty) {
            setTimeout(() => {
                document.querySelector(`button#buttonStartSimulation`).click();
            }, 500);
        }
    }

    function constructGroupExportObj() {
        const characterObj = JSON.parse(GM_getValue("init_character_data", ""));
        const clientObj = JSON.parse(GM_getValue("init_client_data", ""));
        let battleObj = null;
        if (GM_getValue("new_battle", "")) {
            battleObj = JSON.parse(GM_getValue("new_battle", ""));
        }
        // console.log(battleObj);
        const storedProfileList = JSON.parse(GM_getValue("profile_export_list", "[]"));
        // console.log(storedProfileList);

        const BLANK_PLAYER_JSON = `{\"player\":{\"attackLevel\":1,\"magicLevel\":1,\"powerLevel\":1,\"rangedLevel\":1,\"defenseLevel\":1,\"staminaLevel\":1,\"intelligenceLevel\":1,\"equipment\":[]},\"food\":{\"/action_types/combat\":[{\"itemHrid\":\"\"},{\"itemHrid\":\"\"},{\"itemHrid\":\"\"}]},\"drinks\":{\"/action_types/combat\":[{\"itemHrid\":\"\"},{\"itemHrid\":\"\"},{\"itemHrid\":\"\"}]},\"abilities\":[{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"}],\"triggerMap\":{},\"zone\":\"/actions/combat/fly\",\"simulationTime\":\"100\",\"houseRooms\":{\"/house_rooms/dairy_barn\":0,\"/house_rooms/garden\":0,\"/house_rooms/log_shed\":0,\"/house_rooms/forge\":0,\"/house_rooms/workshop\":0,\"/house_rooms/sewing_parlor\":0,\"/house_rooms/kitchen\":0,\"/house_rooms/brewery\":0,\"/house_rooms/laboratory\":0,\"/house_rooms/observatory\":0,\"/house_rooms/dining_room\":0,\"/house_rooms/library\":0,\"/house_rooms/dojo\":0,\"/house_rooms/gym\":0,\"/house_rooms/armory\":0,\"/house_rooms/archery_range\":0,\"/house_rooms/mystical_study\":0}}`;

        const exportObj = {};
        exportObj[1] = BLANK_PLAYER_JSON;
        exportObj[2] = BLANK_PLAYER_JSON;
        exportObj[3] = BLANK_PLAYER_JSON;
        exportObj[4] = BLANK_PLAYER_JSON;
        exportObj[5] = BLANK_PLAYER_JSON;

        let isParty = false;
        const playerIDs = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"];
        const importedPlayerPositions = [false, false, false, false, false];
        let zone = "/actions/combat/fly";
        let isZoneDungeon = false;

        if (!characterObj?.partyInfo?.partySlotMap) {
            exportObj[1] = JSON.stringify(constructSelfPlayerExportObjFromInitCharacterData(characterObj, clientObj));
            playerIDs[0] = characterObj.character.name;
            importedPlayerPositions[0] = true;
            // Zone
            for (const action of characterObj.characterActions) {
                if (action && action.actionHrid.includes("/actions/combat/")) {
                    zone = action.actionHrid;
                    isZoneDungeon = clientObj.actionDetailMap[action.actionHrid]?.combatZoneInfo?.isDungeon;
                    break;
                }
            }
        } else {
            isParty = true;
            let i = 1;
            for (const member of Object.values(characterObj.partyInfo.partySlotMap)) {
                if (member.characterID) {
                    if (member.characterID === characterObj.character.id) {
                        exportObj[i] = JSON.stringify(constructSelfPlayerExportObjFromInitCharacterData(characterObj, clientObj));
                        playerIDs[i - 1] = characterObj.character.name;
                        importedPlayerPositions[i - 1] = true;
                    } else {
                        const profileList = storedProfileList.filter((item) => item.characterID === member.characterID);
                        if (profileList.length !== 1) {
                            console.log("Can not find stored profile for " + member.characterID);
                            playerIDs[i - 1] = isZH ? "需要点开资料" : "Open profile in game";
                            i++;
                            continue;
                        }
                        const profile = profileList[0];

                        const battlePlayerList = battleObj.players.filter((item) => item.character.id === member.characterID);
                        let battlePlayer = null;
                        if (battlePlayerList.length === 1) {
                            battlePlayer = battlePlayerList[0];
                        }

                        exportObj[i] = JSON.stringify(constructPlayerExportObjFromStoredProfile(profile, clientObj, battlePlayer));
                        playerIDs[i - 1] = profile.characterName;
                        importedPlayerPositions[i - 1] = true;
                    }
                }
                i++;
            }

            // Zone
            zone = characterObj.partyInfo?.party?.actionHrid;
            isZoneDungeon = clientObj.actionDetailMap[zone]?.combatZoneInfo?.isDungeon;
        }

        return [exportObj, playerIDs, importedPlayerPositions, zone, isZoneDungeon, isParty];
    }

    function constructSelfPlayerExportObjFromInitCharacterData(characterObj, clientObj) {
        const playerObj = {};
        playerObj.player = {};

        // Levels
        for (const skill of characterObj.characterSkills) {
            if (skill.skillHrid.includes("stamina")) {
                playerObj.player.staminaLevel = skill.level;
            } else if (skill.skillHrid.includes("intelligence")) {
                playerObj.player.intelligenceLevel = skill.level;
            } else if (skill.skillHrid.includes("attack")) {
                playerObj.player.attackLevel = skill.level;
            } else if (skill.skillHrid.includes("power")) {
                playerObj.player.powerLevel = skill.level;
            } else if (skill.skillHrid.includes("defense")) {
                playerObj.player.defenseLevel = skill.level;
            } else if (skill.skillHrid.includes("ranged")) {
                playerObj.player.rangedLevel = skill.level;
            } else if (skill.skillHrid.includes("magic")) {
                playerObj.player.magicLevel = skill.level;
            }
        }

        // Items
        playerObj.player.equipment = [];
        for (const item of characterObj.characterItems) {
            if (!item.itemLocationHrid.includes("/item_locations/inventory")) {
                playerObj.player.equipment.push({
                    itemLocationHrid: item.itemLocationHrid,
                    itemHrid: item.itemHrid,
                    enhancementLevel: item.enhancementLevel,
                });
            }
        }

        // Food
        playerObj.food = {};
        playerObj.food["/action_types/combat"] = [];
        for (const food of characterObj.actionTypeFoodSlotsMap["/action_types/combat"]) {
            if (food) {
                playerObj.food["/action_types/combat"].push({
                    itemHrid: food.itemHrid,
                });
            } else {
                playerObj.food["/action_types/combat"].push({
                    itemHrid: "",
                });
            }
        }

        // Drinks
        playerObj.drinks = {};
        playerObj.drinks["/action_types/combat"] = [];
        for (const drink of characterObj.actionTypeDrinkSlotsMap["/action_types/combat"]) {
            if (drink) {
                playerObj.drinks["/action_types/combat"].push({
                    itemHrid: drink.itemHrid,
                });
            } else {
                playerObj.drinks["/action_types/combat"].push({
                    itemHrid: "",
                });
            }
        }

        // Abilities
        playerObj.abilities = [
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
        ];
        let normalAbillityIndex = 1;
        for (const ability of characterObj.combatUnit.combatAbilities) {
            if (ability && clientObj.abilityDetailMap[ability.abilityHrid].isSpecialAbility) {
                playerObj.abilities[0] = {
                    abilityHrid: ability.abilityHrid,
                    level: ability.level,
                };
            } else if (ability) {
                playerObj.abilities[normalAbillityIndex++] = {
                    abilityHrid: ability.abilityHrid,
                    level: ability.level,
                };
            }
        }

        // TriggerMap
        playerObj.triggerMap = { ...characterObj.abilityCombatTriggersMap, ...characterObj.consumableCombatTriggersMap };

        // HouseRooms
        playerObj.houseRooms = {};
        for (const house of Object.values(characterObj.characterHouseRoomMap)) {
            playerObj.houseRooms[house.houseRoomHrid] = house.level;
        }

        return playerObj;
    }

    function constructPlayerExportObjFromStoredProfile(profile, clientObj, battlePlayer) {
        const playerObj = {};
        playerObj.player = {};

        // Levels
        for (const skill of profile.profile.characterSkills) {
            if (skill.skillHrid.includes("stamina")) {
                playerObj.player.staminaLevel = skill.level;
            } else if (skill.skillHrid.includes("intelligence")) {
                playerObj.player.intelligenceLevel = skill.level;
            } else if (skill.skillHrid.includes("attack")) {
                playerObj.player.attackLevel = skill.level;
            } else if (skill.skillHrid.includes("power")) {
                playerObj.player.powerLevel = skill.level;
            } else if (skill.skillHrid.includes("defense")) {
                playerObj.player.defenseLevel = skill.level;
            } else if (skill.skillHrid.includes("ranged")) {
                playerObj.player.rangedLevel = skill.level;
            } else if (skill.skillHrid.includes("magic")) {
                playerObj.player.magicLevel = skill.level;
            }
        }

        // Items
        playerObj.player.equipment = [];
        if (profile.profile.wearableItemMap) {
            for (const key in profile.profile.wearableItemMap) {
                const item = profile.profile.wearableItemMap[key];
                playerObj.player.equipment.push({
                    itemLocationHrid: item.itemLocationHrid,
                    itemHrid: item.itemHrid,
                    enhancementLevel: item.enhancementLevel,
                });
            }
        }

        // Food and drinks
        playerObj.food = {};
        playerObj.food["/action_types/combat"] = [];
        playerObj.drinks = {};
        playerObj.drinks["/action_types/combat"] = [];

        if (battlePlayer?.combatConsumables) {
            for (const foodOrDrink of battlePlayer.combatConsumables) {
                if (foodOrDrink.itemHrid.includes("coffee")) {
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: foodOrDrink.itemHrid,
                    });
                } else {
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: foodOrDrink.itemHrid,
                    });
                }
            }
        } else {
            // Assume food and drinks based on equipted weapon
            const weapon =
                profile.profile.wearableItemMap &&
                (profile.profile.wearableItemMap["/item_locations/main_hand"]?.itemHrid ||
                    profile.profile.wearableItemMap["/item_locations/two_hand"]?.itemHrid);
            if (weapon) {
                if (weapon.includes("shooter") || weapon.includes("bow")) {
                    // 远程
                    // xp,超远,暴击
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: "/items/wisdom_coffee",
                    });
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: "/items/super_ranged_coffee",
                    });
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: "/items/critical_coffee",
                    });
                    // 2红1蓝
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: "/items/spaceberry_donut",
                    });
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: "/items/spaceberry_cake",
                    });
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: "/items/star_fruit_yogurt",
                    });
                } else if (weapon.includes("boomstick") || weapon.includes("staff")) {
                    // 法师
                    // xp,超魔,吟唱
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: "/items/wisdom_coffee",
                    });
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: "/items/super_magic_coffee",
                    });
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: "/items/channeling_coffee",
                    });
                    // 1红2蓝
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: "/items/spaceberry_cake",
                    });
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: "/items/star_fruit_gummy",
                    });
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: "/items/star_fruit_yogurt",
                    });
                } else if (weapon.includes("bulwark")) {
                    // 双手盾 精暮光
                    // xp,超防,超耐
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: "/items/wisdom_coffee",
                    });
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: "/items/super_defense_coffee",
                    });
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: "/items/super_stamina_coffee",
                    });
                    // 2红1蓝
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: "/items/spaceberry_donut",
                    });
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: "/items/spaceberry_cake",
                    });
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: "/items/star_fruit_yogurt",
                    });
                } else {
                    // 战士
                    // xp,超力,迅捷
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: "/items/wisdom_coffee",
                    });
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: "/items/super_power_coffee",
                    });
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: "/items/swiftness_coffee",
                    });
                    // 2红1蓝
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: "/items/spaceberry_donut",
                    });
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: "/items/spaceberry_cake",
                    });
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: "/items/star_fruit_yogurt",
                    });
                }
            }
        }

        // Abilities
        playerObj.abilities = [
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
        ];
        if (profile.profile.equippedAbilities) {
            let normalAbillityIndex = 1;
            for (const ability of profile.profile.equippedAbilities) {
                if (ability && clientObj.abilityDetailMap[ability.abilityHrid].isSpecialAbility) {
                    playerObj.abilities[0] = {
                        abilityHrid: ability.abilityHrid,
                        level: ability.level,
                    };
                } else if (ability) {
                    playerObj.abilities[normalAbillityIndex++] = {
                        abilityHrid: ability.abilityHrid,
                        level: ability.level,
                    };
                }
            }
        }

        // TriggerMap
        // Ignored. The game does not provide access to other players' trigger settings.

        // HouseRooms
        playerObj.houseRooms = {};
        for (const house of Object.values(profile.profile.characterHouseRoomMap)) {
            playerObj.houseRooms[house.houseRoomHrid] = house.level;
        }

        return playerObj;
    }

    async function observeResultsForAmvoidguy() {
        let resultDiv = document.querySelector(`div.row`)?.querySelectorAll(`div.col-md-5`)?.[2]?.querySelector(`div.row > div.col-md-5`);
        while (!resultDiv) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            resultDiv = document.querySelector(`div.row`)?.querySelectorAll(`div.col-md-5`)?.[2]?.querySelector(`div.row > div.col-md-5`);
        }

        const deathDiv = document.querySelector(`div#simulationResultPlayerDeaths`);
        const expDiv = document.querySelector(`div#simulationResultExperienceGain`);
        const consumeDiv = document.querySelector(`div#simulationResultConsumablesUsed`);
        deathDiv.style.backgroundColor = "#FFEAE9";
        deathDiv.style.color = "black";
        expDiv.style.backgroundColor = "#CDFFDD";
        expDiv.style.color = "black";
        consumeDiv.style.backgroundColor = "#F0F8FF";
        consumeDiv.style.color = "black";

        let div = document.createElement("div");
        div.id = "tillLevel";
        div.style.backgroundColor = "#FFFFE0";
        div.style.color = "black";
        div.textContent = "";
        resultDiv.append(div);

        new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if (mutation.addedNodes.length >= 3) {
                    handleResultForAmvoidguy(mutation.addedNodes, div);
                }
            });
        }).observe(expDiv, { childList: true, subtree: true });
    }

    function handleResultForAmvoidguy(expNodes, parentDiv) {
        let perHourGainExp = {
            stamina: 0,
            intelligence: 0,
            attack: 0,
            power: 0,
            defense: 0,
            ranged: 0,
            magic: 0,
        };

        expNodes.forEach((expNode) => {
            if (getOriTextFromElement(expNode.children[0]).includes("Stamina")) {
                perHourGainExp.stamina = Number(expNode.children[1].textContent);
            } else if (getOriTextFromElement(expNode.children[0]).includes("Intelligence")) {
                perHourGainExp.intelligence = Number(expNode.children[1].textContent);
            } else if (getOriTextFromElement(expNode.children[0]).includes("Attack")) {
                perHourGainExp.attack = Number(expNode.children[1].textContent);
            } else if (getOriTextFromElement(expNode.children[0]).includes("Power")) {
                perHourGainExp.power = Number(expNode.children[1].textContent);
            } else if (getOriTextFromElement(expNode.children[0]).includes("Defense")) {
                perHourGainExp.defense = Number(expNode.children[1].textContent);
            } else if (getOriTextFromElement(expNode.children[0]).includes("Ranged")) {
                perHourGainExp.ranged = Number(expNode.children[1].textContent);
            } else if (getOriTextFromElement(expNode.children[0]).includes("Magic")) {
                perHourGainExp.magic = Number(expNode.children[1].textContent);
            }
        });

        let data = GM_getValue("init_character_data", null);
        let obj = JSON.parse(data);
        if (!obj || !obj.characterSkills || !obj.currentTimestamp) {
            console.error("handleResult no character localstorage");
            return;
        }

        let skillLevels = {};
        for (const skill of obj.characterSkills) {
            if (skill.skillHrid.includes("stamina")) {
                skillLevels.stamina = {};
                skillLevels.stamina.skillName = "Stamina";
                skillLevels.stamina.currentLevel = skill.level;
                skillLevels.stamina.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("intelligence")) {
                skillLevels.intelligence = {};
                skillLevels.intelligence.skillName = "Intelligence";
                skillLevels.intelligence.currentLevel = skill.level;
                skillLevels.intelligence.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("attack")) {
                skillLevels.attack = {};
                skillLevels.attack.skillName = "Attack";
                skillLevels.attack.currentLevel = skill.level;
                skillLevels.attack.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("power")) {
                skillLevels.power = {};
                skillLevels.power.skillName = "Power";
                skillLevels.power.currentLevel = skill.level;
                skillLevels.power.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("defense")) {
                skillLevels.defense = {};
                skillLevels.defense.skillName = "Defense";
                skillLevels.defense.currentLevel = skill.level;
                skillLevels.defense.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("ranged")) {
                skillLevels.ranged = {};
                skillLevels.ranged.skillName = "Ranged";
                skillLevels.ranged.currentLevel = skill.level;
                skillLevels.ranged.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("magic")) {
                skillLevels.magic = {};
                skillLevels.magic.skillName = "Magic";
                skillLevels.magic.currentLevel = skill.level;
                skillLevels.magic.currentExp = skill.experience;
            }
        }

        const skillNamesInOrder = ["stamina", "intelligence", "attack", "power", "defense", "ranged", "magic"];
        let hTMLStr = "";
        for (const skill of skillNamesInOrder) {
            hTMLStr += `<div id="${"inputDiv_" + skill}" style="display: flex; justify-content: flex-end">${skillLevels[skill].skillName}${
                isZH ? "到" : " to level "
            }<input id="${"input_" + skill}" type="number" value="${skillLevels[skill].currentLevel + 1}" min="${
                skillLevels[skill].currentLevel + 1
            }" max="200">${isZH ? "级" : ""}</div>`;
        }

        hTMLStr += `<div id="script_afterDays" style="display: flex; justify-content: flex-end"><input id="script_afterDays_input" type="number" value="1" min="0" max="200">${
            isZH ? "天后" : "days after"
        }</div>`;

        hTMLStr += `<div id="needDiv"></div>`;
        hTMLStr += `<div id="needListDiv"></div>`;
        parentDiv.innerHTML = hTMLStr;

        for (const skill of skillNamesInOrder) {
            const skillDiv = parentDiv.querySelector(`div#${"inputDiv_" + skill}`);
            const skillInput = parentDiv.querySelector(`input#${"input_" + skill}`);
            skillInput.onchange = () => {
                calculateTill(skill, skillInput, skillLevels, parentDiv, perHourGainExp);
            };
            skillInput.addEventListener("keyup", function (evt) {
                calculateTill(skill, skillInput, skillLevels, parentDiv, perHourGainExp);
            });
            skillDiv.onclick = () => {
                calculateTill(skill, skillInput, skillLevels, parentDiv, perHourGainExp);
            };
        }

        const daysAfterDiv = parentDiv.querySelector(`div#script_afterDays`);
        const daysAfterInput = parentDiv.querySelector(`input#script_afterDays_input`);
        daysAfterInput.onchange = () => {
            calculateAfterDays(daysAfterInput, skillLevels, parentDiv, perHourGainExp, skillNamesInOrder);
        };
        daysAfterInput.addEventListener("keyup", function (evt) {
            calculateAfterDays(daysAfterInput, skillLevels, parentDiv, perHourGainExp, skillNamesInOrder);
        });
        daysAfterDiv.onclick = () => {
            calculateAfterDays(daysAfterInput, skillLevels, parentDiv, perHourGainExp, skillNamesInOrder);
        };

        // 提取成本和收益
        const expensesSpan = document.querySelector(`span#expensesSpan`);
        const revenueSpan = document.querySelector(`span#revenueSpan`);
        const profitSpan = document.querySelector(`span#profitPreview`);
        const expenseDiv = document.querySelector(`div#script_expense`);
        const revenueDiv = document.querySelector(`div#script_revenue`);
        if (expenseDiv && expenseDiv) {
            expenseDiv.textContent = expensesSpan.parentNode.textContent;
            revenueDiv.textContent = revenueSpan.parentNode.textContent;
        } else {
            profitSpan.parentNode.insertAdjacentHTML(
                "beforeend",
                `<div id="script_expense" style="background-color: #DCDCDC; color: black;">${expensesSpan.parentNode.textContent}</div><div id="script_revenue" style="background-color: #DCDCDC; color: black;">${revenueSpan.parentNode.textContent}</div>`
            );
        }
    }

    function calculateAfterDays(daysAfterInput, skillLevels, parentDiv, perHourGainExp, skillNamesInOrder) {
        const initData_levelExperienceTable = JSON.parse(GM_getValue("init_client_data", null)).levelExperienceTable;
        const days = Number(daysAfterInput.value);
        parentDiv.querySelector(`div#needDiv`).textContent = `${isZH ? "" : "After"} ${days} ${isZH ? "天后：" : "days: "}`;
        const listDiv = parentDiv.querySelector(`div#needListDiv`);

        let html = "";
        let resultLevels = {};
        for (const skillName of skillNamesInOrder) {
            for (const skill of Object.values(skillLevels)) {
                if (skill.skillName.toLowerCase() === skillName.toLowerCase()) {
                    const exp = skill.currentExp + perHourGainExp[skill.skillName.toLowerCase()] * days * 24;
                    let level = 1;
                    while (initData_levelExperienceTable[level] < exp) {
                        level++;
                    }
                    level--;
                    const minExpAtLevel = initData_levelExperienceTable[level];
                    const maxExpAtLevel = initData_levelExperienceTable[level + 1] - 1;
                    const expSpanInLevel = maxExpAtLevel - minExpAtLevel;
                    const levelPercentage = Number(((exp - minExpAtLevel) / expSpanInLevel) * 100).toFixed(1);
                    resultLevels[skillName.toLowerCase()] = level;
                    html += `<div>${skill.skillName} ${isZH ? "" : "level"} ${level} ${isZH ? "级" : ""} ${levelPercentage}%</div>`;
                    break;
                }
            }
        }
        const combatLevel =
            0.2 * (resultLevels.stamina + resultLevels.intelligence + resultLevels.defense) +
            0.4 * Math.max(0.5 * (resultLevels.attack + resultLevels.power), resultLevels.ranged, resultLevels.magic);
        html += `<div>${isZH ? "战斗等级：" : "Combat level: "} ${combatLevel.toFixed(1)}</div>`;
        listDiv.innerHTML = html;
    }

    function calculateTill(skillName, skillInputElem, skillLevels, parentDiv, perHourGainExp) {
        const initData_levelExperienceTable = JSON.parse(GM_getValue("init_client_data", null)).levelExperienceTable;
        const targetLevel = Number(skillInputElem.value);
        parentDiv.querySelector(`div#needDiv`).textContent = `${skillLevels[skillName].skillName} ${isZH ? "到" : "to level"} ${targetLevel} ${
            isZH ? "级 还需：" : " takes: "
        }`;
        const listDiv = parentDiv.querySelector(`div#needListDiv`);

        const currentLevel = Number(skillLevels[skillName].currentLevel);
        const currentExp = Number(skillLevels[skillName].currentExp);
        if (targetLevel > currentLevel && targetLevel <= 200) {
            if (perHourGainExp[skillName] === 0) {
                listDiv.innerHTML = isZH ? "永远" : "Forever";
            } else {
                let needExp = initData_levelExperienceTable[targetLevel] - currentExp;
                let needHours = needExp / perHourGainExp[skillName];
                let html = "";
                html += `<div>[${hoursToReadableString(needHours)}]</div>`;

                const consumeDivs = document.querySelectorAll(`div#simulationResultConsumablesUsed div.row`);
                for (const elem of consumeDivs) {
                    const conName = elem.children[0].textContent;
                    const conPerHour = Number(elem.children[1].textContent);
                    html += `<div>${conName} ${Number(conPerHour * needHours).toFixed(0)}</div>`;
                }

                listDiv.innerHTML = html;
            }
        } else {
            listDiv.innerHTML = isZH ? "输入错误" : "Input error";
        }
    }

    function hoursToReadableString(hours) {
        const sec = hours * 60 * 60;
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

    function addExportButton(obj) {
        const checkElem = () => {
            const selectedElement = document.querySelector(`div.SharableProfile_overviewTab__W4dCV`);
            if (selectedElement) {
                clearInterval(timer);

                const button = document.createElement("button");
                selectedElement.appendChild(button);
                button.textContent = isZH ? "导出人物到剪贴板" : "Export to clipboard";
                button.style.borderRadius = "5px";
                button.style.height = "30px";
                button.style.backgroundColor = SCRIPT_COLOR_MAIN;
                button.style.color = "black";
                button.style.boxShadow = "none";
                button.style.border = "0px";
                button.onclick = function () {
                    const playerID = obj.profile.characterSkills[0].characterID;
                    const clientObj = JSON.parse(GM_getValue("init_client_data", ""));
                    const battleObj = JSON.parse(GM_getValue("new_battle", ""));
                    const storedProfileList = JSON.parse(GM_getValue("profile_export_list", "[]"));

                    const profileList = storedProfileList.filter((item) => item.characterID === playerID);
                    let profile = null;
                    if (profileList.length !== 1) {
                        console.log("Can not find stored profile for " + playerID);
                        return;
                    }
                    profile = profileList[0];

                    const battlePlayerList = battleObj.players.filter((item) => item.character.id === playerID);
                    let battlePlayer = null;
                    if (battlePlayerList.length === 1) {
                        battlePlayer = battlePlayerList[0];
                    }

                    const exportString = JSON.stringify(constructPlayerExportObjFromStoredProfile(profile, clientObj, battlePlayer));
                    console.log(exportString);
                    navigator.clipboard.writeText(exportString);
                    button.textContent = isZH ? "已复制" : "Copied";
                    return false;
                };
                return false;
            }
        };
        let timer = setInterval(checkElem, 200);
    }
})();
