require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Google Apps Script Web API URL（這裡的 URL 要改成你的 GAS 網址）
const GAS_URL = "https://script.google.com/macros/s/AKfycbyVEhVIADPYWQumW3VudLoCuEGpyhG-2DjT7gbFl9V_affxowNjDY73oEiUe7Oo3iDEIA/exec";

// 讀取 LINE Bot 的 Token
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

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
                
                // 如果使用者輸入「油價」，呼叫 GAS API 執行 sendAirQualityUpdate()
                if (userMessage.includes("油價")) {
                    const gasResponse = await callGASFunction("sendAirQualityUpdate");

                    // 回覆使用者 GAS 回應的內容
                    await replyToUser(replyToken, gasResponse);
                } else {
                    await replyToUser(replyToken, `你說了：「${userMessage}」，但我不懂 😅`);
                }
            }
        }
    }

    res.sendStatus(200);
});

// 呼叫 Google Apps Script API，執行指定函式
async function callGASFunction(functionName) {
    try {
        const response = await axios.get(GAS_URL, {
            params: { function: functionName } // 確保這裡的 function 參數傳遞正確
        });

        console.log("GAS 回應:", response.data); // 這裡會顯示 GAS 的回應，檢查 logs
        return response.data || "GAS 沒有回應";
    } catch (error) {
        console.error("GAS API 錯誤:", error.response ? error.response.data : error);
        return "無法取得 GAS 回應";
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
