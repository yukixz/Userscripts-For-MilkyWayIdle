// ==UserScript==
// @name         MWITools
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Tools for MilkyWayIdle. Shows total action time. Shows market prices. Shows action number quick inputs. Shows skill exp percentages. Shows total networth.
// @author       bot7420
// @match        https://www.milkywayidle.com/*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @connect      43.129.194.214
// ==/UserScript==

(() => {
    "use strict";

    let initData_characterSkills = null;
    let initData_characterItems = null;
    let initData_characterHouseRoomMap = null;
    let initData_actionTypeDrinkSlotsMap = null;
    let initData_actionDetailMap = null;
    let initData_levelExperienceTable = null;
    let initData_itemDetailMap = null;

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
            console.log(obj.characterItems);
            initData_characterSkills = obj.characterSkills;
            initData_characterItems = obj.characterItems;
            initData_characterHouseRoomMap = obj.characterHouseRoomMap;
            initData_actionTypeDrinkSlotsMap = obj.actionTypeDrinkSlotsMap;
            calculateNetworth();
        } else if (obj && obj.type === "init_client_data") {
            console.log(obj.itemDetailMap);
            initData_actionDetailMap = obj.actionDetailMap;
            initData_levelExperienceTable = obj.levelExperienceTable;
            initData_itemDetailMap = obj.itemDetailMap;
        }
        return message;
    }

    /* 计算Networth */
    async function calculateNetworth() {
        const marketAPIJson = await fetchMarketJSON();
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

        const waitForHeader = () => {
            const targetNode = document.querySelector("div.Header_totalLevel__8LY3Q");
            if (targetNode) {
                targetNode.insertAdjacentHTML("afterend", `<div style="text-align: left;">Networth: ${numberFormatter(networthAsk)} / ${numberFormatter(networthBid)}</div>`);
            } else {
                setTimeout(waitForHeader, 200);
            }
        };
        waitForHeader();
    }

    /* 显示当前动作总时间 */
    const showTotalActionTime = () => {
        const targetNode = document.querySelector("div.Header_actionName__31-L2 > div.Header_actionName__31-L2");
        if (targetNode) {
            calculateTotalTime(targetNode);
            new MutationObserver((mutationsList) =>
                mutationsList.forEach((mutation) => {
                    if (mutation.type === "characterData") {
                        calculateTotalTime();
                    }
                })
            ).observe(targetNode, { characterData: true, subtree: true });
        } else {
            setTimeout(showTotalActionTime, 200);
        }
    };
    showTotalActionTime();

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
                const string = textNode.textContent;
                const actionName = string.substring(string.indexOf("- ") + 2, string.indexOf(" ("));
                const actionHrid = initData_actionDetailMap[getActionHridFromItemName(actionName)].hrid;
                const effBuff = 1 + getTotalEffiPercentage(actionHrid) / 100;
                const actualNumberOfTimes = Math.round(numOfTimes / effBuff);
                totalTimeStr = " [" + timeReadable(actualNumberOfTimes * timePerActionSec) + "]";
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
                const enhanceBonus = 1 + itemEnhanceLevelToBuffBonusMap[item.enhancementLevel] / 100;
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
        const itemName = tooltip.querySelector("div.ItemTooltipText_name__2JAHA").textContent;
        const amountSpan = tooltip.querySelectorAll("span")[1];
        const amount = +amountSpan.textContent.split(": ")[1].replaceAll(",", "");

        const jsonObj = await fetchMarketJSON();
        if (!jsonObj) {
            amountSpan.parentNode.insertAdjacentHTML(
                "afterend",
                `
                <div style="color: DarkGreen;"">获取市场API失败</div>
                `
            );
            return;
        }
        if (!jsonObj.market) {
            amountSpan.parentNode.insertAdjacentHTML(
                "afterend",
                `
                <div style="color: DarkGreen;"">市场API格式错误</div>
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
            let droprate = 1;
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
            appendHTMLStr += `<div style="color: DarkGreen; font-size: 10px;">每小时生产 ${Number(produceItemPerHour + extraQuantityPerHour).toFixed(1)} 个</div>`;
            appendHTMLStr += `<div style="color: DarkGreen;">利润: ${numberFormatter(bid - totalAskPrice * (1 - teaBuffs.lessResource / 100))}/个, ${numberFormatter(
                produceItemPerHour * (bid - totalAskPrice * (1 - teaBuffs.lessResource / 100)) + extraQuantityPerHour * bid
            )}/小时, ${numberFormatter(24 * produceItemPerHour * (bid - totalAskPrice * (1 - teaBuffs.lessResource / 100)) + extraQuantityPerHour * bid)}/天</div>`;
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
                24 * produceItemPerHour * bid + extraQuantityPerHour * bid
            )}/天</div>`;
        }

        amountSpan.parentNode.nextSibling.insertAdjacentHTML("afterend", appendHTMLStr);
    }

    async function fetchMarketJSON(forceFetch = false) {
        if (!forceFetch && localStorage.getItem("MWITools_marketAPI_timestamp") && Date.now() - localStorage.getItem("MWITools_marketAPI_timestamp") < 900000) {
            return JSON.parse(localStorage.getItem("MWITools_marketAPI_json"));
        }

        console.log("fetchMarketJSON fetch");
        let jsonStr = null;
        jsonStr = await new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                url: `https://raw.githubusercontent.com/holychikenz/MWIApi/main/medianmarket.json`,
                method: "GET",
                synchronous: true,
                onload: async (response) => {
                    if (response.status == 200) {
                        console.log("fetchMarketJSON github fetch success 200");
                        resolve(response.responseText);
                    } else {
                        console.error("MWITools: fetchMarketJSON github onload with HTTP status " + response.status);
                        resolve(null);
                    }
                },
                onabort: () => {
                    console.error("MWITools: fetchMarketJSON github onabort");
                    resolve(null);
                },
                onerror: () => {
                    console.error("MWITools: fetchMarketJSON github onerror");
                    resolve(null);
                },
                ontimeout: () => {
                    console.error("MWITools: fetchMarketJSON github ontimeout");
                    resolve(null);
                },
            });
        });

        if (jsonStr === null) {
            console.log("MWITools: fetchMarketJSON try fetch cache start");
            jsonStr = await new Promise((resolve, reject) => {
                GM.xmlHttpRequest({
                    url: `http://43.129.194.214:5000/apijson`,
                    method: "GET",
                    synchronous: true,
                    onload: async (response) => {
                        if (response.status == 200) {
                            console.log("fetchMarketJSON cache fetch success 200");
                            resolve(response.responseText);
                        } else {
                            console.error("MWITools: fetchMarketJSON cache onload with HTTP status " + response.status);
                            resolve(null);
                        }
                    },
                    onabort: () => {
                        console.error("MWITools: fetchMarketJSON cache onabort");
                        resolve(null);
                    },
                    onerror: () => {
                        console.error("MWITools: fetchMarketJSON cache onerror");
                        resolve(null);
                    },
                    ontimeout: () => {
                        console.error("MWITools: fetchMarketJSON cache ontimeout");
                        resolve(null);
                    },
                });
            });
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
            const actionPanelObserver = new MutationObserver(async function (mutations) {
                for (const mutation of mutations) {
                    for (const added of mutation.addedNodes) {
                        if (added && added.classList && added.classList.contains("Modal_modalContainer__3B80m") && added.querySelector("div.SkillActionDetail_nonenhancingComponent__1Y-ZY")) {
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
    waitForActionPanelParent();

    async function handleActionPanel(panel) {
        const actionName = panel.querySelector("div.SkillActionDetail_name__3erHV").textContent;
        const exp = Number(panel.querySelector("div.SkillActionDetail_expGain__F5xHu").textContent);
        const duration = Number(panel.querySelectorAll("div.SkillActionDetail_value__dQjYH")[4].textContent.replace("s", ""));
        const inputElem = panel.querySelector("div.SkillActionDetail_maxActionCountInput__1C0Pw input");

        const actionHrid = initData_actionDetailMap[getActionHridFromItemName(actionName)].hrid;
        const effBuff = 1 + getTotalEffiPercentage(actionHrid, true) / 100;

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
        const presetTimes = [10, 20, 50, 100, 200, 500, 1000, 2000];
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
            let targetLevel = currentLevel + 1;
            let needExp = initData_levelExperienceTable[targetLevel] - currentExp;
            let needNumOfActions = Math.round(needExp / exp);
            let needTime = timeReadable((needNumOfActions / effBuff) * duration);

            hTMLStr = `<div id="tillLevel" style="color: Green; text-align: left;">到 <input id="tillLevelInput" type="number" value="${targetLevel}" min="${targetLevel}" max="200"> 级还需做 <span id="tillLevelNumber">${needNumOfActions} 次[${needTime}] (刷新网页更新当前等级)</span></div>`;
            quickInputButtonsDiv.insertAdjacentHTML("afterend", hTMLStr);
            const tillLevelInput = panel.querySelector("input#tillLevelInput");
            const tillLevelNumber = panel.querySelector("span#tillLevelNumber");
            tillLevelInput.onchange = () => {
                let targetLevel = Number(tillLevelInput.value);
                if (targetLevel > currentLevel && targetLevel <= 200) {
                    let needExp = initData_levelExperienceTable[targetLevel] - currentExp;
                    let needNumOfActions = Math.round(needExp / exp);
                    let needTime = timeReadable((needNumOfActions / effBuff) * duration);
                    tillLevelNumber.textContent = `${needNumOfActions} 次 [${needTime}] (刷新网页更新当前等级)`;
                } else {
                    tillLevelNumber.textContent = "Error";
                }
            };
            tillLevelInput.addEventListener("keyup", function (evt) {
                let targetLevel = Number(tillLevelInput.value);
                if (targetLevel > currentLevel && targetLevel <= 200) {
                    let needExp = initData_levelExperienceTable[targetLevel] - currentExp;
                    let needNumOfActions = Math.round(needExp / exp);
                    let needTime = timeReadable((needNumOfActions / effBuff) * duration);
                    tillLevelNumber.textContent = `${needNumOfActions} 次 [${needTime}] (刷新网页更新当前等级)`;
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
})();
