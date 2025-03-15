// 🔹 載入必要的模組
require("dotenv").config(); // 加載 .env 文件中的環境變數
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔹 讀取環境變數
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Gemini API Key
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN; // LINE Bot Token

// 🔹 Webhook 接收來自 LINE Bot 的訊息
app.post("/webhook", async (req, res) => {
  console.log("📩 Webhook received:", req.body); // 確認收到請求

  const events = req.body.events;
  if (!events || events.length === 0) {
    return res.status(200).send("No events");
  }

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const replyToken = event.replyToken;
      const userMessage = event.message.text;

      // 🔥 調用 Gemini API 來生成回應
      const geminiReply = await getGeminiResponse(userMessage);

      // 🔥 回傳來自 Gemini API 的回應
      await replyToLine(replyToken, geminiReply);
    }
  }

  res.status(200).send("OK");
});

/**
 * 🔥 使用 Gemini API 生成回應
 * @param {string} message - 使用者輸入的訊息
 * @returns {string} - 來自 Gemini API 的回應
 */
async function getGeminiResponse(message) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;

  const headers = {
    "Content-Type": "application/json",
  };

  const body = {
    contents: [
      {
        parts: [{ text: message }],
      },
    ],
  };

  try {
    const response = await axios.post(url, body, { headers });

    if (response.data && response.data.candidates) {
      const replyMessage = response.data.candidates[0].content.parts[0].text.trim();
      console.log("✅ [Gemini 回應]:", replyMessage);
      return replyMessage;
    } else {
      console.log("⚠️ [Gemini 回應錯誤]: 無法解析回應");
      return "抱歉，我無法理解你的訊息。";
    }
  } catch (error) {
    console.error("❌ [Gemini API 錯誤]:", error);
    return "抱歉，發生錯誤，請稍後再試！";
  }
}

/**
 * 🔥 發送回應訊息到 LINE Bot
 * @param {string} replyToken - LINE Bot 產生的回應 Token
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
    console.log("✅ [LINE 回應成功]");
  } catch (error) {
    console.error("❌ [LINE 回應錯誤]:", error);
  }
}

// 🔹 Vercel 部署時需要匯出 app
module.exports = app;

