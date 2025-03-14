const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// 使用 Render 自動分配的 PORT，確保伺服器可以正確啟動
const PORT = process.env.PORT || 3000;

// Middleware 解析 JSON 請求
app.use(bodyParser.json());

// 測試根路由，確認伺服器是否運行
app.get('/', (req, res) => {
    res.send('🚀 MomsLineBot Webhook Server is running!');
});

// LINE Bot Webhook 端點
app.post('/webhook', (req, res) => {
    console.log('📩 Received Webhook:', req.body);
    res.status(200).send('✅ Webhook received!');
});

// 監聽 PORT，啟動伺服器
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
