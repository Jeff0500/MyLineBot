const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");  // 用來發送回應給 LINE
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const LINE_ACCESS_TOKEN = "你的 LINE 服務的 Channel Access Token";  // 填入你的 Channel Access Token
const MOM_LINE_USER_ID = "你媽媽的 LINE User ID";  // 如果你已經知道你媽媽的 User ID，填這裡

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  console.log("📩 Received Webhook from LINE:", req.body);  // 記錄 Webhook 資料

  // 確保 Webhook 事件存在
  if (req.body.events && req.body.events.length > 0) {
    for (const event of req.body.events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text;  // 使用者發送的訊息
        const replyToken = event.replyToken;  // 回覆用的 Token
        const userId = event.source.userId;  // 使用者的 LINE User ID
        
        console.log("來自使用者的訊息：" + userMessage);
        console.log("使用者的 LINE User ID：" + userId);  // 這就是你媽媽的 User ID
        
        // 發送回應訊息給 LINE，用 `userId` 可以發送訊息給你媽媽
        await replyMessage(replyToken, userMessage);

        // 如果是你媽媽的 User ID，就發送專屬訊息給她
        if (userId === MOM_LINE_USER_ID) {
          await sendLineMessage(MOM_LINE_USER_ID, "媽媽，這是你專屬的訊息！")
        }
      }
    }
  }

  res.status(200).send("✅ Webhook received!");
});

// 用來回覆 LINE 訊息的函式
const replyMessage = async (replyToken, message) => {
  const url = "https://api.line.me/v2/bot/message/reply";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`
  };
  const body = {
    replyToken: replyToken,
    messages: [{ type: "text", text: `你說：${message}` }]
  };

  try {
    await axios.post(url, body, { headers });
    console.log("✅ 回覆成功！");
  } catch (error) {
    console.error("❌ 回覆失敗:", error.response ? error.response.data : error.message);
  }
};

// 用來發送訊息給指定 User 的函式
const sendLineMessage = async (userId, message) => {
  const url = "https://api.line.me/v2/bot/message/push";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`
  };
  const body = {
    to: userId,
    messages: [{ type: "text", text: message }]
  };

  try {
    await axios.post(url, body, { headers });
    console.log("✅ 訊息已成功發送給 " + userId);
  } catch (error) {
    console.error("❌ 發送訊息失敗:", error.response ? error.response.data : error.message);
  }
};

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 Webhook server is running on port ${PORT}`);
});
