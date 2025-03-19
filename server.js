require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// 📌 **加回 GAS 網址**
const GAS_URL = "https://script.google.com/macros/s/AKfycbxaSO7Qx14CITylHqXFsQPbqtLI12AdA5olFGZsrp6fyhQ7YCQVBKV2vfrxzWqtWoQT0g/exec";  // 🔹 這裡填入你的 Google Apps Script 網址

// 讀取 LINE Bot 的 Token
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

//  儲存 `replyToken` 和對應的時間
let storedReplyToken = null;
let storedReplyTokenTimestamp = null;

app.get('/', (req, res) => {
    res.send("Hello, LINE Bot Webhook with GAS!");
});

//  **接收 LINE Webhook 訊息**
app.post('/webhook', async (req, res) => {
    console.log("📩 收到 LINE Webhook:", JSON.stringify(req.body, null, 2));

    if (req.body.events) {
        for (let event of req.body.events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const replyToken = event.replyToken;
                const userMessage = event.message.text.trim();
                const userId = event.source.userId;  // 取得發訊息的使用者 ID
                const myUserId = "U940eccba4cc3b3a6a27b389beed1b0d5";  // 🔹 這裡填入你的 LINE ID

                console.log("🔎 使用者 ID:", userId);
                console.log("📝 使用者訊息:", userMessage);

                if (userId === myUserId) {
                    console.log("🎯 這是你的訊息，正常回應你");
                    storedReplyToken = replyToken;
                    storedReplyTokenTimestamp = Date.now();

                    // 📌 你的訊息 → 正常處理
                    if (/油價/.test(userMessage)) {
                        await callGASFunction("fetchOilPricesFromCloudflare");
                    } else if (/天氣/.test(userMessage)) {
                        await callGASFunction("sendWeatherUpdate");
                    } else if (/音樂|排行榜/.test(userMessage)) {
                        await callGASFunction("sendKKBOXChartsToLine");
                    } else if (/台語排行榜/.test(userMessage)) {
                        await callGASFunction("sendKKBOXTaiwaneseHotChartsToLine");
                    } else if (/空氣品質/.test(userMessage)) { 
                        await callGASFunction("sendAirQualityUpdate");
                    } else {
                        await replyToUser(replyToken, "😺 喵～主人！你可以輸入「天氣」、「油價」或「排行榜」喵！");
                    }
                } else {
                    console.log("🎯 這是朋友的訊息，正常回應朋友，不傳給你");
                    storedReplyToken = replyToken;
                    storedReplyTokenTimestamp = Date.now();

                    // 📌 朋友的訊息 → 正常處理
                    if (/油價/.test(userMessage)) {
                        await callGASFunction("fetchOilPricesFromCloudflare");
                    } else if (/天氣/.test(userMessage)) {
                        await callGASFunction("sendWeatherUpdate");
                    } else if (/音樂|排行榜/.test(userMessage)) {
                        await callGASFunction("sendKKBOXChartsToLine");
                    } else if (/台語排行榜/.test(userMessage)) {
                        await callGASFunction("sendKKBOXTaiwaneseHotChartsToLine");
                    } else if (/空氣品質/.test(userMessage)) { 
                        await callGASFunction("sendAirQualityUpdate");
                    } else {
                        await replyToUser(replyToken, "😸 喵？聽不懂喵～可以輸入「天氣」、「油價」或「排行榜」喵！");
                    }
                }
            }
        }
    }

    res.sendStatus(200);
});

// **📌 確保 `callGASFunction` 可以運作**
async function callGASFunction(functionName) {
    try {
        const response = await axios.get(GAS_URL, {
            params: { function: functionName }  
        });

        console.log("✅ GAS 回應:", response.data);

        // 📌 確保 `replyToken` 在有效期內
        const currentTime = Date.now();
        if (storedReplyToken && (currentTime - storedReplyTokenTimestamp) < 29000) { 
            if (response.data && response.data.trim() !== "") { 
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

// 📌 **回應 LINE 使用者**
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
        console.error("🚨 發送 LINE 訊息時錯誤:", error.response ? error.response.data : error);
    }
}

// 📌 **啟動伺服器**
app.listen(PORT, () => {
    console.log(`🚀 Webhook 伺服器運行於 http://localhost:${PORT}`);
});
