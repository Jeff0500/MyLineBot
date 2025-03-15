const express = require("express");
const axios = require("axios");
const csvParser = require("csv-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const CSV_URL = "http://www3.cpc.com.tw/opendata_d00/webservice/中油主要產品牌價.csv";

// 允許 JSON 請求
app.use(express.json());

// 測試首頁
app.get("/", (req, res) => {
    res.send("✅ MomsLineBot 伺服器運行中！");
});

// 下載並解析 CSV
async function fetchOilPrices() {
    try {
        console.log("🔄 正在下載油價 CSV...");
        const response = await axios.get(CSV_URL, {
            responseType: "stream",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        return new Promise((resolve, reject) => {
            const results = [];
            response.data
                .pipe(csvParser())
                .on("data", (data) => {
                    console.log("🔍 解析到的資料：", data); // ✅ Log 確認數據
                    results.push(data);
                })
                .on("end", () => {
                    console.log("✅ CSV 下載並解析完成，共取得", results.length, "筆資料");
                    resolve(results);
                })
                .on("error", (error) => {
                    console.error("❌ CSV 解析失敗", error.message);
                    reject(error);
                });
        });
    } catch (error) {
        console.error("❌ 下載 CSV 失敗", error.message);
        return null;
    }
}

// POST 方法來獲取油價
app.post("/oil-price", async (req, res) => {
    console.log("📢 收到 POST 請求：/oil-price");
    const csvData = await fetchOilPrices();

    if (!csvData) {
        console.error("❌ 無法取得 CSV 數據");
        return res.status(500).json({ error: "無法取得油價數據" });
    }

    const oilPrices = { "92無鉛": "❌ 未找到", "95無鉛": "❌ 未找到" };
    
    csvData.forEach((row) => {
        if (row["產品名稱"] && row["參考牌價"]) {
            console.log(`✅ 找到 ${row["產品名稱"]}，價格：${row["參考牌價"]}`);
        } else {
            console.log("⚠️ 無效的數據行：", row);
        }

        if (row["產品名稱"] === "92無鉛汽油") oilPrices["92無鉛"] = row["參考牌價"];
        if (row["產品名稱"] === "95無鉛汽油") oilPrices["95無鉛"] = row["參考牌價"];
    });

    console.log("✅ 油價數據發送成功", oilPrices);
    res.json({
        message: "✅ 最新油價資訊",
        prices: oilPrices,
    });
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`🚀 伺服器運行中：https://momslinebot.onrender.com`);
});
