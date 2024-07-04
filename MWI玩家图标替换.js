// ==UserScript==
// @name         MWI玩家图标替换
// @namespace    MWI
// @version      1.40
// @description  替换战斗页面指定玩家图标，本地可见
// @icon         https://www.milkywayidle.com/favicon.svg
// @author       Ak4r1 Stella bot7420
// @match        *://www.milkywayidle.com/*
// @grant        none
// @downloadURL https://update.greasyfork.org/scripts/492333/MWI%E7%8E%A9%E5%AE%B6%E5%9B%BE%E6%A0%87%E6%9B%BF%E6%8D%A2.user.js
// @updateURL https://update.greasyfork.org/scripts/492333/MWI%E7%8E%A9%E5%AE%B6%E5%9B%BE%E6%A0%87%E6%9B%BF%E6%8D%A2.meta.js
// ==/UserScript==

// 替换的目标名称和对应的图片链接
let replacementTargets = {
    "7BagTea": "https://tupian.li/images/2024/03/31/66085ea356ad8.png",
    avnuna: "https://s2.loli.net/2024/07/04/a3WrE5gJ2AKUIRl.jpg",
    Ak4r1: "https://tupian.li/images/2024/03/31/6608644dc77c0.png",
    Acha: "https://tupian.li/images/2024/03/31/66085ea356ad8.png",
    A7: "https://i0.hdslb.com/bfs/article/a25918f7fd6580bfd3aa686d2542f719837e2c4f.gif@1256w_1226h_!web-article-pic.avif",
    berstar: "https://tupian.li/images/2024/06/24/6678ecfd5acf2.gif",
    bsyno2: "https://tupian.li/images/2024/04/25/662a477d6f9e1.jpg",
    brbbswd1: "https://7a597613.imageupload123.pages.dev/file/5f185bf2043909efe4ca5.gif",
    Bearui: "https://tupian.li/images/2024/04/12/661906c21a5f3.jpg",
    Beholder: "https://tupian.li/images/2024/06/19/6672554a2d2f3.png",
    clmodos: "https://tupian.li/images/2024/06/24/6678e8ec88145.png",
    Chan0: "https://tupian.li/images/2024/04/25/662a45b04aceb.gif",
    carlming: "https://tupian.li/images/2024/07/04/6685f843aa6f3.jpg",
    cancannide: "https://tupian.li/images/2024/06/24/6678dc945d68d.jpg",
    Crazytrain: "https://tupian.li/images/2024/07/01/668224e51a8b8.png",
    dccat: "https://tupian.li/images/2024/06/24/6678e55841fc4.webp",
    duang: "https://tupian.li/images/2024/07/04/668605af94b71.jpg",
    diedaye: "https://tupian.li/images/2024/04/12/66194ccc2c516.png",
    Ezbot: "https://tupian.li/images/2024/05/10/663da43bc3269.jpeg",
    HGZ888: "https://i0.hdslb.com/bfs/article/473dbdbe1e4f81327509a6f1645b43a58880c060.gif@1256w_1008h_!web-article-pic.avif",
    Hardys: "https://tupian.li/images/2024/06/29/6680013aea337.gif",
    HONGHOO: "https://profileimages.torn.com/ded8a4f1-5d46-12ab-2792689.gif?v=1940629196397",
    HolsteinIroncow: "https://tupian.li/images/2024/07/04/6685efa94f610.jpg",
    iFor: "https://tupian.li/images/2024/06/28/667e3866d4221.gif",
    IronZeeman: "https://tupian.li/images/2024/06/24/6678ea25bb2af.gif",
    IronMuyu: "https://tupian.li/images/2024/07/02/66840dd3d0727.png",
    jizhoulang: "https://tupian.li/images/2024/04/12/661956eedb4ab.png",
    jinjidemingge: "https://tupian.li/images/2024/07/04/66860d8ba9ddd.gif",
    lyRicky: "https://i0.hdslb.com/bfs/article/037676e61262badc05ef0edb802841783a20d1bd.gif@1256w_1078h_!web-article-pic.avif",
    Lizardegg: "https://pic.imgdb.cn/item/66194b7668eb935713e497ab.png",
    Lapapap: "https://tupian.li/images/2024/07/04/6685f6bb5cdf5.jpg",
    moxida: "https://zengzh-test.oss-cn-shenzhen.aliyuncs.com/moxida.gif",
    MainpowerDoro: "https://tupian.li/images/2024/06/24/6678cfaaa9dd2.webp",
    Mulianzhi: "https://tupian.li/images/2024/05/20/664ae3cabf5c6.jpg",
    Muyu: "https://tupian.li/images/2024/05/13/6641fa37eff84.gif",
    niuniubb: "https://zengzh-test.oss-cn-shenzhen.aliyuncs.com/niuniubb.gif",
    Newer: "https://tupian.li/images/2024/04/12/661945e33a522.png",
    niu2: "https://tupian.li/images/2024/06/30/66817889410ea.gif",
    orz: "https://img.picui.cn/free/2024/07/04/6685e2257a290.png",
    Riioooo: "https://tupian.li/images/2024/07/02/66835c93be051.png",
    rilence: "https://profileimages.torn.com/1c05e1bd-1c90-47e7-8d9f-e74bed0fab7a-2625339.png?v=1040063",
    sky0426: "https://i0.hdslb.com/bfs/new_dyn/5ddd5254d62ccaedc9b38af286c214576598598.jpg@560w_560h_1e_1c.avif",
    Stella: "https://profileimages.torn.com/f2ff7420-802e-4a39-a61c-860e1a84dcbf-2671581.png?v=1940629196397",
    shacono1: "https://tupian.li/images/2024/05/10/663da4896ee71.gif",
    Sweety: "https://tupian.li/images/2024/04/25/662a43441f321.gif",
    StarryMilk: "https://zengzh-test.oss-cn-shenzhen.aliyuncs.com/StarryMilk.png",
    tobytorn: "https://tupian.li/images/2024/07/01/66823b4ac64a8.png",
    TouchFish: "https://tupian.li/images/2024/04/25/662a49b3d7f1c.jpg",
    TruthLight: "https://img.picui.cn/free/2024/07/04/6685e2257a290.png",
    wudi: "https://tupian.li/images/2024/07/04/6685fbcd7027c.jpg",
    WeiJia: "https://tupian.li/images/2024/07/04/6685f358f26ad.png",
    wslsk20240312: "https://tupian.li/images/2024/04/12/661944c0c8ca2.jpg",
    WittAndStein: "https://doh-nuts.github.io/Enhancelator/holy_enhancer.svg",
    xuantu: "https://tupian.li/images/2024/04/12/66193f2282013.png",
    yx: "https://tupian.li/images/2024/06/29/667fe1b526eb2.jpg",
    yeshuling: "https://tupian.li/images/2024/04/12/66194b4eb193c.png",
    Zibba: "https://tupian.li/images/2024/07/04/6685f42ccfbeb.png",
    Zeeman: "https://tupian.li/images/2024/06/24/6678e7dc8f6af.gif",
    zzzzzy: "https://tupian.li/images/2024/06/29/667f81544b9d5.png",
    zj243: "https://profileimages-cdn.torn.com/a59ae1ad-53a0-f352-2414908.gif?v=1940629196397",
    玩家ID: "图片链接",
    // 在此添加更多的玩家ID和图片链接
};

(function () {
    "use strict";

    function replaceIconsIn(node) {
        const iconElements = node.querySelectorAll(`div.FullAvatar_fullAvatar__3RB2h`);
        for (const elem of iconElements) {
            if (elem.closest("div.CowbellStorePanel_avatarsTab__1nnOY")) {
                continue; // 商店页面
            }

            const playerId = findPlayerIdByAvatarElem(elem);
            if (!playerId) {
                console.error("ICONS: replaceIconsIn can't find playerId");
                console.log(elem);
                continue; // 找不到 playerId
            }

            if (!replacementTargets.hasOwnProperty(playerId)) {
                continue; // 没有配置图片地址
            }

            const newImgElement = document.createElement("img");
            newImgElement.src = replacementTargets[playerId];
            newImgElement.style.width = "100%";
            newImgElement.style.height = "auto";
            elem.innerHTML = "";
            elem.appendChild(newImgElement);
        }
    }

    function findPlayerIdByAvatarElem(avatarElem) {
        // Profile 窗口页
        const profilePageDiv = avatarElem.closest("div.SharableProfile_modal__2OmCQ");
        if (profilePageDiv) {
            return profilePageDiv.querySelector(".CharacterName_name__1amXp")?.textContent.trim();
        }

        // 网页右上角
        const headerDiv = avatarElem.closest("div.Header_header__1DxsV");
        if (headerDiv) {
            return headerDiv.querySelector(".CharacterName_name__1amXp")?.textContent.trim();
        }

        // 战斗页面
        const combatDiv = avatarElem.closest("div.CombatUnit_combatUnit__1m3XT");
        if (combatDiv) {
            return combatDiv.querySelector(".CombatUnit_name__1SlO1")?.textContent.trim();
        }

        // 组队页面
        const partyDiv = avatarElem.closest("div.Party_partySlot__1xuiq");
        if (partyDiv) {
            return partyDiv.querySelector(".CharacterName_name__1amXp")?.textContent.trim();
        }

        return null;
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (
                    node.tagName === "DIV" &&
                    !node.classList.contains("ProgressBar_innerBar__3Z_sf") &&
                    !node.classList.contains("CountdownOverlay_countdownOverlay__2QRmL") &&
                    !node.classList.contains("ChatMessage_chatMessage__2wev4") &&
                    !node.classList.contains("Header_loot__18Cbe") &&
                    !node.classList.contains("script_itemLevel") &&
                    !node.classList.contains("script_key") &&
                    !node.classList.contains("dps-info") &&
                    !node.classList.contains("MuiTooltip-popper")
                ) {
                    replaceIconsIn(node);
                }
            });
        });
    });
    observer.observe(document.body, { attributes: false, childList: true, subtree: true });

    // setInterval(() => replaceIconsIn(document.body), 100);
})();
