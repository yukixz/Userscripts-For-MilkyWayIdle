// ==UserScript==
// @name         client_data_diff
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Prints client data.
// @author       bot7420
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @require      https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.19/lodash.js
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(() => {
    "use strict";

    let initData_itemDetailMap = null;

    hookWS();

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
        if (obj && obj.type === "init_client_data") {
            initData_itemDetailMap = obj.itemDetailMap;
            store();
            compare();
        }
        return message;
    }

    function store() {
        const selectedItems = {};
        for (const item of Object.values(initData_itemDetailMap)) {
            if (item.categoryHrid === "/item_categories/equipment") {
                const newItem = {};
                newItem.description = item.description;
                newItem.hrid = item.hrid;
                newItem.itemLevel = item.itemLevel;
                newItem.name = item.name;
                newItem.levelRequirements = item.equipmentDetail.levelRequirements;
                newItem.combatStats = item.equipmentDetail.combatStats;
                newItem.combatEnhancementBonuses = item.equipmentDetail.combatEnhancementBonuses;
                selectedItems[newItem.hrid] = newItem;
            }
        }
        console.log(selectedItems);
        const url = window.location.href.includes("test.") ? "test" : "master";
        GM_setValue(url, JSON.stringify(selectedItems));
    }

    function compare() {
        let test = GM_getValue("test");
        let master = GM_getValue("master");
        if (!test || !master) {
            console.error("compare null");
            return;
        }
        test = JSON.parse(test);
        master = JSON.parse(master);

        const result = [];
        for (const key of Object.keys(test)) {
            if (test[key].hrid !== master[key]?.hrid) {
                result.push(test[key]);
            }
        }
        console.log(result);
    }
})();
