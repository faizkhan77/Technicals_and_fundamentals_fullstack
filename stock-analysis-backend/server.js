const express = require("express");
const getStockData = require("./analyzeStocks");
const fundamentalsRouter = require("./fundamentals");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());

app.get("/api/stock-decisions", async (req, res) => {
  try {
    // Extract selectedIndicators from query parameters
    const selectedIndicators = req.query.selectedIndicators
      ? req.query.selectedIndicators.split(",")
      : [
          "RSI",
          "EMA",
          "SMA",
          "MACD",
          "ADX",
          "Supertrend",
          "BollingerBands",
          "VWAP",
          "WilliamsR",
          "PSAR",
          "Ichimoku",
          "ATR",
        ];
    const data = await getStockData(selectedIndicators);
    res.json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use("/api/fundamentals", fundamentalsRouter);

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
