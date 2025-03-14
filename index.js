const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

const GAS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzF-LIxT32Yh6dVsjxzvMX65Cyxt4tVPkD3xRZC2KvdQejf9nPU8skOdqlWLHJhEnzQ/exec"; // 這個是你的 GAS URL

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
    console.log("📩 Received Webhook from LINE:", req.body); // 檢查有沒有收到 Webhook 請求

    try {
        // 正常轉發 Webhook 到 GAS
        await axios.post(GAS_WEBHOOK_URL, req.body);
        console.log("✅ Successfully forwarded to GAS");
        res.status(200).send("✅ Forwarded to GAS");
    } catch (error) {
        console.error("❌ Failed to forward to GAS:", error.message);
        res.status(500).send("❌ Failed to forward to GAS");
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Webhook server is running on port ${PORT}`);
});
