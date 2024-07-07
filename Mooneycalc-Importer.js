// ==UserScript==
// @name         Mooneycalc-Importer
// @namespace    http://tampermonkey.net/
// @version      5.3
// @description  For the game MilkyWayIdle. This script imports player info to the following websites. https://mooneycalc.vercel.app/, https://mwisim.github.io/.
// @author       bot7420
// @match        https://www.milkywayidle.com/*
// @match        https://mooneycalc.vercel.app/*
// @match        https://mwisim.github.io/*
// @match        http://43.129.194.214:5000/mwisim.github.io
// @match        https://tobytorn.github.io/mwisim.github.io/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    "use strict";
    const userLanguage = navigator.language || navigator.userLanguage;
    const isZH = userLanguage.startsWith("zh");

    if (document.URL.includes("milkywayidle.com")) {
        hookWS();
    } else if (document.URL.includes("mooneycalc.vercel.app")) {
        addImportButton1();
    } else if (document.URL.includes("mwisim.github.io")) {
        addImportButton3();
        observeResults();
    }

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
            console.log(obj);
            GM_setValue("init_character_data", message);
        } else if (obj && obj.type === "init_client_data") {
            console.log(obj);
            GM_setValue("init_client_data", message);
        }
        return message;
    }

    function addImportButton1() {
        const checkElem = () => {
            const selectedElement = document.querySelector(`div[role="tablist"]`);
            if (selectedElement) {
                clearInterval(timer);
                console.log("Mooneycalc-Importer: Found elem");
                let button = document.createElement("button");
                selectedElement.parentNode.insertBefore(button, selectedElement.nextSibling);
                button.textContent = isZH
                    ? "导入人物数据 (刷新游戏网页更新人物数据; 左边Market设置里可以改进货价出货价)"
                    : "Import character settings (Refresh game page to update character settings)";
                button.style.backgroundColor = "green";
                button.style.padding = "5px";
                button.onclick = function () {
                    console.log("Mooneycalc-Importer: Button onclick");
                    importData1(button);
                    return false;
                };
            }
        };
        let timer = setInterval(checkElem, 200);
    }

    async function importData1(button) {
        let data = GM_getValue("init_character_data", "");
        let obj = JSON.parse(data);
        console.log(obj);
        if (!obj || !obj.characterSkills || !obj.currentTimestamp) {
            button.textContent = isZH ? "错误：没有人物数据" : "Error: no character settings found";
            return;
        }

        let ls = constructMooneycalcLocalStorage(obj);
        localStorage.setItem("settings", ls);

        let timestamp = new Date(obj.currentTimestamp).getTime();
        let now = new Date().getTime();
        button.textContent = isZH
            ? "已导入，人物数据更新时间：" + timeReadable(now - timestamp) + " 前"
            : "Imported, updated " + timeReadable(now - timestamp) + " ago";

        await new Promise((r) => setTimeout(r, 500));
        location.reload();
    }

    function constructMooneycalcLocalStorage(obj) {
        const websiteSupportedEquipmentsMap = new Map([
            ["/items/abyssal_essence", true],
            ["/items/advanced_task_ring", true],
            ["/items/amber", true],
            ["/items/amethyst", true],
            ["/items/apple", true],
            ["/items/apple_gummy", true],
            ["/items/apple_yogurt", true],
            ["/items/aqua_arrow", true],
            ["/items/aqua_essence", true],
            ["/items/arabica_coffee_bean", true],
            ["/items/arcane_bow", true],
            ["/items/arcane_crossbow", true],
            ["/items/arcane_fire_staff", true],
            ["/items/arcane_log", true],
            ["/items/arcane_lumber", true],
            ["/items/arcane_nature_staff", true],
            ["/items/arcane_shield", true],
            ["/items/arcane_water_staff", true],
            ["/items/artisan_tea", true],
            ["/items/attack_coffee", true],
            ["/items/azure_boots", true],
            ["/items/azure_brush", true],
            ["/items/azure_buckler", true],
            ["/items/azure_bulwark", true],
            ["/items/azure_cheese", true],
            ["/items/azure_chisel", true],
            ["/items/azure_enhancer", true],
            ["/items/azure_gauntlets", true],
            ["/items/azure_hammer", true],
            ["/items/azure_hatchet", true],
            ["/items/azure_helmet", true],
            ["/items/azure_mace", true],
            ["/items/azure_milk", true],
            ["/items/azure_needle", true],
            ["/items/azure_plate_body", true],
            ["/items/azure_plate_legs", true],
            ["/items/azure_pot", true],
            ["/items/azure_shears", true],
            ["/items/azure_spatula", true],
            ["/items/azure_spear", true],
            ["/items/azure_sword", true],
            ["/items/bag_of_10_cowbells", true],
            ["/items/bamboo_boots", true],
            ["/items/bamboo_branch", true],
            ["/items/bamboo_fabric", true],
            ["/items/bamboo_gloves", true],
            ["/items/bamboo_hat", true],
            ["/items/bamboo_robe_bottoms", true],
            ["/items/bamboo_robe_top", true],
            ["/items/basic_task_ring", true],
            ["/items/bear_essence", true],
            ["/items/beast_boots", true],
            ["/items/beast_bracers", true],
            ["/items/beast_chaps", true],
            ["/items/beast_hide", true],
            ["/items/beast_hood", true],
            ["/items/beast_leather", true],
            ["/items/beast_tunic", true],
            ["/items/berserk", true],
            ["/items/birch_bow", true],
            ["/items/birch_crossbow", true],
            ["/items/birch_fire_staff", true],
            ["/items/birch_log", true],
            ["/items/birch_lumber", true],
            ["/items/birch_nature_staff", true],
            ["/items/birch_shield", true],
            ["/items/birch_water_staff", true],
            ["/items/black_bear_fluff", true],
            ["/items/black_bear_shoes", true],
            ["/items/black_tea_leaf", true],
            ["/items/blackberry", true],
            ["/items/blackberry_cake", true],
            ["/items/blackberry_donut", true],
            ["/items/blessed_tea", true],
            ["/items/blueberry", true],
            ["/items/blueberry_cake", true],
            ["/items/blueberry_donut", true],
            ["/items/brewing_tea", true],
            ["/items/burble_boots", true],
            ["/items/burble_brush", true],
            ["/items/burble_buckler", true],
            ["/items/burble_bulwark", true],
            ["/items/burble_cheese", true],
            ["/items/burble_chisel", true],
            ["/items/burble_enhancer", true],
            ["/items/burble_gauntlets", true],
            ["/items/burble_hammer", true],
            ["/items/burble_hatchet", true],
            ["/items/burble_helmet", true],
            ["/items/burble_mace", true],
            ["/items/burble_milk", true],
            ["/items/burble_needle", true],
            ["/items/burble_plate_body", true],
            ["/items/burble_plate_legs", true],
            ["/items/burble_pot", true],
            ["/items/burble_shears", true],
            ["/items/burble_spatula", true],
            ["/items/burble_spear", true],
            ["/items/burble_sword", true],
            ["/items/burble_tea_leaf", true],
            ["/items/cedar_bow", true],
            ["/items/cedar_crossbow", true],
            ["/items/cedar_fire_staff", true],
            ["/items/cedar_log", true],
            ["/items/cedar_lumber", true],
            ["/items/cedar_nature_staff", true],
            ["/items/cedar_shield", true],
            ["/items/cedar_water_staff", true],
            ["/items/centaur_boots", true],
            ["/items/centaur_hoof", true],
            ["/items/channeling_coffee", true],
            ["/items/cheese", true],
            ["/items/cheese_boots", true],
            ["/items/cheese_brush", true],
            ["/items/cheese_buckler", true],
            ["/items/cheese_bulwark", true],
            ["/items/cheese_chisel", true],
            ["/items/cheese_enhancer", true],
            ["/items/cheese_gauntlets", true],
            ["/items/cheese_hammer", true],
            ["/items/cheese_hatchet", true],
            ["/items/cheese_helmet", true],
            ["/items/cheese_mace", true],
            ["/items/cheese_needle", true],
            ["/items/cheese_plate_body", true],
            ["/items/cheese_plate_legs", true],
            ["/items/cheese_pot", true],
            ["/items/cheese_shears", true],
            ["/items/cheese_spatula", true],
            ["/items/cheese_spear", true],
            ["/items/cheese_sword", true],
            ["/items/cheesesmithing_tea", true],
            ["/items/chrono_gloves", true],
            ["/items/chrono_sphere", true],
            ["/items/cleave", true],
            ["/items/cocoon", true],
            ["/items/coin", true],
            ["/items/collectors_boots", true],
            ["/items/colossus_core", true],
            ["/items/colossus_plate_body", true],
            ["/items/colossus_plate_legs", true],
            ["/items/cooking_tea", true],
            ["/items/cotton", true],
            ["/items/cotton_boots", true],
            ["/items/cotton_fabric", true],
            ["/items/cotton_gloves", true],
            ["/items/cotton_hat", true],
            ["/items/cotton_robe_bottoms", true],
            ["/items/cotton_robe_top", true],
            ["/items/cowbell", true],
            ["/items/crab_pincer", true],
            ["/items/crafting_tea", true],
            ["/items/crimson_boots", true],
            ["/items/crimson_brush", true],
            ["/items/crimson_buckler", true],
            ["/items/crimson_bulwark", true],
            ["/items/crimson_cheese", true],
            ["/items/crimson_chisel", true],
            ["/items/crimson_enhancer", true],
            ["/items/crimson_gauntlets", true],
            ["/items/crimson_hammer", true],
            ["/items/crimson_hatchet", true],
            ["/items/crimson_helmet", true],
            ["/items/crimson_mace", true],
            ["/items/crimson_milk", true],
            ["/items/crimson_needle", true],
            ["/items/crimson_plate_body", true],
            ["/items/crimson_plate_legs", true],
            ["/items/crimson_pot", true],
            ["/items/crimson_shears", true],
            ["/items/crimson_spatula", true],
            ["/items/crimson_spear", true],
            ["/items/crimson_sword", true],
            ["/items/critical_coffee", true],
            ["/items/crushed_amber", true],
            ["/items/crushed_amethyst", true],
            ["/items/crushed_garnet", true],
            ["/items/crushed_jade", true],
            ["/items/crushed_moonstone", true],
            ["/items/crushed_pearl", true],
            ["/items/cupcake", true],
            ["/items/defense_coffee", true],
            ["/items/demonic_core", true],
            ["/items/demonic_plate_body", true],
            ["/items/demonic_plate_legs", true],
            ["/items/donut", true],
            ["/items/dragon_fruit", true],
            ["/items/dragon_fruit_gummy", true],
            ["/items/dragon_fruit_yogurt", true],
            ["/items/earrings_of_armor", true],
            ["/items/earrings_of_gathering", true],
            ["/items/earrings_of_rare_find", true],
            ["/items/earrings_of_regeneration", true],
            ["/items/earrings_of_resistance", true],
            ["/items/efficiency_tea", true],
            ["/items/egg", true],
            ["/items/elemental_affinity", true],
            ["/items/elusiveness", true],
            ["/items/emp_tea_leaf", true],
            ["/items/enchanted_gloves", true],
            ["/items/enhancing_tea", true],
            ["/items/entangle", true],
            ["/items/excelsa_coffee_bean", true],
            ["/items/expert_task_ring", true],
            ["/items/eye_of_the_watcher", true],
            ["/items/eye_watch", true],
            ["/items/eyessence", true],
            ["/items/fieriosa_coffee_bean", true],
            ["/items/fighter_necklace", true],
            ["/items/fireball", true],
            ["/items/firestorm", true],
            ["/items/flame_arrow", true],
            ["/items/flame_blast", true],
            ["/items/flaming_cloth", true],
            ["/items/flaming_robe_bottoms", true],
            ["/items/flaming_robe_top", true],
            ["/items/flax", true],
            ["/items/fluffy_red_hat", true],
            ["/items/foraging_tea", true],
            ["/items/frenzy", true],
            ["/items/frost_sphere", true],
            ["/items/frost_staff", true],
            ["/items/frost_surge", true],
            ["/items/garnet", true],
            ["/items/gathering_tea", true],
            ["/items/gator_vest", true],
            ["/items/giant_pouch", true],
            ["/items/ginkgo_bow", true],
            ["/items/ginkgo_crossbow", true],
            ["/items/ginkgo_fire_staff", true],
            ["/items/ginkgo_log", true],
            ["/items/ginkgo_lumber", true],
            ["/items/ginkgo_nature_staff", true],
            ["/items/ginkgo_shield", true],
            ["/items/ginkgo_water_staff", true],
            ["/items/gobo_boomstick", true],
            ["/items/gobo_boots", true],
            ["/items/gobo_bracers", true],
            ["/items/gobo_chaps", true],
            ["/items/gobo_defender", true],
            ["/items/gobo_essence", true],
            ["/items/gobo_hide", true],
            ["/items/gobo_hood", true],
            ["/items/gobo_leather", true],
            ["/items/gobo_rag", true],
            ["/items/gobo_shooter", true],
            ["/items/gobo_slasher", true],
            ["/items/gobo_smasher", true],
            ["/items/gobo_stabber", true],
            ["/items/gobo_tunic", true],
            ["/items/goggles", true],
            ["/items/golem_essence", true],
            ["/items/gourmet_tea", true],
            ["/items/granite_bludgeon", true],
            ["/items/green_tea_leaf", true],
            ["/items/grizzly_bear_fluff", true],
            ["/items/grizzly_bear_shoes", true],
            ["/items/gummy", true],
            ["/items/heal", true],
            ["/items/holy_boots", true],
            ["/items/holy_brush", true],
            ["/items/holy_buckler", true],
            ["/items/holy_bulwark", true],
            ["/items/holy_cheese", true],
            ["/items/holy_chisel", true],
            ["/items/holy_enhancer", true],
            ["/items/holy_gauntlets", true],
            ["/items/holy_hammer", true],
            ["/items/holy_hatchet", true],
            ["/items/holy_helmet", true],
            ["/items/holy_mace", true],
            ["/items/holy_milk", true],
            ["/items/holy_needle", true],
            ["/items/holy_plate_body", true],
            ["/items/holy_plate_legs", true],
            ["/items/holy_pot", true],
            ["/items/holy_shears", true],
            ["/items/holy_spatula", true],
            ["/items/holy_spear", true],
            ["/items/holy_sword", true],
            ["/items/ice_spear", true],
            ["/items/icy_cloth", true],
            ["/items/icy_robe_bottoms", true],
            ["/items/icy_robe_top", true],
            ["/items/infernal_battlestaff", true],
            ["/items/infernal_ember", true],
            ["/items/intelligence_coffee", true],
            ["/items/jade", true],
            ["/items/jungle_essence", true],
            ["/items/large_artisans_crate", true],
            ["/items/large_meteorite_cache", true],
            ["/items/large_pouch", true],
            ["/items/large_treasure_chest", true],
            ["/items/liberica_coffee_bean", true],
            ["/items/linen_boots", true],
            ["/items/linen_fabric", true],
            ["/items/linen_gloves", true],
            ["/items/linen_hat", true],
            ["/items/linen_robe_bottoms", true],
            ["/items/linen_robe_top", true],
            ["/items/living_granite", true],
            ["/items/log", true],
            ["/items/lucky_coffee", true],
            ["/items/lumber", true],
            ["/items/luna_robe_bottoms", true],
            ["/items/luna_robe_top", true],
            ["/items/luna_wing", true],
            ["/items/magic_coffee", true],
            ["/items/magnet", true],
            ["/items/magnetic_gloves", true],
            ["/items/magnifying_glass", true],
            ["/items/maim", true],
            ["/items/marine_chaps", true],
            ["/items/marine_scale", true],
            ["/items/marine_tunic", true],
            ["/items/marsberry", true],
            ["/items/marsberry_cake", true],
            ["/items/marsberry_donut", true],
            ["/items/medium_artisans_crate", true],
            ["/items/medium_meteorite_cache", true],
            ["/items/medium_pouch", true],
            ["/items/medium_treasure_chest", true],
            ["/items/milk", true],
            ["/items/milking_tea", true],
            ["/items/minor_heal", true],
            ["/items/mirror_of_protection", true],
            ["/items/mooberry", true],
            ["/items/mooberry_cake", true],
            ["/items/mooberry_donut", true],
            ["/items/moolong_tea_leaf", true],
            ["/items/moonstone", true],
            ["/items/natures_veil", true],
            ["/items/necklace_of_efficiency", true],
            ["/items/necklace_of_wisdom", true],
            ["/items/orange", true],
            ["/items/orange_gummy", true],
            ["/items/orange_yogurt", true],
            ["/items/panda_fluff", true],
            ["/items/panda_gloves", true],
            ["/items/peach", true],
            ["/items/peach_gummy", true],
            ["/items/peach_yogurt", true],
            ["/items/pearl", true],
            ["/items/pierce", true],
            ["/items/pincer_gloves", true],
            ["/items/plum", true],
            ["/items/plum_gummy", true],
            ["/items/plum_yogurt", true],
            ["/items/poke", true],
            ["/items/polar_bear_fluff", true],
            ["/items/polar_bear_shoes", true],
            ["/items/power_coffee", true],
            ["/items/precision", true],
            ["/items/processing_tea", true],
            ["/items/puncture", true],
            ["/items/purpleheart_bow", true],
            ["/items/purpleheart_crossbow", true],
            ["/items/purpleheart_fire_staff", true],
            ["/items/purpleheart_log", true],
            ["/items/purpleheart_lumber", true],
            ["/items/purpleheart_nature_staff", true],
            ["/items/purpleheart_shield", true],
            ["/items/purpleheart_water_staff", true],
            ["/items/purples_gift", true],
            ["/items/quick_shot", true],
            ["/items/radiant_boots", true],
            ["/items/radiant_fabric", true],
            ["/items/radiant_fiber", true],
            ["/items/radiant_gloves", true],
            ["/items/radiant_hat", true],
            ["/items/radiant_robe_bottoms", true],
            ["/items/radiant_robe_top", true],
            ["/items/rain_of_arrows", true],
            ["/items/rainbow_boots", true],
            ["/items/rainbow_brush", true],
            ["/items/rainbow_buckler", true],
            ["/items/rainbow_bulwark", true],
            ["/items/rainbow_cheese", true],
            ["/items/rainbow_chisel", true],
            ["/items/rainbow_enhancer", true],
            ["/items/rainbow_gauntlets", true],
            ["/items/rainbow_hammer", true],
            ["/items/rainbow_hatchet", true],
            ["/items/rainbow_helmet", true],
            ["/items/rainbow_mace", true],
            ["/items/rainbow_milk", true],
            ["/items/rainbow_needle", true],
            ["/items/rainbow_plate_body", true],
            ["/items/rainbow_plate_legs", true],
            ["/items/rainbow_pot", true],
            ["/items/rainbow_shears", true],
            ["/items/rainbow_spatula", true],
            ["/items/rainbow_spear", true],
            ["/items/rainbow_sword", true],
            ["/items/ranged_coffee", true],
            ["/items/ranger_necklace", true],
            ["/items/red_chefs_hat", true],
            ["/items/red_panda_fluff", true],
            ["/items/red_tea_leaf", true],
            ["/items/redwood_bow", true],
            ["/items/redwood_crossbow", true],
            ["/items/redwood_fire_staff", true],
            ["/items/redwood_log", true],
            ["/items/redwood_lumber", true],
            ["/items/redwood_nature_staff", true],
            ["/items/redwood_shield", true],
            ["/items/redwood_water_staff", true],
            ["/items/reptile_boots", true],
            ["/items/reptile_bracers", true],
            ["/items/reptile_chaps", true],
            ["/items/reptile_hide", true],
            ["/items/reptile_hood", true],
            ["/items/reptile_leather", true],
            ["/items/reptile_tunic", true],
            ["/items/revenant_anima", true],
            ["/items/revenant_chaps", true],
            ["/items/revenant_tunic", true],
            ["/items/ring_of_armor", true],
            ["/items/ring_of_gathering", true],
            ["/items/ring_of_rare_find", true],
            ["/items/ring_of_regeneration", true],
            ["/items/ring_of_resistance", true],
            ["/items/robusta_coffee_bean", true],
            ["/items/rough_boots", true],
            ["/items/rough_bracers", true],
            ["/items/rough_chaps", true],
            ["/items/rough_hide", true],
            ["/items/rough_hood", true],
            ["/items/rough_leather", true],
            ["/items/rough_tunic", true],
            ["/items/scratch", true],
            ["/items/shard_of_protection", true],
            ["/items/shoebill_feather", true],
            ["/items/shoebill_shoes", true],
            ["/items/sighted_bracers", true],
            ["/items/silencing_shot", true],
            ["/items/silk_boots", true],
            ["/items/silk_fabric", true],
            ["/items/silk_gloves", true],
            ["/items/silk_hat", true],
            ["/items/silk_robe_bottoms", true],
            ["/items/silk_robe_top", true],
            ["/items/smack", true],
            ["/items/small_artisans_crate", true],
            ["/items/small_meteorite_cache", true],
            ["/items/small_pouch", true],
            ["/items/small_treasure_chest", true],
            ["/items/snail_shell", true],
            ["/items/snail_shell_helmet", true],
            ["/items/snake_fang", true],
            ["/items/snake_fang_dirk", true],
            ["/items/sorcerer_boots", true],
            ["/items/sorcerer_essence", true],
            ["/items/sorcerers_sole", true],
            ["/items/soul_fragment", true],
            ["/items/soul_hunter_crossbow", true],
            ["/items/spaceberry", true],
            ["/items/spaceberry_cake", true],
            ["/items/spaceberry_donut", true],
            ["/items/spacia_coffee_bean", true],
            ["/items/spike_shell", true],
            ["/items/spiked_bulwark", true],
            ["/items/stalactite_shard", true],
            ["/items/stalactite_spear", true],
            ["/items/stamina_coffee", true],
            ["/items/star_fragment", true],
            ["/items/star_fruit", true],
            ["/items/star_fruit_gummy", true],
            ["/items/star_fruit_yogurt", true],
            ["/items/steady_shot", true],
            ["/items/strawberry", true],
            ["/items/strawberry_cake", true],
            ["/items/strawberry_donut", true],
            ["/items/stunning_blow", true],
            ["/items/sugar", true],
            ["/items/super_attack_coffee", true],
            ["/items/super_brewing_tea", true],
            ["/items/super_cheesesmithing_tea", true],
            ["/items/super_cooking_tea", true],
            ["/items/super_crafting_tea", true],
            ["/items/super_defense_coffee", true],
            ["/items/super_enhancing_tea", true],
            ["/items/super_foraging_tea", true],
            ["/items/super_intelligence_coffee", true],
            ["/items/super_magic_coffee", true],
            ["/items/super_milking_tea", true],
            ["/items/super_power_coffee", true],
            ["/items/super_ranged_coffee", true],
            ["/items/super_stamina_coffee", true],
            ["/items/super_tailoring_tea", true],
            ["/items/super_woodcutting_tea", true],
            ["/items/swamp_essence", true],
            ["/items/sweep", true],
            ["/items/swiftness_coffee", true],
            ["/items/tailoring_tea", true],
            ["/items/task_crystal", true],
            ["/items/task_token", true],
            ["/items/tome_of_healing", true],
            ["/items/tome_of_the_elements", true],
            ["/items/toughness", true],
            ["/items/toxic_pollen", true],
            ["/items/treant_bark", true],
            ["/items/treant_shield", true],
            ["/items/turtle_shell", true],
            ["/items/turtle_shell_body", true],
            ["/items/turtle_shell_legs", true],
            ["/items/twilight_essence", true],
            ["/items/umbral_boots", true],
            ["/items/umbral_bracers", true],
            ["/items/umbral_chaps", true],
            ["/items/umbral_hide", true],
            ["/items/umbral_hood", true],
            ["/items/umbral_leather", true],
            ["/items/umbral_tunic", true],
            ["/items/vampire_fang", true],
            ["/items/vampire_fang_dirk", true],
            ["/items/vampiric_bow", true],
            ["/items/vampirism", true],
            ["/items/verdant_boots", true],
            ["/items/verdant_brush", true],
            ["/items/verdant_buckler", true],
            ["/items/verdant_bulwark", true],
            ["/items/verdant_cheese", true],
            ["/items/verdant_chisel", true],
            ["/items/verdant_enhancer", true],
            ["/items/verdant_gauntlets", true],
            ["/items/verdant_hammer", true],
            ["/items/verdant_hatchet", true],
            ["/items/verdant_helmet", true],
            ["/items/verdant_mace", true],
            ["/items/verdant_milk", true],
            ["/items/verdant_needle", true],
            ["/items/verdant_plate_body", true],
            ["/items/verdant_plate_legs", true],
            ["/items/verdant_pot", true],
            ["/items/verdant_shears", true],
            ["/items/verdant_spatula", true],
            ["/items/verdant_spear", true],
            ["/items/verdant_sword", true],
            ["/items/vision_helmet", true],
            ["/items/vision_shield", true],
            ["/items/watchful_relic", true],
            ["/items/water_strike", true],
            ["/items/werewolf_claw", true],
            ["/items/werewolf_slasher", true],
            ["/items/wheat", true],
            ["/items/wisdom_coffee", true],
            ["/items/wisdom_tea", true],
            ["/items/wizard_necklace", true],
            ["/items/woodcutting_tea", true],
            ["/items/wooden_bow", true],
            ["/items/wooden_crossbow", true],
            ["/items/wooden_fire_staff", true],
            ["/items/wooden_nature_staff", true],
            ["/items/wooden_shield", true],
            ["/items/wooden_water_staff", true],
            ["/items/yogurt", true],
        ]);

        const ls = localStorage.getItem("settings");
        let lsObj = JSON.parse(ls);

        // 人物技能等级
        lsObj.state.settings.levels = {};
        for (const skill of obj.characterSkills) {
            lsObj.state.settings.levels[skill.skillHrid] = skill.level;
        }

        // 社区全局buff
        lsObj.state.settings.communityBuffs = {};
        for (const buff of obj.communityBuffs) {
            lsObj.state.settings.communityBuffs[buff.hrid] = buff.level;
        }

        // 装备 & 装备强化等级
        lsObj.state.settings.equipment = {};
        lsObj.state.settings.equipmentLevels = {};
        for (const item of obj.characterItems) {
            if (item.itemLocationHrid !== "/item_locations/inventory" && websiteSupportedEquipmentsMap.has(item.itemHrid)) {
                lsObj.state.settings.equipment[item.itemLocationHrid.replace("item_locations", "equipment_types")] = item.itemHrid;
                lsObj.state.settings.equipmentLevels[item.itemLocationHrid.replace("item_locations", "equipment_types")] = item.enhancementLevel;
            }
        }

        // 房子
        lsObj.state.settings.houseRooms = {};
        for (const house of Object.values(obj.characterHouseRoomMap)) {
            lsObj.state.settings.houseRooms[house.houseRoomHrid] = house.level;
        }

        return JSON.stringify(lsObj);
    }

    function timeReadable(ms) {
        const d = new Date(1000 * Math.round(ms / 1000));
        function pad(i) {
            return ("0" + i).slice(-2);
        }
        let str = d.getUTCHours() + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds());
        console.log("Mooneycalc-Importer: " + str);
        return str;
    }

    function addImportButton3() {
        const checkElem = () => {
            const selectedElement = document.querySelector(`button#buttonImportExport`);
            if (selectedElement) {
                clearInterval(timer);
                console.log("Mooneycalc-Importer: Found elem");
                let button = document.createElement("button");
                selectedElement.parentNode.parentElement.parentElement.insertBefore(button, selectedElement.parentElement.parentElement.nextSibling);
                button.textContent = isZH
                    ? "导入人物数据(刷新游戏网页更新人物数据)"
                    : "Import character settings (Refresh game page to update character settings)";
                button.style.backgroundColor = "green";
                button.style.padding = "5px";
                button.onclick = function () {
                    console.log("Mooneycalc-Importer: Button onclick");
                    const getPriceButton = document.querySelector(`button#buttonGetPrices`);
                    if (getPriceButton) {
                        console.log("Click getPriceButton");
                        getPriceButton.click();
                    }
                    importData3(button);
                    return false;
                };
            }
        };
        let timer = setInterval(checkElem, 200);
    }

    async function importData3(button) {
        let data = GM_getValue("init_character_data", "");
        let obj = JSON.parse(data);
        console.log(obj);
        if (!obj || !obj.characterSkills || !obj.currentTimestamp) {
            button.textContent = isZH ? "错误：没有人物数据" : "Error: no character settings found";
            return;
        }

        let jsonObj = constructImportJsonObj(obj);
        console.log(jsonObj);
        const importInputElem = document.querySelector(`input#inputSet`);
        importInputElem.value = JSON.stringify(jsonObj);
        document.querySelector(`button#buttonImportSet`).click();

        let timestamp = new Date(obj.currentTimestamp).getTime();
        let now = new Date().getTime();
        button.textContent = isZH
            ? "已导入，人物数据更新时间：" + timeReadable(now - timestamp) + " 前"
            : "Imported, updated " + timeReadable(now - timestamp) + " ago";

        if (document.URL.includes(`//mwisim.github.io/`)) {
            setTimeout(() => {
                document.querySelector(`button#buttonStartSimulation`).click();
            }, 500);
        }
    }

    function constructImportJsonObj(obj) {
        let clientObj = JSON.parse(GM_getValue("init_client_data", ""));

        let exportObj = {};

        exportObj.player = {};
        // Levels
        for (const skill of obj.characterSkills) {
            if (skill.skillHrid.includes("stamina")) {
                exportObj.player.staminaLevel = skill.level;
            } else if (skill.skillHrid.includes("intelligence")) {
                exportObj.player.intelligenceLevel = skill.level;
            } else if (skill.skillHrid.includes("attack")) {
                exportObj.player.attackLevel = skill.level;
            } else if (skill.skillHrid.includes("power")) {
                exportObj.player.powerLevel = skill.level;
            } else if (skill.skillHrid.includes("defense")) {
                exportObj.player.defenseLevel = skill.level;
            } else if (skill.skillHrid.includes("ranged")) {
                exportObj.player.rangedLevel = skill.level;
            } else if (skill.skillHrid.includes("magic")) {
                exportObj.player.magicLevel = skill.level;
            }
        }
        // Items
        exportObj.player.equipment = [];
        for (const item of obj.characterItems) {
            if (!item.itemLocationHrid.includes("/item_locations/inventory")) {
                exportObj.player.equipment.push({
                    itemLocationHrid: item.itemLocationHrid,
                    itemHrid: item.itemHrid,
                    enhancementLevel: item.enhancementLevel,
                });
            }
        }

        // Food
        exportObj.food = {};
        exportObj.food["/action_types/combat"] = [];
        for (const food of obj.actionTypeFoodSlotsMap["/action_types/combat"]) {
            if (food) {
                exportObj.food["/action_types/combat"].push({
                    itemHrid: food.itemHrid,
                });
            } else {
                exportObj.food["/action_types/combat"].push({
                    itemHrid: "",
                });
            }
        }

        // Drinks
        exportObj.drinks = {};
        exportObj.drinks["/action_types/combat"] = [];
        for (const drink of obj.actionTypeDrinkSlotsMap["/action_types/combat"]) {
            if (drink) {
                exportObj.drinks["/action_types/combat"].push({
                    itemHrid: drink.itemHrid,
                });
            } else {
                exportObj.drinks["/action_types/combat"].push({
                    itemHrid: "",
                });
            }
        }

        // Abilities
        exportObj.abilities = [
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
        for (const ability of obj.combatUnit.combatAbilities) {
            if (ability && clientObj.abilityDetailMap[ability.abilityHrid].isSpecialAbility) {
                exportObj.abilities[0] = {
                    abilityHrid: ability.abilityHrid,
                    level: ability.level,
                };
            } else if (ability) {
                exportObj.abilities[normalAbillityIndex++] = {
                    abilityHrid: ability.abilityHrid,
                    level: ability.level,
                };
            }
        }

        // TriggerMap
        exportObj.triggerMap = { ...obj.abilityCombatTriggersMap, ...obj.consumableCombatTriggersMap };

        // Zone
        let hasMap = false;
        for (const action of obj.characterActions) {
            if (
                action &&
                action.actionHrid.includes("/actions/combat/") &&
                !clientObj.actionDetailMap[action.actionHrid]?.combatZoneInfo?.isDungeon
            ) {
                hasMap = true;
                exportObj.zone = action.actionHrid;
                break;
            }
        }
        if (!hasMap) {
            exportObj.zone = "/actions/combat/fly";
        }

        // SimulationTime
        exportObj.simulationTime = "24";

        // HouseRooms
        exportObj.houseRooms = {};
        for (const house of Object.values(obj.characterHouseRoomMap)) {
            exportObj.houseRooms[house.houseRoomHrid] = house.level;
        }

        return exportObj;
    }

    async function observeResults() {
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
                    handleResult(mutation.addedNodes, div);
                }
            });
        }).observe(expDiv, { childList: true, subtree: true });
    }

    function handleResult(expNodes, parentDiv) {
        let perHourGainExp = {
            stamina: 0,
            intelligence: 0,
            attack: 0,
            power: 0,
            defense: 0,
            ranged: 0,
            magic: 0,
        };

        expNodes.forEach((expNodes) => {
            if (expNodes.textContent.includes("Stamina")) {
                perHourGainExp.stamina = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Intelligence")) {
                perHourGainExp.intelligence = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Attack")) {
                perHourGainExp.attack = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Power")) {
                perHourGainExp.power = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Defense")) {
                perHourGainExp.defense = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Ranged")) {
                perHourGainExp.ranged = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Magic")) {
                perHourGainExp.magic = Number(expNodes.children[1].textContent);
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
})();
