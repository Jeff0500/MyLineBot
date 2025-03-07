const functions = require("firebase-functions");
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const LINE_ACCESS_TOKEN =
  "nv1uc5FBYa1YpBRpKeU5exnVnaa/gyY5pkVL+ZFDDs62rY" +
  "lOcxMx2pKa8XJx5DCZtfWYI9mgetqMpvJFH9FKR3lVek4o" +
  "9UUStZe0dkg8/17OGyFQKIfYbjtIYD0IyqF9wpkh0m1aaT" +
  "pCp7PDRRzswAdB04t89/1O/w1cDnyilFU=";

app.post("/webhook", async (req, res) => {
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
    messages: [{type: "text", text: message}],
  };

  try {
    await axios.post(url, body, {headers});
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

exports.lineBot = functions.https.onRequest(app);
