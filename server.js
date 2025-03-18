require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Google Apps Script Web API URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbxQLS6m0HzbO9_N9ra6lvtQsQlrTrAvB_XBgsrS1H5aeb9ezOSXO0nsbrutQzILHpgK-A/exec";  // 使用你更新的 GAS URL

// 讀取 LINE Bot 的 Token
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

app.get('/', (req, res) => {
    res.send("Hello, LINE Bot Webhook with GAS!");
});

// 接收 LINE Webhook 訊息
app.post('/webhook', async (req, res) => {
    console.log("收到 LINE Webhook:", JSON.stringify(req.body, null, 2));

    if (req.body.events) {
        for (let event of req.body.events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const replyToken = event.replyToken;
                const userMessage = event.message.text.trim();

                // 強制回應，先搶佔訊息
                await replyToUser(replyToken, "🐶 小狗 Bot 收到訊息啦！正在處理...");

                // 根據關鍵字決定執行的功能
                if (/油價/.test(userMessage)) {
                    await callGASFunction("fetchOilPricesFromCloudflare", replyToken);
                } else if (/天氣/.test(userMessage)) {
                    await callGASFunction("sendWeatherUpdate", replyToken);
                } else if (/音樂|排行榜/.test(userMessage)) {
                    await callGASFunction("sendKKBOXChartsToLine", replyToken);
                } else if (/台語排行榜/.test(userMessage)) {
                    await callGASFunction("sendKKBOXTaiwaneseHotChartsToLine", replyToken);
                } else {
                    await replyToUser(replyToken, "🤖 我聽不懂，可以試試「油價」、「天氣」或「音樂」！");
                }
            }
        }
    }

    res.sendStatus(200);
});

// 呼叫 Google Apps Script API
async function callGASFunction(functionName, replyToken) {
    try {
        const response = await axios.get(GAS_URL, {
            params: { function: functionName }  // 傳遞 function 名稱到 GAS
        });

        console.log("GAS 回應:", response.data);
        await replyToUser(replyToken, response.data || "GAS 沒有回應");
    } catch (error) {
        console.error("GAS API 錯誤:", error.response ? error.response.data : error);
        await replyToUser(replyToken, "無法取得 GAS 回應");
    }
}

// 回應 LINE Bot 使用者
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

        console.log("LINE Bot 訊息已發送:", message);
    } catch (error) {
        console.error("發送 LINE 訊息時錯誤:", error.response ? error.response.data : error);
    }
}

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`Webhook 伺服器運行於 http://localhost:${PORT}`);
});
