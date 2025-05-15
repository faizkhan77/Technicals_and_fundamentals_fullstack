import React from "react";

const StockTable = ({
  stocks,
  onStockSelect,
  visibleIndicators,
  onSort,
  sortConfig,
}) => {
  const getDecisionColor = (decision) => {
    switch (decision?.toLowerCase()) {
      case "strong buy":
        return "text-green-600 font-semibold";
      case "buy":
        return "text-green-500";
      case "neutral":
        return "text-gray-500";
      case "sell":
        return "text-red-500";
      case "strong sell":
        return "text-red-600 font-semibold";
      default:
        return "text-gray-400"; // For undefined or invalid
    }
  };

  const columns = [
    { key: "RSI Value", label: "RSI Value" },
    { key: "company_name", label: "Company" },
    { key: "latestPrice", label: "Price" },
    { key: "decision", label: "Decision" },
    ...(visibleIndicators.RSI ? [{ key: "RSI", label: "RSI" }] : []),
    ...(visibleIndicators.EMA ? [{ key: "EMA", label: "EMA" }] : []),
    ...(visibleIndicators.SMA ? [{ key: "SMA", label: "SMA" }] : []),
    ...(visibleIndicators.MACD ? [{ key: "MACD", label: "MACD" }] : []),
    ...(visibleIndicators.ADX ? [{ key: "ADX", label: "ADX" }] : []),
    ...(visibleIndicators.Supertrend
      ? [{ key: "Supertrend", label: "Supertrend" }]
      : []),
    ...(visibleIndicators.BollingerBands
      ? [{ key: "BollingerBands", label: "Bollinger" }]
      : []),
    ...(visibleIndicators.VWAP ? [{ key: "VWAP", label: "VWAP" }] : []),
    ...(visibleIndicators.WilliamsR
      ? [{ key: "WilliamsR", label: "Williams %R" }]
      : []),
    ...(visibleIndicators.PSAR ? [{ key: "PSAR", label: "PSAR" }] : []),
    ...(visibleIndicators.Ichimoku
      ? [{ key: "Ichimoku", label: "Ichimoku" }]
      : []),
    ...(visibleIndicators.ATR ? [{ key: "ATR", label: "ATR" }] : []),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider sticky top-0 z-10">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() =>
                  ![
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
                  ].includes(col.key) && onSort(col.key)
                }
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-200 transition-all duration-200"
              >
                <div className="flex items-center">
                  {col.label}
                  {sortConfig.key === col.key && (
                    <span className="ml-1">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stocks.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-gray-500"
              >
                No stocks to display
              </td>
            </tr>
          ) : (
            stocks.map((stock, index) => (
              <tr
                key={stock.scripcode}
                onClick={() => onStockSelect(stock)}
                className={`border-b border-gray-200 cursor-pointer transition-all duration-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50`}
              >
                <td className="px-4 py-3 text-gray-800 font-medium">
                  {stock.latestRSI}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {stock.company_name}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {stock.latestPrice.toFixed(2)}
                </td>
                <td className={`px-4 py-3 ${getDecisionColor(stock.decision)}`}>
                  {stock.decision || "N/A"}
                </td>
                {visibleIndicators.RSI && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      stock.indicatorDecisions.RSI
                    )}`}
                  >
                    {stock.indicatorDecisions.RSI}
                  </td>
                )}
                {visibleIndicators.EMA && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      stock.indicatorDecisions.EMA
                    )}`}
                  >
                    {stock.indicatorDecisions.EMA}
                  </td>
                )}
                {visibleIndicators.SMA && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      stock.indicatorDecisions.SMA
                    )}`}
                  >
                    {stock.indicatorDecisions.SMA}
                  </td>
                )}
                {visibleIndicators.MACD && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      stock.indicatorDecisions.MACD
                    )}`}
                  >
                    {stock.indicatorDecisions.MACD}
                  </td>
                )}
                {visibleIndicators.ADX && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      stock.indicatorDecisions.ADX
                    )}`}
                  >
                    {stock.indicatorDecisions.ADX}
                  </td>
                )}
                {visibleIndicators.Supertrend && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      stock.indicatorDecisions.Supertrend
                    )}`}
                  >
                    {stock.indicatorDecisions.Supertrend}
                  </td>
                )}
                {visibleIndicators.BollingerBands && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      stock.indicatorDecisions.BollingerBands
                    )}`}
                  >
                    {stock.indicatorDecisions.BollingerBands}
                  </td>
                )}
                {visibleIndicators.VWAP && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      stock.indicatorDecisions.VWAP
                    )}`}
                  >
                    {stock.indicatorDecisions.VWAP}
                  </td>
                )}
                {visibleIndicators.WilliamsR && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      stock.indicatorDecisions.WilliamsR
                    )}`}
                  >
                    {stock.indicatorDecisions.WilliamsR}
                  </td>
                )}
                {visibleIndicators.PSAR && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      stock.indicatorDecisions.PSAR
                    )}`}
                  >
                    {stock.indicatorDecisions.PSAR}
                  </td>
                )}
                {visibleIndicators.Ichimoku && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      stock.indicatorDecisions.Ichimoku
                    )}`}
                  >
                    {stock.indicatorDecisions.Ichimoku}
                  </td>
                )}
                {visibleIndicators.ATR && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      stock.indicatorDecisions.ATR
                    )}`}
                  >
                    {stock.indicatorDecisions.ATR}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;
