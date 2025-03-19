app.post('/webhook', async (req, res) => {
    console.log("📩 收到 LINE Webhook:", JSON.stringify(req.body, null, 2));

    if (req.body.events) {
        for (let event of req.body.events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const replyToken = event.replyToken;
                const userMessage = event.message.text.trim();
                const userId = event.source.userId;  // 取得發訊息的使用者 ID
                const myUserId = "U940eccba4cc3b3a6a27b389beed1b0d5";  // 🔹 這裡填入你的 LINE ID

                console.log("🔎 使用者 ID:", userId);
                console.log("📝 使用者訊息:", userMessage);

                if (userId === myUserId) {
                    console.log("🎯 這是你的訊息，正常回應你");
                    storedReplyToken = replyToken;
                    storedReplyTokenTimestamp = Date.now();

                    // 📌 你的訊息 → 正常處理
                    if (/油價/.test(userMessage)) {
                        await callGASFunction("fetchOilPricesFromCloudflare");
                    } else if (/天氣/.test(userMessage)) {
                        await callGASFunction("sendWeatherUpdate");
                    } else if (/音樂|排行榜/.test(userMessage)) {
                        await callGASFunction("sendKKBOXChartsToLine");
                    } else if (/台語排行榜/.test(userMessage)) {
                        await callGASFunction("sendKKBOXTaiwaneseHotChartsToLine");
                    } else if (/空氣品質/.test(userMessage)) { 
                        await callGASFunction("sendAirQualityUpdate");
                    } else {
                        await replyToUser(replyToken, "😺 喵～主人！你可以輸入「天氣」、「油價」或「排行榜」喵！");
                    }
                } else {
                    console.log("🎯 這是朋友的訊息，正常回應朋友，不傳給你");
                    storedReplyToken = replyToken;
                    storedReplyTokenTimestamp = Date.now();

                    // 📌 朋友的訊息 → 正常處理
                    if (/油價/.test(userMessage)) {
                        await callGASFunction("fetchOilPricesFromCloudflare");
                    } else if (/天氣/.test(userMessage)) {
                        await callGASFunction("sendWeatherUpdate");
                    } else if (/音樂|排行榜/.test(userMessage)) {
                        await callGASFunction("sendKKBOXChartsToLine");
                    } else if (/台語排行榜/.test(userMessage)) {
                        await callGASFunction("sendKKBOXTaiwaneseHotChartsToLine");
                    } else if (/空氣品質/.test(userMessage)) { 
                        await callGASFunction("sendAirQualityUpdate");
                    } else {
                        await replyToUser(replyToken, "😸 喵？聽不懂喵～可以輸入「天氣」、「油價」或「排行榜」喵！");
                    }
                }
            }
        }
    }

    res.sendStatus(200);
});
