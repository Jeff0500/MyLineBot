export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // 🔹 手動更新油價
        if (url.pathname === "/trigger-update") {
            console.log("📢 手動觸發油價更新！");
            await updateOilPrices(env);
            return new Response("✅ 油價更新完成！", { status: 200 });
        }

        // 🔹 提供最新油價
        if (url.pathname === "/oil-price") {
            const oilPrices = await getLatestOilPrices(env);
            return new Response(JSON.stringify({
                message: "✅ 最新油價資訊",
                prices: oilPrices,
            }), { headers: { "Content-Type": "application/json" } });
        }

        return new Response("❌ 無效的 API 路徑", { status: 404 });
    }
};

// ✅ **更新油價並存入 KV**
async function updateOilPrices(env) {
    try {
        console.log("🔄 正在更新油價 CSV...");
        const response = await fetch("http://www3.cpc.com.tw/opendata_d00/webservice/中油主要產品牌價.csv");
        const csvText = await response.text();
        
        const oilPrices = csvToJson(csvText);
        const filteredPrices = {
            "92無鉛": getPrice(oilPrices, "92無鉛汽油"),
            "95無鉛": getPrice(oilPrices, "95無鉛汽油"),
        };
        
        await env.OIL_PRICES.put("latest", JSON.stringify(filteredPrices)); // 存入 KV
        console.log("✅ 油價已更新！", filteredPrices);
    } catch (error) {
        console.error("❌ 更新油價失敗：", error);
    }
}

// ✅ **從 KV 取得最新油價**
async function getLatestOilPrices(env) {
    const storedData = await env.OIL_PRICES.get("latest");
    if (!storedData) {
        console.log("⚠️ 沒有最新的油價數據，重新抓取...");
        await updateOilPrices(env);
    }
    return storedData ? JSON.parse(storedData) : { "92無鉛": "❌ 未找到", "95無鉛": "❌ 未找到" };
}

// ✅ **解析 CSV 成 JSON**
function csvToJson(csvText) {
    const rows = csvText.split("\n").map(row => row.split(","));
    const headers = rows[0];
    return rows.slice(1).map(row => Object.fromEntries(row.map((cell, i) => [headers[i], cell])));
}

// ✅ **從資料中找出油價**
function getPrice(data, productName) {
    const product = data.find(row => row["產品名稱"] === productName);
    return product ? product["參考牌價"] : "❌ 未找到";
}

// 🔥 **定時自動更新油價**（每週一 9:00 AM）
addEventListener("scheduled", (event, env) => {
    event.waitUntil(updateOilPrices(env));
});
