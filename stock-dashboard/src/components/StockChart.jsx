import React, { useState } from "react";
import Plot from "react-plotly.js";

const StockChart = ({ stockData }) => {
  const [selectedStockIndex, setSelectedStockIndex] = useState(100);

  // Select the stock based on the index
  const selectedStock = stockData[selectedStockIndex];

  // Prepare the plot data for the selected stock
  const plotData = [
    {
      x: selectedStock.dates,
      y: selectedStock.closes,
      type: "scatter",
      mode: "lines+markers",
      name: selectedStock.symbol,
      line: {
        color: "#10B981",
        width: 2,
        shape: "spline", // Smooth line
      },
      marker: {
        color: "#10B981",
        size: 6,
        symbol: "circle",
        line: { color: "#059669", width: 1 },
      },
      hovertemplate: `<b>${selectedStock.symbol}</b><br>Date: %{x|%Y-%m-%d}<br>Price: $%{y:.2f}<extra></extra>`,
    },
  ];

  const layout = {
    title: {
      text: `${selectedStock.symbol} - Stock Price Trend`,
      font: {
        family: "Inter, sans-serif",
        size: 24,
        color: "#FFFFFF",
      },
      x: 0.5,
      xanchor: "center",
    },
    xaxis: {
      title: {
        text: "Date",
        font: { color: "#A1A1AA" },
      },
      tickformat: "%b %Y",
      tickfont: { color: "#A1A1AA" },
      gridcolor: "#27272A",
      linecolor: "#3F3F46",
      zeroline: false,
    },
    yaxis: {
      title: {
        text: "Price (USD)",
        font: { color: "#A1A1AA" },
      },
      tickfont: { color: "#A1A1AA" },
      gridcolor: "#27272A",
      linecolor: "#3F3F46",
      zeroline: false,
    },
    showlegend: true,
    legend: {
      font: { color: "#A1A1AA" },
      bgcolor: "rgba(0, 0, 0, 0.5)",
      bordercolor: "#3F3F46",
      borderwidth: 1,
      x: 1,
      xanchor: "right",
      y: 1,
      yanchor: "top",
    },
    plot_bgcolor: "#18181B",
    paper_bgcolor: "#18181B",
    font: {
      family: "Inter, sans-serif",
      size: 14,
      color: "#FFFFFF",
    },
    hovermode: "x unified",
    hoverlabel: {
      bgcolor: "#27272A",
      font: { color: "#FFFFFF" },
      bordercolor: "#3F3F46",
    },
    margin: {
      t: 60,
      b: 60,
      l: 60,
      r: 60,
    },
    autosize: true,
  };

  const config = {
    responsive: true,
    displayModeBar: false, // Hide Plotly toolbar for a cleaner look
  };

  return (
    <div className="relative w-full max-w-7xl h-[80vh] p-6 bg-zinc-900 rounded-xl shadow-2xl mx-auto">
      {/* Dropdown to select stock */}
      <div className="absolute top-6 left-6 z-10">
        <select
          onChange={(e) => setSelectedStockIndex(Number(e.target.value))}
          value={selectedStockIndex}
          className="bg-zinc-800 text-white p-3 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
        >
          {stockData.map((stock, index) => (
            <option
              key={index}
              value={index}
              className="bg-zinc-800 text-white"
            >
              {stock.symbol}
            </option>
          ))}
        </select>
      </div>

      {/* Plotly chart */}
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        className="w-full h-full"
      />
    </div>
  );
};

export default StockChart;
