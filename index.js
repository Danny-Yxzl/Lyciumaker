const CE = new UIEvent("change");

import { convertToTraditional } from "./util.js";
import { drawName } from "./splicing.js";
import { drawSkillText } from "./text.js";

const canvas = document.getElementById("card_preview");
const ctx = canvas.getContext("2d");

const downloadCardButton = document.getElementById("download_card");
let downloadButtonLock = false; // 避免重复点击下载按钮

const importIllustrationInput = document.getElementById("import_illustration");
const zoomInButton = document.getElementById("zoom_in"); // 插画缩放 +25%
const zoomOutButton = document.getElementById("zoom_out"); // 插画缩放 -25%
const resetScaleButton = document.getElementById("reset_scale"); // 插画缩放 重置
const translateInput = document.getElementById("translateBox"); // 自动简繁切换
const powerSelect = document.getElementById("power_select"); // 势力下拉框
const myLordButton = document.getElementById("myLord"); // 主公复选框
const scaleNumberInput = document.getElementById("scale_number"); // 插画缩放 输入框

// 体力值与体力上限
const heartInput = document.getElementById("heart"); // 体力值
const heartLimitInput = document.getElementById("heart_limit"); // 体力值上限
const isHeartLimitButton = document.getElementById("isHeartLimit"); // 体力值与体力上限不等
let isHeartLimit = false; // 是否绘制空血

const heroTitleInput = document.getElementById("hero_title"); // 武将称号
const heroNameInput = document.getElementById("hero_name"); // 武将名
const skillNumberInput = document.getElementById("skill_number"); // 技能数量
const s2ttip = document.getElementById("s2ttip");

const isProducerButton = document.getElementById("isProducer");
const producerInput = document.getElementById("producer");
let isProducer = false; // 是否绘制制作商
const isIllustratorButton = document.getElementById("isIllustrator");
const illustratorInput = document.getElementById("illustrator");
let isIllustrator = false; // 是否绘制画师
const isCardNumberButton = document.getElementById("isCardNumber");
const cardNumberInput = document.getElementById("cardNumber");
let isCardNumber = false; // 是否绘制编号

const sizeName = [
    "dpr",
    "clientWidth",
    "clientHeight",
    "innerWidth",
    "innerHeight",
    "canvasWidth",
    "canvasHeight",
];
const size = new Array(sizeName.length);
let illustration; // 插画
let miscellaneous; // 杂项

let isS2T = true; // 是否简繁转换

let heart = 4; // 体力值
let heartLimit = 4; // 体力上限
let power = ""; // 势力
let myLord = false; // 是否是主公
let title = "未知称号"; // 称号
let name = "未知武将"; // 武将名

let skillNumber = 2; // 技能数量
let skills = []; // 所有技能

let x = 0; // 鼠标位置
let y = 0; // 鼠标位置
let isPressed = false; // 是否按下Canvas
let isTouched = false; // 是否触摸Canvas
let offsetX = 0; // 拖拽开始时鼠标位置和图片位置的偏移量
let offsetY = 0; // 拖拽开始时鼠标位置和图片位置的偏移量
let dragFirst = true;

// 懒加载图片
class LazyImage {
    constructor(path) {
        this.path = path;
        this.loading = false;
        this.img = undefined;
    }
    get() {
        if (this.img) {
            return this.img;
        } else if (this.loading) {
            return undefined;
        } else {
            this.loading = true;
            this.img = new Image();
            this.img.src = this.path;
            this.img.onload = () => {
                this.loading = false;
            };
        }
    }
}

// 外框
class OuterFrame {
    constructor() {
        this.frameName = [
            "old1_wei",
            "old1_shu",
            "old1_wu",
            "old1_qun",
            "old1_shen",
            "old1_jin",
            "old1_wei_zhu",
            "old1_shu_zhu",
            "old1_wu_zhu",
            "old1_qun_zhu",
            "old1_jin_zhu",
        ];
        this.frame = [];
        for (let name of this.frameName) {
            this.frame[name] = new LazyImage("./resources/" + name + ".png");
        }
    }
}
const outerFrame = new OuterFrame(); // 外框

// 插画
class Illustration {
    constructor(img) {
        this.img = img;
        this.width = img.width;
        this.height = img.height;
        this.scale = 1.0;
        this.x = 0;
        this.y = 0;
    }
    changeScale(newScale) {
        newScale = newScale * 1.0;
        if (newScale < 0.01) {
            newScale = 0.01;
        }
        newScale = Math.floor(newScale * 10000) / 10000;
        this.scale = newScale;
    }
}

// 杂项
class Miscellaneous {
    constructor(img) {
        this.img = img;
        // 数组代表 ctx.drawImage 中的 sx, sy, sWidth, sHeight
        this.weiHeartS = [350, 50, 100, 100];
        this.shuHeartS = [350, 150, 100, 100];
        this.wuHeartS = [350, 250, 100, 100];
        this.qunHeartS = [350, 350, 100, 100];
        this.shenHeartS = [350, 450, 100, 100];
        this.jinHeartS = [350, 550, 100, 100];
        this.weiHeartLimitS = [450, 50, 100, 100];
        this.shuHeartLimitS = [450, 150, 100, 100];
        this.wuHeartLimitS = [450, 250, 100, 100];
        this.qunHeartLimitS = [450, 350, 100, 100];
        this.shenHeartLimitS = [450, 450, 100, 100];
        this.jinHeartLimitS = [450, 550, 100, 100];

        this.weiSkillBox = [100, 50, 200, 100];
        this.shuSkillBox = [100, 150, 200, 100];
        this.wuSkillBox = [100, 250, 200, 100];
        this.qunSkillBox = [100, 350, 200, 100];
        this.shenSkillBox = [100, 450, 200, 100];
        this.jinSkillBox = [100, 550, 200, 100];

        this.weiColor = "#ccd5ec";
        this.shuColor = "#e9cfb2";
        this.wuColor = "#d6e3bf";
        this.qunColor = "#d2cbc8";
        this.shenColor = "#c2bd64";
        this.jinColor = "#e3b5f1";
    }
}

// 技能
class Skill {
    constructor(name, text) {
        this.name = name;
        this.text = text;
        this.isBold = false;
        this.isItalic = false;
    }
}

// 按钮事件：下载（保存）卡牌到本地
downloadCardButton.onclick = downloadCard;

function downloadCard() {
    function download() {
        const downloadLink = document.createElement("a");
        // const date = new Date();
        let fileName = name;
        // fileName += Math.floor(date.getTime() / 1000);
        fileName += ".png";
        downloadLink.setAttribute("download", fileName);
        canvas.toBlob(function (blob) {
            const url = URL.createObjectURL(blob);
            downloadLink.setAttribute("href", url);
            downloadLink.click();
        });
    }

    if (downloadButtonLock) {
        alert("正在处理，请勿重复点击下载按钮");
    } else {
        downloadButtonLock = true;
        // 准备好要发送的数据
        const cardInfo = {};
        cardInfo["version"] = "" + document.getElementById("AppName").innerText;
        if (isProducer) {
            cardInfo["producer"] =
                "" + document.getElementById("producer").value;
        }
        if (isIllustrator) {
            cardInfo["illustrator"] =
                "" + document.getElementById("illustrator").value;
        }
        if (isCardNumber) {
            cardInfo["cardNumber"] =
                "" + document.getElementById("cardNumber").value;
        }
        if (myLord) {
            cardInfo["myLord"] = "主公";
        }
        cardInfo["power"] = "" + power;
        cardInfo["name"] = "" + name;
        cardInfo["heart"] = "" + heart;
        if (isHeartLimit) {
            cardInfo["heartLimit"] = "" + heartLimit;
        }
        cardInfo["title"] = "" + title;
        cardInfo["skillNumber"] = "" + skillNumber;
        for (let i = 0; i < skillNumber; i++) {
            cardInfo["skillName" + (i + 1)] = skills[i].name;
            cardInfo["skill" + (i + 1)] = skills[i].text;
        }

        let cardJson = JSON.stringify(cardInfo);
        let timeStamp = new Date().getTime();

        // 发送
        $.ajax({
            type: "POST",
            // 服务器地址
            url: "https://service-8rupwbi8-1253139667.gz.apigw.tencentcs.com/release/generate_sgs_card", // 新
            // url: "https://service-6suhxcdg-1253139667.gz.apigw.tencentcs.com/release/generate_sgs_card",  // 旧
            data: cardJson,
            contentType: "application/json; charset=utf-8",
            success: function (msg) {
                // alert(msg);
                // alert((new Date().getTime() - timeStamp) + "ms")
                download();
                downloadButtonLock = false;
            },
            error: function (errMsg) {
                downloadButtonLock = false;
                const r = confirm("保存失败，是否重试？");
                if (r == true) {
                    downloadCard();
                }
            },
        });
    }
}

// 按钮事件：导入插画
importIllustrationInput.onchange = function () {
    const curFiles = importIllustrationInput.files;
    if (curFiles.length > 0) {
        const url = URL.createObjectURL(curFiles[0]);
        importIllustration(url);
    }
};

// 按钮事件：放大插画
zoomInButton.onclick = function () {
    if (typeof illustration != "undefined") {
        illustration.changeScale(illustration.scale * 1.25);
        refresh_scale_text(illustration, scaleNumberInput);
    }
};

// 按钮事件：缩小插画
zoomOutButton.onclick = function () {
    if (typeof illustration != "undefined") {
        illustration.changeScale(illustration.scale * 0.8);
        refresh_scale_text(illustration, scaleNumberInput);
    }
};

// 按钮事件：重置图像缩放
resetScaleButton.onclick = function () {
    if (typeof illustration != "undefined") {
        illustration.x = 0;
        illustration.y = 0;
        illustration.scale = 1.0;
    }
};

// 按钮事件：是否简繁转换
translateInput.onchange = function () {
    isS2T = translateInput.checked;
    if (isS2T) {
        for (let i of document.getElementsByClassName("traditional_please")) {
            i.style = "display: none";
        }
        s2ttip.style = "";
    } else {
        for (let i of document.getElementsByClassName("traditional_please")) {
            i.style = "";
            s2ttip.style = "display: none";
        }
    }
};

// 点击按钮切换显示状态
function switchDisplay(display, element) {
    if (display) {
        element.style = "";
    } else {
        element.style = "display: none";
    }
}

// 按钮事件：是否显示版权信息（作者）
isProducerButton.onchange = function () {
    isProducer = isProducerButton.checked;
    switchDisplay(isProducer, document.getElementById("producer"));
};

// 按钮事件：是否显示画师
isIllustratorButton.onchange = function () {
    isIllustrator = isIllustratorButton.checked;
    switchDisplay(isIllustrator, document.getElementById("illustrator"));
};

// 按钮事件：是否显示编号
isCardNumberButton.onchange = function () {
    isCardNumber = isCardNumberButton.checked;
    switchDisplay(isCardNumber, document.getElementById("cardNumber"));
};

// 输入框事件：更改技能数量
skillNumberInput.onchange = function () {
    console.log("skillNumberInput.value", skillNumberInput.value);
    const editor = document.getElementById("editor");
    let number = skillNumberInput.value;
    number = Math.floor(number);
    number = number < 0 ? 0 : number;
    number = number > 10 ? 10 : number;
    skillNumberInput.value = number;
    skillNumber = number;
    for (let i = 0; i < number; i++) {
        const skBlock = document.getElementById("sk" + (i + 1) + "Block");
        if (skBlock) {
            skBlock.style = "";
        } else {
            const style = isS2T ? "display: none" : "";
            const content =
                '<div id="sk' +
                (i + 1) +
                'Block" class="block">\n' +
                '        <div class="verticalBlock">' +
                '        <div class="description leftDescription">技能' +
                (i + 1) +
                "</div>\n" +
                '            <input type="checkbox" id="isItalic' +
                (i + 1) +
                '" value="first_checkbox">' +
                '            <label class="description description2" for="isItalic' +
                (i + 1) +
                '">斜体</label>' +
                "        </div>" +
                '        <div style="clear:both"></div>\n' +
                '        <div class="verticalBlock">' +
                '            <div class="description leftDescription">技能名</div>\n' +
                '            <input id="sk' +
                (i + 1) +
                'n" type="text" onfocus="this.select()" value="">\n' +
                '            <div class="tip traditional_please" style="' +
                style +
                '">请输入繁体</div>' +
                "        </div>" +
                '        <div class="verticalBlock">' +
                '            <div class="description leftDescription">技能描述</div>\n' +
                '            <textarea rows="4" id="sk' +
                (i + 1) +
                '" onfocus="this.select()"></textarea>' +
                "        </div>" +
                "    </div>";
            editor.insertAdjacentHTML("beforeend", content);
        }
    }
    for (let i = number; i < 10; i++) {
        const skBlock = document.getElementById("sk" + (i + 1) + "Block");
        if (skBlock) {
            skBlock.style = "display: none";
        }
    }
};

// 输入框事件：修改缩放比例
scaleNumberInput.onchange = function () {
    if (typeof illustration != "undefined") {
        illustration.changeScale(scaleNumberInput.value / 100);
        refresh_scale_text(illustration, scaleNumberInput);
    }
};

// 输入框事件：修改体力值
heartInput.onchange = function () {
    let value = Math.floor(heartInput.value);
    value = value < 1 ? 1 : value;
    value = value > 100 ? 100 : value;
    if (!isHeartLimit || value > heartLimit) {
        heartLimit = value;
        heartLimitInput.value = value;
    }
    heartInput.value = value;
    heart = value;
};

// 按钮事件：是否显示空血
isHeartLimitButton.onchange = () => {
    if (isHeartLimitButton.checked) {
        isHeartLimit = true;
        document.getElementById("heartLimitVBlock").style = "";
    } else {
        isHeartLimit = false;
        heartLimit = heart;
        document.getElementById("heartLimitVBlock").style = "display: none";
    }
};

// 输入框事件：修改体力上限
heartLimitInput.onchange = function () {
    let value = Math.floor(heartLimitInput.value);
    value = Math.floor(value);
    value = value < 1 ? 1 : value;
    value = value > 100 ? 100 : value;
    if (value < heart) {
        heart = value;
        heartInput.value = value;
    }
    heartLimitInput.value = value;
    heartLimit = value;
};

// 禁用默认的触屏滚动
canvas.addEventListener(
    "touchmove",
    function (e) {
        e.preventDefault();
    },
    { passive: false }
);

// 更新当前鼠标位置
canvas.onmousemove = function (e) {
    x = e.offsetX;
    y = e.offsetY;
};

// 更新当前鼠标位置
canvas.ontouchmove = function (e) {
    x = e.changedTouches[0].clientX;
    y = e.changedTouches[0].clientY;
};

// 检测鼠标按下
canvas.onmousedown = function () {
    isPressed = true;
    dragFirst = true;
};

// 检测鼠标抬起
canvas.onmouseup = function () {
    isPressed = false;
};

// 检测触摸按下
canvas.ontouchstart = function (e) {
    x = e.changedTouches[0].clientX;
    y = e.changedTouches[0].clientY;
    isTouched = true;
    dragFirst = true;
};

// 检测鼠标抬起
canvas.ontouchend = function () {
    isTouched = false;
};

// 刷新缩放输入框的文本
function refresh_scale_text(illustration, scaleNumberInput) {
    scaleNumberInput.value = Math.floor(illustration.scale * 100);
}

// 获取窗口大小
function getWindowSize() {
    size[0] = window.devicePixelRatio;
    size[1] = document.body.clientWidth;
    size[2] = document.body.clientHeight;
    size[3] = window.innerWidth;
    size[4] = window.innerHeight;
    size[5] = canvas.width;
    size[6] = canvas.height;
}

// 设置Canvas大小，返回逻辑分辨率
function setCanvasSize(canvas) {
    let dpr = window.devicePixelRatio * 2; // 超分辨率绘制，提高绘制效果
    const ctx = canvas.getContext("2d");
    const clientWidth = document.body.clientWidth;
    const logicalWidth = 400;
    const logicalHeight = logicalWidth * (88 / 63);
    const styleWidth = Math.min(400, clientWidth);
    const styleHeight = styleWidth * (88 / 63);

    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = styleWidth + "px";
    canvas.style.height = styleHeight + "px";
    ctx.scale(dpr, dpr);

    return [logicalWidth, logicalHeight];
}

// 绘制外框
function drawOuterFrame(
    ctx,
    power,
    myLord,
    outerFrame,
    logicalWidth,
    logicalHeight
) {
    if (outerFrame) {
        let img = undefined;
        if (power === "魏" && myLord) {
            img = outerFrame.frame["old1_wei_zhu"].get();
        } else if (power === "魏" && !myLord) {
            img = outerFrame.frame["old1_wei"].get();
        } else if (power === "蜀" && myLord) {
            img = outerFrame.frame["old1_shu_zhu"].get();
        } else if (power === "蜀" && !myLord) {
            img = outerFrame.frame["old1_shu"].get();
        } else if (power === "吴" && myLord) {
            img = outerFrame.frame["old1_wu_zhu"].get();
        } else if (power === "吴" && !myLord) {
            img = outerFrame.frame["old1_wu"].get();
        } else if (power === "群" && myLord) {
            img = outerFrame.frame["old1_qun_zhu"].get();
        } else if (power === "群" && !myLord) {
            img = outerFrame.frame["old1_qun"].get();
        } else if (power === "晋" && myLord) {
            img = outerFrame.frame["old1_jin_zhu"].get();
        } else if (power === "晋" && !myLord) {
            img = outerFrame.frame["old1_jin"].get();
        } else if (power === "神") {
            img = outerFrame.frame["old1_shen"].get();
        } else {
            console.error("没有对应的势力！");
        }
        if (img) {
            const drawWidth = logicalWidth * 1.0;
            const drawHeight = (drawWidth * img.height) / img.width;
            const drawX = 0;
            const drawY = 0;
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        }
    }
}

// 导入插画
function importIllustration(path) {
    const img = new Image();
    img.src = path;
    img.onload = function () {
        illustration = new Illustration(img);
    };
}

// 导入杂项
function importMiscellaneous(path) {
    if (typeof miscellaneous == "undefined") {
        const path = "./resources/miscellaneous.png";
        const img = new Image();
        img.src = path;
        img.onload = function () {
            miscellaneous = new Miscellaneous(img);
        };
    }
}

// 绘制插画
function drawIllustration(ctx, illustration, logicalWidth, logicalHeight) {
    if (typeof illustration != "undefined") {
        const cardRatio = (1.0 * logicalWidth) / logicalHeight;
        const illustrationRatio =
            (1.0 * illustration.width) / illustration.height;
        let drawWidth = 0;
        let drawHeight = 0;
        if (cardRatio < illustrationRatio) {
            // 如果图片更宽，则高度和卡面设为一致
            drawHeight = 1.0 * logicalHeight * illustration.scale;
            drawWidth = drawHeight * illustrationRatio;
        } else {
            // 如果图片更高，则宽度和卡面设为一致
            drawWidth = 1.0 * logicalWidth * illustration.scale;
            drawHeight = drawWidth / illustrationRatio;
        }
        const centerX = (logicalWidth * 1.0) / 2;
        const centerY = (logicalHeight * 1.0) / 2;
        let drawX = centerX + illustration.x - drawWidth / 2;
        let drawY = centerY + illustration.y - drawHeight / 2;

        ctx.drawImage(illustration.img, drawX, drawY, drawWidth, drawHeight);
    }
}

// 绘制体力与体力上限
function drawHeartLimit(type, power, heartLimit, heart) {
    const length = 40;
    const dx = 100;
    const dy = 15;
    let offset = 20;
    const maxHeartNumber = 12;
    if (heartLimit >= maxHeartNumber) {
        offset = (20 * (maxHeartNumber - 1)) / (heartLimit - 1);
    }
    if (type === "old") {
        if (miscellaneous) {
            let S1, S2;
            if (power === "神" || myLord) {
                S1 = miscellaneous.shenHeartS;
                S2 = miscellaneous.shenHeartLimitS;
            } else if (power === "魏") {
                S1 = miscellaneous.weiHeartS;
                S2 = miscellaneous.weiHeartLimitS;
            } else if (power === "蜀") {
                S1 = miscellaneous.shuHeartS;
                S2 = miscellaneous.shuHeartLimitS;
            } else if (power === "吴") {
                S1 = miscellaneous.wuHeartS;
                S2 = miscellaneous.wuHeartLimitS;
            } else if (power === "群") {
                S1 = miscellaneous.qunHeartS;
                S2 = miscellaneous.qunHeartLimitS;
            } else if (power === "晋") {
                S1 = miscellaneous.jinHeartS;
                S2 = miscellaneous.jinHeartLimitS;
            } else {
                console.error("没有对应的势力！");
            }
            if (S1 && S2) {
                for (let i = 0; i < heart; i++) {
                    ctx.drawImage(
                        miscellaneous.img,
                        S1[0],
                        S1[1],
                        S1[2],
                        S1[3],
                        dx + offset * i,
                        dy,
                        length,
                        length
                    );
                }
                for (let i = heart; i < heartLimit; i++) {
                    ctx.drawImage(
                        miscellaneous.img,
                        S2[0],
                        S2[1],
                        S2[2],
                        S2[3],
                        dx + offset * i,
                        dy,
                        length,
                        length
                    );
                }
            }
        }
    }
}

// 绘制称号和武将名
function drawTitleAndName(ctx, title, name, skillTop) {
    let titleNum = 0;
    for (let i of title) {
        titleNum += 1;
    }
    let nameNum = 0;
    for (let i of name) {
        nameNum += 1;
    }

    skillTop -= 16;
    let ratio = 0.5; // 称号与武将名的比例
    if (nameNum > 3) {
        ratio = 0.35;
    }

    let nameBottomY = skillTop < 380 ? skillTop : 380; // 名字的最下端
    let titleTopY = 110; // 称号的最上端（固定）
    let titleBottomY = titleTopY + (nameBottomY - titleTopY) * ratio; // 称号的最下端
    let nameTopY = titleBottomY; // 名字的最上端

    // 绘制称号
    let offset = Math.floor((titleBottomY - titleTopY) / titleNum);
    offset *= 0.9;
    offset = offset > 24 ? 24 : offset;
    let x = power === "神" ? 355 - offset / 2 : 61 - offset / 2;
    let y =
        titleTopY +
        Math.floor(
            ((titleBottomY - titleTopY) * 1.0) / titleNum / 2.0 + offset / 2.0
        );
    ctx.font = offset + "px DFNewChuan";
    const lineWidth = 2.5; // 称号描边宽度
    if (isS2T) {
        title = convertToTraditional(title);
    }
    for (let i in title) {
        ctx.strokeStyle = "rgb(0, 0, 0)";
        ctx.lineWidth = lineWidth;
        ctx.strokeText(title[i], x, y + offset * i);

        if (myLord) {
            if (power === "魏") {
                ctx.fillStyle = "rgb(41,88,155)";
            } else if (power === "蜀") {
                ctx.fillStyle = "rgb(175,98,36)";
            } else if (power === "吴") {
                ctx.fillStyle = "rgb(62,109,31)";
            } else if (power === "群") {
                ctx.fillStyle = "rgb(118,118,118)";
            } else if (power === "晋") {
                ctx.fillStyle = "rgb(104,19,129)"; // 待修改
            } else {
                console.error('势力"' + power + '"不存在主公！');
            }
        } else {
            ctx.fillStyle = "rgb(255, 255, 0)";
        }
        ctx.fillText(title[i], x, y + offset * i);
    }

    // 绘制武将名
    offset = Math.floor((nameBottomY - nameTopY) / nameNum);
    if (nameNum <= 2) {
        offset *= 0.85;
    }
    offset = offset > 57 ? 57 : offset;
    x = power === "神" ? 355 - offset / 2 : 60 - offset / 2;
    y =
        nameTopY +
        Math.floor((nameBottomY - nameTopY) / nameNum / 2.0 + offset * 0.3);

    if (isS2T) {
        name = convertToTraditional(name);
    }
    for (let i in name) {
        drawName(ctx, name[i], x, offset, y + offset * i);
    }
}

// 拖拽插画
function dragIllustration() {
    if (typeof illustration != "undefined" && (isPressed || isTouched)) {
        if (dragFirst == true) {
            offsetX = illustration.x - x;
            offsetY = illustration.y - y;
            dragFirst = false;
        } else {
            illustration.x = x + offsetX;
            illustration.y = y + offsetY;
        }
    }
}

// 刷新内容
function refreshAll() {
    // 刷新势力名
    power = powerSelect.value;
    // 刷新是否为主公
    myLord = power === "神" ? false : myLordButton.checked;

    skills = []; // 清空技能列表
    for (let i = 0; i < skillNumber; i++) {
        const skn = document.getElementById("sk" + (i + 1) + "n");
        const sk = document.getElementById("sk" + (i + 1));
        const skill = new Skill(skn.value, sk.value);
        for (let j in skill.text) {
            if (j == 2 && skill.text[j] === "技") {
                skill.isBold = true;
            } else if (j > 2) {
                break;
            }
        }
        const checked = document.getElementById("isItalic" + (i + 1)).checked;
        if (checked) {
            skill.isItalic = true;
        }
        skills.push(skill);
    }
    title = heroTitleInput.value;
    name = heroNameInput.value;
}

// 绘制技能名与技能
function drawSkill(ctx, skills) {
    // 与绘制技能有关的所有属性
    class SkillTextDrawingAttr {
        constructor() {
            this.skillTopX = 104; // 技能区最顶部的X坐标
            this.skillTopMinY = 435; // 技能区最顶部的Y坐标不得低于此值
            this.sillTopY = this.skillTopMinY; // 技能区最顶部的Y坐标
            this.skillBottomY = 510; // 技能区最底部的Y坐标

            this.maxHeight = (this.skillBottomY - this.sillTopY) * 3; // 技能区最大高度
            this.skillWidth = 228; // 技能区宽度
            this.indent = 0.5; // 首字缩进为0.25个汉字宽度
            this.paragraphSpacing = 0.3; // 段间距，实际段间距为此值*yOffset

            this.fontSize = 12; // 技能字号
            this.yOffset = this.fontSize * 1.2; // 行间距，当字体缩小时变为与字体大小相同
        }
    }

    const skillTextDrawingAttr = new SkillTextDrawingAttr(); // 与绘制技能有关的所有属性
    let skillBoxY = []; // 技能名外框的位置

    // 绘制一行文本
    function drawLine(
        ctx,
        firstLine,
        lastLine,
        lineString,
        skillTextDrawingAttr,
        line,
        bold,
        italic,
        i
    ) {
        let lineCharNum = 0; // 这一行的文字数量
        for (let char of lineString) {
            lineCharNum += char.charCodeAt(0) > 255 ? 2 : 1;
        }
        let xOffset; // X偏移量
        let cur = skillTextDrawingAttr.skillTopX; // 当前绘制的位置（X坐标）

        // 确定文字间距和起始坐标
        if (firstLine && !lastLine) {
            xOffset =
                (skillTextDrawingAttr.skillWidth -
                    skillTextDrawingAttr.indent *
                        skillTextDrawingAttr.fontSize) /
                (lineCharNum - 1);
            cur += skillTextDrawingAttr.indent * skillTextDrawingAttr.fontSize;
        } else if (firstLine && lastLine) {
            xOffset = skillTextDrawingAttr.fontSize / 2;
            cur += skillTextDrawingAttr.indent * skillTextDrawingAttr.fontSize;
        } else if (lastLine) {
            xOffset = skillTextDrawingAttr.fontSize / 2;
        } else {
            xOffset = skillTextDrawingAttr.skillWidth / (lineCharNum - 1);
        }

        for (let k in lineString) {
            let charBold = false;
            if (firstLine && bold && k < 3) {
                charBold = true;
            } else {
                charBold = false;
            }
            drawSkillText(
                ctx,
                lineString[k],
                skillTextDrawingAttr.fontSize,
                charBold,
                italic,
                cur,
                skillTextDrawingAttr.sillTopY +
                    skillTextDrawingAttr.yOffset * line +
                    i *
                        skillTextDrawingAttr.yOffset *
                        skillTextDrawingAttr.paragraphSpacing
            );
            cur +=
                lineString[k].charCodeAt(0) > 255 ? 2 * xOffset : 1 * xOffset;
        }
    }

    // 遍历所有文字，也可以绘制文字
    function iterationText(draw) {
        let line = 0; // 当前行数
        let cur = skillTextDrawingAttr.indent * skillTextDrawingAttr.fontSize; // 当前绘制的位置（X坐标）
        let isFirstLine = true; // 用来判断是否是首行
        let hasReturn = false; // 避免重复换行
        skillBoxY = [];
        // 绘制所有技能
        for (let i in skills) {
            skillBoxY.push(
                skillTextDrawingAttr.sillTopY +
                    skillTextDrawingAttr.yOffset * line +
                    i *
                        skillTextDrawingAttr.yOffset *
                        skillTextDrawingAttr.paragraphSpacing
            );
            let lineOfThisSkill = 0;
            let lineString = [];
            let skillCharNum = 0;
            for (let j in skills[i].text) {
                skillCharNum += 1;
            }

            // 绘制每个技能
            for (let j in skills[i].text) {
                const char = skills[i].text[j];
                if (draw && char.charCodeAt(0) != 65039) {
                    // 忽略变体选择符
                    lineString.push(char);
                }
                cur +=
                    char.charCodeAt(0) > 255
                        ? skillTextDrawingAttr.fontSize
                        : skillTextDrawingAttr.fontSize / 2;
                if (cur > skillTextDrawingAttr.skillWidth) {
                    // 绘制非最后一行
                    if (draw) {
                        drawLine(
                            ctx,
                            isFirstLine,
                            false,
                            lineString,
                            skillTextDrawingAttr,
                            line,
                            skills[i].isBold,
                            skills[i].isItalic,
                            i
                        );
                    }

                    lineString = [];
                    lineOfThisSkill += 1;
                    line += 1;
                    cur = 0;
                    isFirstLine = false;
                    hasReturn = true;
                } else {
                    hasReturn = false;
                }
            }

            // 绘制最后一行
            if (draw) {
                drawLine(
                    ctx,
                    isFirstLine,
                    true,
                    lineString,
                    skillTextDrawingAttr,
                    line,
                    skills[i].isBold,
                    skills[i].isItalic,
                    i
                );
            }

            cur = skillTextDrawingAttr.indent * skillTextDrawingAttr.fontSize;
            isFirstLine = true;
            line = hasReturn ? line : line + 1;
            if (lineOfThisSkill < 1 || (lineOfThisSkill === 1 && hasReturn)) {
                line += 1;
            }
        }

        // 更改第一行的位置
        skillTextDrawingAttr.sillTopY = skillTextDrawingAttr.skillBottomY;
        skillTextDrawingAttr.sillTopY -=
            (line - 1) * skillTextDrawingAttr.yOffset;
        skillTextDrawingAttr.sillTopY -=
            skillTextDrawingAttr.paragraphSpacing *
            skillTextDrawingAttr.yOffset *
            (skills.length - 1);
        skillTextDrawingAttr.sillTopY =
            skillTextDrawingAttr.skillTopMinY < skillTextDrawingAttr.sillTopY
                ? skillTextDrawingAttr.skillTopMinY
                : skillTextDrawingAttr.sillTopY;
        return line;
    }

    // 第一次遍历，仅用于统计行数
    let numLine = iterationText(false);
    while (
        numLine * skillTextDrawingAttr.yOffset +
            skills.length *
                skillTextDrawingAttr.yOffset *
                skillTextDrawingAttr.paragraphSpacing >
        skillTextDrawingAttr.maxHeight
    ) {
        skillTextDrawingAttr.fontSize -= 1;
        if (skillTextDrawingAttr.fontSize === 1) {
            break;
        }
        skillTextDrawingAttr.yOffset = skillTextDrawingAttr.fontSize;
        numLine = iterationText(false);
    }

    ctx.font = "" + skillTextDrawingAttr.fontSize + "px FangZhengZhunYuan";
    ctx.fillStyle = "rgb(0, 0, 0)";

    // 第二次遍历，获取顶部位置
    iterationText(false);

    // 绘制技能底框
    if (typeof skillBoxY[0] != "undefined") {
        const alpha = 0.8;
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        if (typeof miscellaneous != "undefined") {
            let color;
            if (power === "魏") {
                color = miscellaneous.weiColor;
            } else if (power === "蜀") {
                color = miscellaneous.shuColor;
            } else if (power === "吴") {
                color = miscellaneous.wuColor;
            } else if (power === "群") {
                color = miscellaneous.qunColor;
            } else if (power === "神") {
                color = miscellaneous.shenColor;
            } else if (power === "晋") {
                color = miscellaneous.jinColor;
            } else {
                color = miscellaneous.qunColor;
                console.error('不存在势力"' + power + '"对应的技能框颜色');
            }
            let r = color.substr(1, 2);
            let g = color.substr(3, 2);
            let b = color.substr(5, 2);
            r = parseInt(r, 16);
            g = parseInt(g, 16);
            b = parseInt(b, 16);
            ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
            ctx.strokeStyle = ctx.fillStyle;
        }

        const drawY = skillBoxY[0] - 23;
        const drawX = 84;
        const drawWidth = 275;
        const drawHeight = 520 - drawY;
        const corner = 10;
        const margin = 3;
        ctx.beginPath();
        ctx.moveTo(drawX, drawY + corner);
        ctx.lineTo(drawX + corner, drawY + corner);
        ctx.lineTo(drawX + corner, drawY);

        ctx.lineTo(drawX + drawWidth - corner, drawY);
        ctx.lineTo(drawX + drawWidth - corner, drawY + corner);
        ctx.lineTo(drawX + drawWidth, drawY + corner);

        ctx.lineTo(drawX + drawWidth, drawY + drawHeight - corner);
        ctx.lineTo(drawX + drawWidth - corner, drawY + drawHeight - corner);
        ctx.lineTo(drawX + drawWidth - corner, drawY + drawHeight);

        ctx.lineTo(drawX + corner, drawY + drawHeight);
        ctx.lineTo(drawX + corner, drawY + drawHeight - corner);
        ctx.lineTo(drawX, drawY + drawHeight - corner);

        ctx.lineTo(drawX, drawY + corner);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(drawX + margin, drawY + corner + margin);
        ctx.lineTo(drawX + corner + margin, drawY + corner + margin);
        ctx.lineTo(drawX + corner + margin, drawY + margin);

        ctx.lineTo(drawX + drawWidth - corner - margin, drawY + margin);
        ctx.lineTo(
            drawX + drawWidth - corner - margin,
            drawY + corner + margin
        );
        ctx.lineTo(drawX + drawWidth - margin, drawY + corner + margin);

        ctx.lineTo(
            drawX + drawWidth - margin,
            drawY + drawHeight - corner - margin
        );
        ctx.lineTo(
            drawX + drawWidth - corner - margin,
            drawY + drawHeight - corner - margin
        );
        ctx.lineTo(
            drawX + drawWidth - corner - margin,
            drawY + drawHeight - margin
        );

        ctx.lineTo(drawX + corner + margin, drawY + drawHeight - margin);
        ctx.lineTo(
            drawX + corner + margin,
            drawY + drawHeight - corner - margin
        );
        ctx.lineTo(drawX + margin, drawY + drawHeight - corner - margin);

        ctx.lineTo(drawX + margin, drawY + corner + margin);
        ctx.fill();
    }

    ctx.fillStyle = "rgb(0, 0, 0)";
    // 第三次遍历，绘制文字
    iterationText(true);

    // 绘制技能名外框与技能名
    if (typeof miscellaneous != "undefined") {
        for (let i in skillBoxY) {
            const length = 68;
            let S;
            if (power === "魏") {
                S = miscellaneous.weiSkillBox;
            } else if (power === "蜀") {
                S = miscellaneous.shuSkillBox;
            } else if (power === "吴") {
                S = miscellaneous.wuSkillBox;
            } else if (power === "群") {
                S = miscellaneous.qunSkillBox;
            } else if (power === "神") {
                S = miscellaneous.shenSkillBox;
            } else if (power === "晋") {
                S = miscellaneous.jinSkillBox;
            } else {
                S = miscellaneous.qunSkillBox;
                console.error('不存在势力"' + power + '"对应的技能名外框！');
            }

            if (power === "神") {
                ctx.fillStyle = "rgb(239, 227, 111)";
            } else {
                ctx.fillStyle = "rgb(0, 0, 0)";
            }
            ctx.drawImage(
                miscellaneous.img,
                S[0],
                S[1],
                S[2],
                S[3],
                skillTextDrawingAttr.skillTopX - 69,
                skillBoxY[i] - 22,
                length,
                length / 2
            );
            ctx.font = "20px FangZhengLiShu";
            let str = skills[i].name.substr(0, 2);
            if (isS2T) {
                str = convertToTraditional(str);
            }
            ctx.fillText(
                str,
                skillTextDrawingAttr.skillTopX - 57,
                skillBoxY[i] + 1.5
            );
        }
    }

    return skillBoxY.length > 1 ? skillBoxY[0] : 65534;
}

// 绘制底部信息
function drawBottomInfo(ctx, isProducer, isIllustrator) {
    let str = "";
    if (isProducer) {
        str += "™&@ " + document.getElementById("producer").value;
        str += ".  ";
    }
    if (isIllustrator) {
        str += "illustration: " + document.getElementById("illustrator").value;
    }
    ctx.font = "9px FangZhengZhunYuan";
    let leftPos = 85;
    let rightPos = 340;
    if (power === "神") {
        ctx.fillStyle = "rgb(255, 255, 255)";
        leftPos = 150;
        rightPos = 370;
    } else {
        ctx.fillStyle = "rgb(0, 0, 0)";
        leftPos = 85;
        rightPos = 350;
    }
    ctx.fillText(str, leftPos, 539);

    if (isCardNumber) {
        str = "" + document.getElementById("cardNumber").value;
        ctx.textAlign = "right";
        ctx.fillText(str, rightPos, 539);
    }
}

// 绘制版本信息
function drawVersionInformation(ctx) {
    const drawX = 20;
    const drawY = 553;
    ctx.textAlign = "left";
    ctx.font = "8px FangZhengZhunYuan";
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    const info = "" + document.getElementById("AppName").innerText;
    ctx.fillText(info, drawX, drawY);
}

let oldmsg = "";
// 绘图
function draw(gett = true) {
    getWindowSize();

    // 获取技能名和技能描述
    if (gett) refreshAll();

    // 获取Canvas的物理分辨率
    let logicalSize = setCanvasSize(canvas);
    const logicalWidth = logicalSize[0];
    const logicalHeight = logicalSize[1];

    // 拖拽插画
    if (gett) dragIllustration();

    // 绘制插画
    if (typeof illustration != "undefined") {
        drawIllustration(ctx, illustration, logicalWidth, logicalHeight);
    }

    // 绘制外框
    if (typeof outerFrame != "undefined") {
        drawOuterFrame(
            ctx,
            power,
            myLord,
            outerFrame,
            logicalWidth,
            logicalHeight
        );
    }

    // 绘制体力
    drawHeartLimit("old", power, heartLimit, heart);

    // 绘制技能
    let skillTop = drawSkill(ctx, skills);

    // 绘制称号
    drawTitleAndName(ctx, title, name, skillTop);

    // 绘制底部信息
    drawBottomInfo(ctx, isProducer, isIllustrator);

    // 绘制版本信息
    drawVersionInformation(ctx);

    window.requestAnimationFrame(draw);
}

draw();
importIllustration("./resources/刘备-六星耀帝.png");
importMiscellaneous();

function UPLOAD(img) {
    const cardInfo = {
        autoTranslate: translateInput.checked,
        power: powerSelect.value,
        isLord: myLordButton.checked,
        scaleNumber: scaleNumberInput.value,
        heart: heartInput.value,
        heartLimit: heartLimitInput.value,
        diffHeart: isHeartLimitButton.checked,
        heroTitle: heroTitleInput.value,
        heroName: heroNameInput.value,
        skillNumber: skillNumberInput.value,
        isProducer: isProducerButton.checked,
        producer: producerInput.value,
        isIllustrator: isIllustratorButton.checked,
        illustrator: illustratorInput.value,
        isCardNumber: isCardNumberButton.checked,
        cardNumber: cardNumberInput.value,
        offsetX: offsetX,
        offsetY: offsetY,
        skills: [],
        img: img,
    };
    console.log(x, y, offsetX, offsetY);

    for (let i = 1; i <= skillNumberInput.value; i++) {
        let skill = {
            name: $(`#sk${i}n`).val(),
            desp: $(`#sk${i}`).val(),
            italic: $(`#isItalic${i}`).prop("checked"),
        };
        cardInfo.skills.push(skill);
    }

    const cardJson = JSON.stringify(cardInfo);
    console.log(cardInfo);
    $.post(
        "//sgs.yxzl.top/api/",
        { data: cardJson, name: $("#card_name").val() },
        data => {
            console.log(data);
            alert("保存成功");
        }
    );
}

let img_base64 = "";

$("#upload_card").click(() => {
    if (img_base64) {
        UPLOAD(img_base64);
        return;
    }
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var img = new Image(); //通过构造函数绘制图片实例
    img.crossOrigin = "Anonymous"; //处理图片跨域问题，见拓展1
    img.onload = function () {
        //该加载过程为异步事件，请先确保获取完整图片
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0); //将图片绘制在canvas中
        var URLData = canvas.toDataURL("image/png");
        UPLOAD(URLData);
        canvas = null;
    };
    img.src = URL.createObjectURL(importIllustrationInput.files[0]);
});
$("#get_card").click(() => {
    $.get("//sgs.yxzl.top/api/" + $("#card_name").val(), data => {
        const cardInfo = JSON.parse(data);
        // console.log(cardInfo);
        importIllustration(cardInfo.img);
        img_base64 = cardInfo.img;
        translateInput.checked = cardInfo.autoTranslate;
        translateInput.dispatchEvent(new Event("change"));
        powerSelect.value = cardInfo.power;
        powerSelect.dispatchEvent(new Event("change"));
        myLordButton.checked = cardInfo.isLord;
        myLordButton.dispatchEvent(new Event("change"));
        scaleNumberInput.value = cardInfo.scaleNumber;
        setTimeout(() => {
            scaleNumberInput.dispatchEvent(new Event("change"));
        }, 100);
        heartInput.value = cardInfo.heart;
        heartInput.dispatchEvent(new Event("change"));
        heartLimitInput.value = cardInfo.heartLimit;
        heartLimitInput.dispatchEvent(new Event("change"));
        isHeartLimitButton.checked = cardInfo.diffHeart;
        isHeartLimitButton.dispatchEvent(new Event("change"));
        heroTitleInput.value = cardInfo.heroTitle;
        heroTitleInput.dispatchEvent(new Event("change"));
        heroNameInput.value = cardInfo.heroName;
        heroNameInput.dispatchEvent(new Event("change"));
        skillNumberInput.value = cardInfo.skillNumber;
        skillNumberInput.dispatchEvent(new Event("change"));
        isProducerButton.checked = cardInfo.isProducer;
        isProducerButton.dispatchEvent(new Event("change"));
        producerInput.value = cardInfo.producer;
        producerInput.dispatchEvent(new Event("change"));
        isIllustratorButton.checked = cardInfo.isIllustrator;
        isIllustratorButton.dispatchEvent(new Event("change"));
        illustratorInput.value = cardInfo.illustrator;
        illustratorInput.dispatchEvent(new Event("change"));
        isCardNumberButton.checked = cardInfo.isCardNumber;
        isCardNumberButton.dispatchEvent(new Event("change"));
        cardNumberInput.value = cardInfo.cardNumber;
        cardNumberInput.dispatchEvent(new Event("change"));
        offsetX = cardInfo.offsetX;
        offsetY = cardInfo.offsetY;
        setTimeout(() => {
            dragIllustration();
            let logicalSize = setCanvasSize(canvas);
            const logicalWidth = logicalSize[0];
            const logicalHeight = logicalSize[1];
            drawIllustration(ctx, illustration, logicalWidth, logicalHeight);
        }, 200);
        for (let i = 1; i <= cardInfo.skillNumber; i++) {
            $(`#sk${i}n`).val(cardInfo.skills[i - 1].name);
            $(`#sk${i}`).val(cardInfo.skills[i - 1].desp);
            $(`#isItalic${i}`).prop("checked", cardInfo.skills[i - 1].italic);
        }
    });
});
