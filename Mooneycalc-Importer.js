// ==UserScript==
// @name         Mooneycalc-Importer
// @namespace    http://tampermonkey.net/
// @version      4.8
// @description  For the game MilkyWayIdle. This script imports player info to the following websites. https://mooneycalc.vercel.app/, https://mwisim.github.io/.
// @author       bot7420
// @match        https://www.milkywayidle.com/*
// @match        https://mooneycalc.vercel.app/*
// @match        https://mwisim.github.io/*
// @match        http://43.129.194.214:5000/mwisim.github.io
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
