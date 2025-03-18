require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// Google Apps Script Web API URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbxQLS6m0HzbO9_N9ra6lvtQsQlrTrAvB_XBgsrS1H5aeb9ezOSXO0nsbrutQzILHpgK-A/exec";  

// 讀取 LINE Bot 的 Token
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

// 📌 儲存 `replyToken` 和對應的時間
let storedReplyToken = null;
let storedReplyTokenTimestamp = null; 

app.get('/', (req, res) => {
    res.send("Hello, LINE Bot Webhook with GAS!");
});

// 📌 接收 LINE Webhook 訊息
app.post('/webhook', async (req, res) => {
    console.log("📩 收到 LINE Webhook:", JSON.stringify(req.body, null, 2));

    if (req.body.events) {
        for (let event of req.body.events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const replyToken = event.replyToken;
                const userMessage = event.message.text.trim();

                // 📌 記錄 `replyToken` 並存時間
                storedReplyToken = replyToken;
                storedReplyTokenTimestamp = Date.now();
                console.log("🔵 記錄 replyToken:", storedReplyToken);

                // 立即回應使用者，避免 `replyToken` 過期
                await replyToUser(replyToken, "🐶 小狗 Bot 收到訊息啦！正在處理...");

                // 📌 根據關鍵字決定執行的功能
                if (/油價/.test(userMessage)) {
                    await callGASFunction("fetchOilPricesFromCloudflare");
                } else if (/天氣/.test(userMessage)) {
                    await callGASFunction("sendWeatherUpdate");
                } else if (/音樂|排行榜/.test(userMessage)) {
                    await callGASFunction("sendKKBOXChartsToLine");
                } else if (/台語排行榜/.test(userMessage)) {
                    await callGASFunction("sendKKBOXTaiwaneseHotChartsToLine");
                } else {
                    await replyToUser(replyToken, "🤖 我聽不懂，可以試試「油價」、「天氣」或「音樂」！");
                }
            }
        }
    }

    res.sendStatus(200);
});

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
            await replyToUser(storedReplyToken, response.data || "⚠️ GAS 沒有返回數據");
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

// 📌 記錄 GAS 返回的數據
function logGASResponse(data) {
    console.log("📜 記錄 GAS 回應數據:", data);
}

// 📌 回應 LINE Bot 使用者
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

// 📌 啟動伺服器
app.listen(PORT, () => {
    console.log(`🚀 Webhook 伺服器運行於 http://localhost:${PORT}`);
});
