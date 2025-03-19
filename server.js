require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// Google Apps Script Web API URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbx6fuwFP_T5oHgrHWec0FSmFaOl28vDyI_HwtEzI-8N4pTCBiYu8mIAa3MBgp-FMM5a4w/exec";

// 讀取 LINE Bot 的 Token
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

//  儲存 `replyToken` 和對應的時間
let storedReplyToken = null;
let storedReplyTokenTimestamp = null;

app.get('/', (req, res) => {
    res.send("Hello, LINE Bot Webhook with GAS!");
});

//  接收 LINE Webhook 訊息
app.post('/webhook', async (req, res) => {
    console.log(" 收到 LINE Webhook:", JSON.stringify(req.body, null, 2));

    if (req.body.events) {
        for (let event of req.body.events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const replyToken = event.replyToken;
                const userMessage = event.message.text.trim();
                const userId = event.source.userId;  // 取得使用者的 ID

                // 🔹 記錄 User ID
                console.log("🔍 觸發機器人的 User ID:", userId);
                //  記錄 `replyToken` 並存時間
                storedReplyToken = replyToken;
                storedReplyTokenTimestamp = Date.now();
                console.log(" 記錄 replyToken:", storedReplyToken);
                console.log("使用者訊息:", userMessage); // 新增日誌

                // 立即回應使用者，避免 `replyToken` 過期

                //  根據關鍵字決定執行的功能
                if (/油價/.test(userMessage)) {
                    await callGASFunction("fetchOilPricesFromCloudflare");
                } else if (/天氣/.test(userMessage)) {
                    await callGASFunction("sendWeatherUpdate");
                } else if (/音樂|排行榜/.test(userMessage)) {
                    await callGASFunction("sendKKBOXChartsToLine");
                } else if (/台語排行榜/.test(userMessage)) {
                    await callGASFunction("sendKKBOXTaiwaneseHotChartsToLine");
                } else if (/空氣品質/.test(userMessage)) { // 新增關鍵字匹配
                    await callGASFunction("sendAirQualityUpdate");
                } else {
                    // 🐱 隨機選擇更生動的貓咪表情
const catEmojis = ["😻", "🐾", "😸", "🐱💖", "🐈✨", "🐾💬"];
const randomCat = catEmojis[Math.floor(Math.random() * catEmojis.length)];

const message = `${randomCat} 喵醬幫你查油價！🚗💨💨

🛢️查詢油價：
輸入油價、今日油價，喵醬立刻為您查詢！💨

🌦️今天的天氣如何呢？
輸入天氣、今日天氣、氣象、天氣如何，喵醬來報告最新氣象！☀️🌧️

🎵不知道要聽什麼嗎？
喵醬告訴你今天 KKBOX 前 10 名的音樂！🎶💃  
輸入音樂、排行榜、KKBOX 排行榜來看看！

🎤台語音樂看這邊！
想聽台語歌嗎？輸入台語排行榜，馬上播放熱騰騰的台語音樂榜！🎶🥁

✨喵醬等待您的指示，喵！ฅ^•ﻌ•^ฅ`;

await replyToUser(replyToken, message);

                }
            }
        }
    }

    res.sendStatus(200);
});

//  呼叫 Google Apps Script API
// 📌 呼叫 Google Apps Script API
async function callGASFunction(functionName) {
    try {
        const response = await axios.get(GAS_URL, {
            params: { function: functionName }  
        });

        console.log("✅ GAS 回應:", response.data);
        logGASResponse(response.data); // 記錄 GAS 回應

        // 📌 確保 `replyToken` 在有效期內
        const currentTime = Date.now();
        if (storedReplyToken && (currentTime - storedReplyTokenTimestamp) < 29000) { 
            if (response.data && response.data.trim() !== "") { // **只有當 GAS 回應有數據時才發送**
                await replyToUser(storedReplyToken, response.data);
            } else {
                console.log("⚠️ GAS 沒有返回有效數據，不發送訊息");
            }
        } else {
            console.log("⚠️ replyToken 已過期，無法發送訊息");
        }

    } catch (error) {
        console.error("🚨 GAS API 錯誤:", error.response ? error.response.data : error);
        if (storedReplyToken && (Date.now() - storedReplyTokenTimestamp) < 29000) {
            await replyToUser(storedReplyToken, "❌ 無法取得 GAS 回應");
        }
    }
}


//  記錄 GAS 返回的數據
function logGASResponse(data) {
    console.log(" 記錄 GAS 回應數據:", data);
}

//  回應 LINE Bot 使用者
async function replyToUser(replyToken, message) {
    const LINE_API_URL = 'https://api.line.me/v2/bot/message/reply';

    try {
        await axios.post(LINE_API_URL, {
            replyToken: replyToken,
            messages: [{ type: 'text', text: message }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
            }
        });

        console.log("✅ LINE Bot 訊息已發送:", message);
    } catch (error) {
        console.error(" 發送 LINE 訊息時錯誤:", error.response ? error.response.data : error);
    }
}

//  啟動伺服器
app.listen(PORT, () => {
    console.log(` Webhook 伺服器運行於 http://localhost:${PORT}`);
});