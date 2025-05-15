const express = require("express");
const getStockData = require("./analyzeStocks");
const fundamentalsRouter = require("./fundamentals"); // Add this line to import the fundamentals router
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());

app.get("/api/stock-decisions", async (req, res) => {
  try {
    const data = await getStockData();
    res.json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add the fundamentals endpoint by mounting the router
app.use("/api/fundamentals", fundamentalsRouter);

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
