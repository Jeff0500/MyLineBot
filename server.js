require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Google Apps Script Web API URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbyVEhVIADPYWQumW3VudLoCuEGpyhG-2DjT7gbFl9V_affxowNjDY73oEiUe7Oo3iDEIA/exec";

// 測試用 GET（可瀏覽器測試）
app.get('/', (req, res) => {
    res.send("Hello, LINE Bot Webhook with GAS!");
});

// 接收 LINE Webhook
app.post('/webhook', async (req, res) => {
    console.log("收到 LINE Webhook:", JSON.stringify(req.body, null, 2));

    if (req.body.events) {
        for (let event of req.body.events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const replyToken = event.replyToken;
                const userMessage = event.message.text;
                
                // 轉發訊息給 Google Apps Script
                const gasResponse = await sendToGAS(userMessage);

                // 回覆使用者 Google Apps Script 的回應
                await replyToUser(replyToken, gasResponse);
            }
        }
    }

    res.sendStatus(200);
});

// 發送訊息到 Google Apps Script
async function sendToGAS(message) {
    try {
        const response = await axios.get(GAS_URL, {
            params: { text: message } // 傳遞使用者訊息到 GAS
        });

        console.log("GAS 回應:", response.data);
        return response.data || "GAS 沒有回應";
    } catch (error) {
        console.error("GAS API 錯誤:", error.response ? error.response.data : error);
        return "無法取得 GAS 回應";
    }
}

// 回應 LINE Bot 使用者
async function replyToUser(replyToken, message) {
    const LINE_API_URL = 'https://api.line.me/v2/bot/message/reply';
    const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN; // 你的 LINE Token

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
