const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;  // 使用環境變數儲存 Token

app.post("/webhook", async (req, res) => {
  console.log("Webhook received!", req.body);  // Log 來確認有收到請求

  const events = req.body.events;
  if (!events || events.length === 0) {
    return res.status(200).send("No events");
  }

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const replyToken = event.replyToken;
      const userMessage = event.message.text;
      const replyMessage = `你說的是: ${userMessage}`;

      await replyToLine(replyToken, replyMessage);
    }
  }

  res.status(200).send("OK");
});

/**
 * 回覆用戶的訊息
 * @param {string} replyToken - 用戶的回覆 Token
 * @param {string} message - 要回傳的訊息
 */
async function replyToLine(replyToken, message) {
  const url = "https://api.line.me/v2/bot/message/reply";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`,
  };

  const body = {
    replyToken: replyToken,
    messages: [{ type: "text", text: message }],
  };

  try {
    await axios.post(url, body, { headers });
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

// 🔹 這一行是 Vercel API 必須的
module.exports = app;
