// ==UserScript==
// @name         Mooneycalc-Importer
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  For the game MilkyWayIdle, https://mooneycalc.vercel.app/, and https://kugandev.github.io/MWICombatSimulator/ (deprecated), and https://mwisim.github.io/. This script imports player info to the websites.
// @author       bot7420
// @match        https://www.milkywayidle.com/*
// @match        https://mooneycalc.vercel.app/*
// @match        https://kugandev.github.io/MWICombatSimulator/*
// @match        https://mwisim.github.io/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    "use strict";

    if (document.URL.includes("milkywayidle.com")) {
        hookWS();
    } else if (document.URL.includes("mooneycalc.vercel.app")) {
        addImportButton1();
    } else if (document.URL.includes("kugandev.github.io/MWICombatSimulator")) {
        addImportButton2();
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
                button.textContent = "导入人物数据 (刷新游戏网页更新人物数据; 左边Market设置里可以改进货价出货价)";
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
            button.textContent = "错误：没有人物数据";
            return;
        }

        let ls = constructMooneycalcLocalStorage(obj);
        localStorage.setItem("settings", ls);

        let timestamp = new Date(obj.currentTimestamp).getTime();
        let now = new Date().getTime();
        button.textContent = "已导入，人物数据更新时间：" + timeReadable(now - timestamp) + " 前";

        await new Promise((r) => setTimeout(r, 500));
        location.reload();
    }

    function constructMooneycalcLocalStorage(obj) {
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
            if (item.itemLocationHrid !== "/item_locations/inventory") {
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

    function addImportButton2() {
        const checkElem = () => {
            const selectedElement = document.querySelector(`button#buttonEquipmentSets`);
            if (selectedElement) {
                clearInterval(timer);
                console.log("Mooneycalc-Importer: Found elem");
                let button = document.createElement("button");
                selectedElement.parentNode.insertBefore(button, selectedElement.nextSibling);
                button.textContent = "导入人物数据 (刷新游戏网页更新人物数据; 不导入所有Trigers)";
                button.style.backgroundColor = "green";
                button.style.padding = "5px";
                button.onclick = function () {
                    console.log("Mooneycalc-Importer: Button onclick");
                    importData2(button);
                    return false;
                };
            }
        };
        let timer = setInterval(checkElem, 200);
    }

    async function importData2(button) {
        let data = GM_getValue("init_character_data", "");
        let obj = JSON.parse(data);
        console.log(obj);
        if (!obj || !obj.characterSkills || !obj.currentTimestamp) {
            button.textContent = "错误：没有人物数据";
            return;
        }

        fillIn2(obj);
        let timestamp = new Date(obj.currentTimestamp).getTime();
        let now = new Date().getTime();
        button.textContent = "已导入，人物数据更新时间：" + timeReadable(now - timestamp) + " 前";
    }

    function fillIn2(obj) {
        // Levels
        for (const skill of obj.characterSkills) {
            if (skill.skillHrid.includes("stamina")) {
                document.querySelector(`input#inputLevel_stamina`).value = skill.level;
            } else if (skill.skillHrid.includes("intelligence")) {
                document.querySelector(`input#inputLevel_intelligence`).value = skill.level;
            } else if (skill.skillHrid.includes("attack")) {
                document.querySelector(`input#inputLevel_attack`).value = skill.level;
            } else if (skill.skillHrid.includes("power")) {
                document.querySelector(`input#inputLevel_power`).value = skill.level;
            } else if (skill.skillHrid.includes("defense")) {
                document.querySelector(`input#inputLevel_defense`).value = skill.level;
            } else if (skill.skillHrid.includes("ranged")) {
                document.querySelector(`input#inputLevel_ranged`).value = skill.level;
            } else if (skill.skillHrid.includes("magic")) {
                document.querySelector(`input#inputLevel_magic`).value = skill.level;
            }
        }
        document.querySelector(`input#inputLevel_stamina`).dispatchEvent(new Event("change"));
        document.querySelector(`input#inputLevel_intelligence`).dispatchEvent(new Event("change"));
        document.querySelector(`input#inputLevel_attack`).dispatchEvent(new Event("change"));
        document.querySelector(`input#inputLevel_power`).dispatchEvent(new Event("change"));
        document.querySelector(`input#inputLevel_defense`).dispatchEvent(new Event("change"));
        document.querySelector(`input#inputLevel_ranged`).dispatchEvent(new Event("change"));
        document.querySelector(`input#inputLevel_magic`).dispatchEvent(new Event("change"));

        // Items
        for (const item of obj.characterItems) {
            if (item.itemLocationHrid.includes("/head")) {
                document.querySelector(`select#selectEquipment_head`).value = item.itemHrid;
                document.querySelector(`input#inputEquipmentEnhancementLevel_head`).value = item.enhancementLevel;
                document.querySelector(`select#selectEquipment_head`).dispatchEvent(new Event("change"));
                document.querySelector(`input#inputEquipmentEnhancementLevel_head`).dispatchEvent(new Event("change"));
            } else if (item.itemLocationHrid.includes("/body")) {
                document.querySelector(`select#selectEquipment_body`).value = item.itemHrid;
                document.querySelector(`input#inputEquipmentEnhancementLevel_body`).value = item.enhancementLevel;
                document.querySelector(`select#selectEquipment_body`).dispatchEvent(new Event("change"));
                document.querySelector(`input#inputEquipmentEnhancementLevel_body`).dispatchEvent(new Event("change"));
            } else if (item.itemLocationHrid.includes("/legs")) {
                document.querySelector(`select#selectEquipment_legs`).value = item.itemHrid;
                document.querySelector(`input#inputEquipmentEnhancementLevel_legs`).value = item.enhancementLevel;
                document.querySelector(`select#selectEquipment_legs`).dispatchEvent(new Event("change"));
                document.querySelector(`input#inputEquipmentEnhancementLevel_legs`).dispatchEvent(new Event("change"));
            } else if (item.itemLocationHrid.includes("/feet")) {
                document.querySelector(`select#selectEquipment_feet`).value = item.itemHrid;
                document.querySelector(`input#inputEquipmentEnhancementLevel_feet`).value = item.enhancementLevel;
                document.querySelector(`select#selectEquipment_feet`).dispatchEvent(new Event("change"));
                document.querySelector(`input#inputEquipmentEnhancementLevel_feet`).dispatchEvent(new Event("change"));
            } else if (item.itemLocationHrid.includes("/hands")) {
                document.querySelector(`select#selectEquipment_hands`).value = item.itemHrid;
                document.querySelector(`input#inputEquipmentEnhancementLevel_hands`).value = item.enhancementLevel;
                document.querySelector(`select#selectEquipment_hands`).dispatchEvent(new Event("change"));
                document.querySelector(`input#inputEquipmentEnhancementLevel_hands`).dispatchEvent(new Event("change"));
            } else if (item.itemLocationHrid.includes("/main_hand")) {
                document.querySelector(`select#selectEquipment_weapon`).value = item.itemHrid;
                document.querySelector(`input#inputEquipmentEnhancementLevel_weapon`).value = item.enhancementLevel;
                document.querySelector(`select#selectEquipment_weapon`).dispatchEvent(new Event("change"));
                document.querySelector(`input#inputEquipmentEnhancementLevel_weapon`).dispatchEvent(new Event("change"));
            } else if (item.itemLocationHrid.includes("/off_hand")) {
                document.querySelector(`select#selectEquipment_off_hand`).value = item.itemHrid;
                document.querySelector(`input#inputEquipmentEnhancementLevel_off_hand`).value = item.enhancementLevel;
                document.querySelector(`select#selectEquipment_off_hand`).dispatchEvent(new Event("change"));
                document.querySelector(`input#inputEquipmentEnhancementLevel_off_hand`).dispatchEvent(new Event("change"));
            } else if (item.itemLocationHrid.includes("/pouch")) {
                document.querySelector(`select#selectEquipment_pouch`).value = item.itemHrid;
                document.querySelector(`input#inputEquipmentEnhancementLevel_pouch`).value = item.enhancementLevel;
                document.querySelector(`select#selectEquipment_pouch`).dispatchEvent(new Event("change"));
                document.querySelector(`input#inputEquipmentEnhancementLevel_pouch`).dispatchEvent(new Event("change"));
            }
        }

        // Food
        let foodIndex = 0;
        for (const food of obj.actionTypeFoodSlotsMap["/action_types/combat"]) {
            if (food) {
                document.querySelector(`select#selectFood_${foodIndex}`).value = food.itemHrid;
                document.querySelector(`select#selectFood_${foodIndex++}`).dispatchEvent(new Event("change"));
            }
        }

        // Drinks
        let drinksIndex = 0;
        for (const drink of obj.actionTypeDrinkSlotsMap["/action_types/combat"]) {
            if (drink) {
                document.querySelector(`select#selectDrink_${drinksIndex}`).value = drink.itemHrid;
                document.querySelector(`select#selectDrink_${drinksIndex++}`).dispatchEvent(new Event("change"));
            }
        }

        // Abilities
        let abilityIndex = 0;
        for (const ability of obj.combatUnit.combatAbilities) {
            if (ability) {
                document.querySelector(`select#selectAbility_${abilityIndex}`).value = ability.abilityHrid;
                document.querySelector(`input#inputAbilityLevel_${abilityIndex}`).value = ability.level;
                document.querySelector(`select#selectAbility_${abilityIndex}`).dispatchEvent(new Event("change"));
                document.querySelector(`input#inputAbilityLevel_${abilityIndex++}`).dispatchEvent(new Event("change"));
            }
        }

        // Zone
        for (const action of obj.characterActions) {
            if (action && action.actionHrid.includes("/actions/combat/")) {
                document.querySelector(`select#selectZone`).value = action.actionHrid;
                document.querySelector(`select#selectZone`).dispatchEvent(new Event("change"));
                break;
            }
        }

        // todo Trigers consumableCombatTriggersMap abilityCombatTriggersMap
    }

    function addImportButton3() {
        const checkElem = () => {
            const selectedElement = document.querySelector(`button#buttonImportExport`);
            if (selectedElement) {
                clearInterval(timer);
                console.log("Mooneycalc-Importer: Found elem");
                let button = document.createElement("button");
                selectedElement.parentNode.parentElement.parentElement.insertBefore(button, selectedElement.parentElement.parentElement.nextSibling);
                button.textContent = "导入人物数据(刷新游戏网页更新人物数据)";
                button.style.backgroundColor = "green";
                button.style.padding = "5px";
                button.onclick = function () {
                    console.log("Mooneycalc-Importer: Button onclick");
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
            button.textContent = "错误：没有人物数据";
            return;
        }

        let jsonObj = constructImportJsonObj(obj);
        console.log(jsonObj);
        const importInputElem = document.querySelector(`input#inputSet`);
        importInputElem.value = JSON.stringify(jsonObj);
        document.querySelector(`button#buttonImportSet`).click();

        let timestamp = new Date(obj.currentTimestamp).getTime();
        let now = new Date().getTime();
        button.textContent = "导入成功。人物数据更新时间：" + timeReadable(now - timestamp) + " 前";

        setTimeout(() => {
            document.querySelector(`button#buttonStartSimulation`).click();
        }, 500);
    }

    function constructImportJsonObj(obj) {
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
        exportObj.abilities = [];
        for (const ability of obj.combatUnit.combatAbilities) {
            if (ability) {
                exportObj.abilities.push({
                    abilityHrid: ability.abilityHrid,
                    level: ability.level,
                });
            }
        }

        // TriggerMap
        exportObj.triggerMap = { ...obj.abilityCombatTriggersMap, ...obj.consumableCombatTriggersMap };

        // Zone
        let hasMap = false;
        for (const action of obj.characterActions) {
            if (action && action.actionHrid.includes("/actions/combat/")) {
                hasMap = true;
                exportObj.zone = action.actionHrid;
                break;
            }
        }
        if (!hasMap) {
            exportObj.zone = "/actions/combat/fly";
        }

        // SimulationTime
        exportObj.simulationTime = "100";

        // HouseRooms
        exportObj.houseRooms = {};
        for (const house of Object.values(obj.characterHouseRoomMap)) {
            exportObj.houseRooms[house.houseRoomHrid] = house.level;
        }

        return exportObj;
    }

    function observeResults() {
        const resultDiv = document.querySelector(`div.row`).querySelectorAll(`div.col-md-5`)[2].querySelector(`div.row > div.col-md-5`);
        const deathDiv = document.querySelector(`div#simulationResultPlayerDeaths`);
        const expDiv = document.querySelector(`div#simulationResultExperienceGain`);
        const consumeDiv = document.querySelector(`div#simulationResultConsumablesUsed`);
        deathDiv.style.backgroundColor = "#FFEAE9";
        expDiv.style.backgroundColor = "#CDFFDD";
        consumeDiv.style.backgroundColor = "#F0F8FF";

        let div = document.createElement("div");
        div.id = "tillLevel";
        div.style.backgroundColor = "#FFFFE0";
        div.textContent = "";
        resultDiv.append(div);

        new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if (mutation.addedNodes.length >= 6) {
                    handleResult(mutation.addedNodes, div);
                }
            });
        }).observe(expDiv, { childList: true, subtree: true });
    }

    function handleResult(expNodes, parentDiv) {
        console.log(expNodes);
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
            hTMLStr += `<div id="${"inputDiv_" + skill}" style="display: flex; justify-content: flex-end">${skillLevels[skill].skillName}到<input id="${"input_" + skill}" type="number" value="${
                skillLevels[skill].currentLevel + 1
            }" min="${skillLevels[skill].currentLevel + 1}" max="200">级</div>`;
        }
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
    }

    function calculateTill(skillName, skillInputElem, skillLevels, parentDiv, perHourGainExp) {
        const initData_levelExperienceTable = JSON.parse(GM_getValue("init_client_data", null)).levelExperienceTable;
        const targetLevel = Number(skillInputElem.value);
        parentDiv.querySelector(`div#needDiv`).textContent = `${skillLevels[skillName].skillName} 到 ${targetLevel} 级 还需：`;
        const listDiv = parentDiv.querySelector(`div#needListDiv`);

        const currentLevel = Number(skillLevels[skillName].currentLevel);
        const currentExp = Number(skillLevels[skillName].currentExp);
        if (targetLevel > currentLevel && targetLevel <= 200) {
            if (perHourGainExp[skillName] === 0) {
                listDiv.innerHTML = "永远";
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
            listDiv.innerHTML = "输入错误";
        }
    }

    function hoursToReadableString(hours) {
        const sec = hours * 60 * 60;
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
})();
