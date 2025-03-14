const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');  // 用來發送回應給 LINE
require('dotenv').config(); // 如果你有環境變數

const app = express();
const PORT = process.env.PORT || 3000;

// LINE Messaging API Token（請填入你的 Channel Access Token）
const LINE_ACCESS_TOKEN = 'O4z72PDZCC9kwGfLYAqk2Op4mz2mSnCN14aNC01Y2grDjaBsPssLwmKux/fK4h9ydm8tlOdSQCyG/FLVTrBnWWVFDMR6xwNl2w9a9CeQItqBKh6s0vHwo2DsDAbA6MWljGK2ZLvYnI5W03qcrWJT9QdB04t89/1O/w1cDnyilFU=';

app.use(bodyParser.json());

// 根路徑測試
app.get('/', (req, res) => {
    res.send('🚀 MomsLineBot Webhook is running!');
});

// 處理 LINE Webhook 請求
app.post('/webhook', async (req, res) => {
    console.log('📩 Received Webhook:', req.body);

    // 確保 webhook 事件存在
    if (req.body.events && req.body.events.length > 0) {
        for (const event of req.body.events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const userMessage = event.message.text;  // 使用者傳的訊息
                const replyToken = event.replyToken;  // 用來回覆訊息

                // 呼叫 LINE Messaging API 回覆訊息
                await replyMessage(replyToken, userMessage);
            }
        }
    }

    res.status(200).send('✅ Webhook received!');
});

// 用來回覆 LINE 訊息的函數
const replyMessage = async (replyToken, message) => {
    const url = 'https://api.line.me/v2/bot/message/reply';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
    };
    const body = {
        replyToken: replyToken,
        messages: [{ type: 'text', text: `你說：${message}` }]
    };

    try {
        await axios.post(url, body, { headers });
        console.log('✅ 回覆成功！');
    } catch (error) {
        console.error('❌ 回覆失敗:', error.response ? error.response.data : error.message);
    }
};

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
