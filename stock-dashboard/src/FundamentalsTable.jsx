import React, { useState } from "react";

const FundamentalsTable = ({
  fundamentals,
  onStockSelect,
  selectedIndicators,
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: "market_cap",
    direction: "desc",
  });

  // Map indicator to its decision field and value field
  const indicatorFields = {
    RSI: { decision: "rsiDecision", value: "latestRSI" },
    EMA: { decision: "emaDecision", value: "latestEMA9" },
    SMA: { decision: "smaDecision", value: "latestSMA20" },
    MACD: { decision: "macdDecision", value: "latestMACD" },
    ADX: { decision: "adxDecision", value: "latestADX" },
    Supertrend: { decision: "supertrendDecision", value: "latestSupertrend" },
    "Bollinger Bands": {
      decision: "bollingerDecision",
      value: "latestUpperBand",
    },
    VWAP: { decision: "vwapDecision", value: "latestVWAP" },
    "Williams %R": { decision: "williamsRDecision", value: "latestWilliamsR" },
    "Parabolic SAR": { decision: "psarDecision", value: "latestPSAR" },
    "Ichimoku Cloud": {
      decision: "ichimokuDecision",
      value: "latestTenkanSen",
    },
    ATR: { decision: "atrDecision", value: "latestATR" },
  };

  // Base columns without indicator-specific ones (exact match to original)
  const baseColumns = [
    { key: "sno", label: "S.No", width: "50px" },
    { key: "company_name", label: "Name", width: "150px" },
    { key: "current_price", label: "CMP Rs.", width: "80px" },
    { key: "pe_ratio", label: "P/E", width: "60px" },
    { key: "market_cap", label: "Mar Cap Rs.Cr.", width: "100px" },
    { key: "dividend_yield", label: "Div Yld %", width: "80px" },
    { key: "roce", label: "ROCE %", width: "80px" },
    { key: "symbol", label: "Symbol" },
    { key: "high_52w", label: "52W High" },
    { key: "low_52w", label: "52W Low" },
    { key: "pb_ratio", label: "P/B Ratio" },
    { key: "roe", label: "ROE (%)" },
    { key: "debt_to_equity", label: "Debt/Equity" },
    { key: "eps", label: "EPS" },
    { key: "eps_growth", label: "EPS Growth (%)" },
    { key: "core_ebitda", label: "Core EBITDA" },
    { key: "core_ebitda_margin", label: "EBITDA Margin (%)" },
    { key: "pat_margin", label: "PAT Margin (%)" },
    { key: "asset_turnover", label: "Asset Turnover" },
  ];

  // Dynamically add columns for each selected indicator (value and decision) and overall decision
  const columns = [
    ...baseColumns.slice(0, 7), // Up to ROCE
    ...selectedIndicators.flatMap((indicator) => [
      {
        key: indicatorFields[indicator].value,
        label: `${indicator} Value`,
        width: "80px",
      },
      {
        key: indicatorFields[indicator].decision,
        label: `${indicator} Decision`,
        width: "100px",
      },
    ]),
    ...(selectedIndicators.length > 0
      ? [{ key: "overallDecision", label: "Overall Decision", width: "120px" }]
      : []),
    ...baseColumns.slice(7),
  ];

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
        return "text-gray-500";
    }
  };

  // Filter stocks where all selected indicators have the same decision
  const filteredFundamentals = fundamentals
    .map((fund) => {
      if (selectedIndicators.length === 0) {
        return { ...fund, overallDecision: "N/A" };
      }

      const decisions = selectedIndicators.map(
        (indicator) => fund[indicatorFields[indicator].decision]
      );

      const allSameDecision = decisions.every(
        (decision, _, arr) => decision === arr[0]
      );

      if (allSameDecision) {
        return {
          ...fund,
          overallDecision: decisions[0] || "N/A",
        };
      }

      return null;
    })
    .filter((fund) => fund !== null);

  // Sort the filtered fundamentals
  const sortedFundamentals = [...filteredFundamentals].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    if (typeof aValue === "string") {
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="relative overflow-x-auto rounded-lg shadow-lg bg-white border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-gray-700 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
            {columns.map((col, index) => (
              <th
                key={col.key}
                onClick={col.key !== "sno" ? () => handleSort(col.key) : null}
                className={`px-4 py-3 text-left font-medium border-b border-gray-200 transition-all duration-300 ${
                  col.key === "overallDecision"
                    ? "bg-blue-200 text-blue-800"
                    : ""
                } ${
                  col.key !== "sno" ? "cursor-pointer hover:bg-blue-200" : ""
                } ${
                  index <= 2 || col.key === "overallDecision"
                    ? "sticky z-20"
                    : ""
                } ${
                  index <= 2 || col.key === "overallDecision"
                    ? index % 2 === 0
                      ? "bg-blue-50"
                      : "bg-blue-100"
                    : ""
                }`}
                style={{
                  width: col.width || "auto",
                  left:
                    index === 0
                      ? 0
                      : index === 1
                      ? 50
                      : index === 2
                      ? 200
                      : col.key === "overallDecision"
                      ? 280
                      : "auto",
                }}
              >
                <div className="flex items-center">
                  {col.label}
                  {col.key !== "sno" && sortConfig.key === col.key && (
                    <span className="ml-1 text-gray-500">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedFundamentals.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-gray-500"
              >
                No fundamentals data to display
              </td>
            </tr>
          ) : (
            sortedFundamentals.map((fund, index) => (
              <tr
                key={fund.fincode}
                onClick={() => onStockSelect(fund)}
                className={`border-b border-gray-100 cursor-pointer transition-all duration-300 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50 hover:shadow-sm`}
              >
                <td
                  className={`px-4 py-3 text-gray-800 sticky left-0 z-10 border-r border-gray-100 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50`}
                >
                  {index + 1}
                </td>
                <td
                  className={`px-4 py-3 text-gray-700 font-medium sticky left-[50px] z-10 border-r border-gray-100 truncate ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50`}
                >
                  {fund.company_name}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.current_price ? fund.current_price.toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.pe_ratio ? fund.pe_ratio.toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.market_cap ? fund.market_cap.toLocaleString() : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.dividend_yield ? fund.dividend_yield.toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.roce ? fund.roce.toFixed(2) : "N/A"}
                </td>
                {/* Dynamic Indicator Columns */}
                {selectedIndicators.map((indicator) => (
                  <React.Fragment key={indicator}>
                    <td className="px-4 py-3 text-gray-800">
                      {fund[indicatorFields[indicator].value] !== null
                        ? Number(
                            fund[indicatorFields[indicator].value]
                          ).toFixed(2)
                        : "N/A"}
                    </td>
                    <td
                      className={`px-4 py-3 ${getDecisionColor(
                        fund[indicatorFields[indicator].decision]
                      )} font-medium`}
                    >
                      {fund[indicatorFields[indicator].decision]}
                    </td>
                  </React.Fragment>
                ))}
                {selectedIndicators.length > 0 && (
                  <td
                    className={`px-4 py-3 ${getDecisionColor(
                      fund.overallDecision
                    )} sticky left-[280px] z-10 bg-blue-50 border-r border-gray-100 font-semibold`}
                  >
                    {fund.overallDecision}
                  </td>
                )}
                <td
                  className={`px-4 py-3 text-gray-800 sticky left-[200px] z-10 border-r border-gray-100 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50`}
                >
                  {fund.symbol}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.high_52w ? fund.high_52w.toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.low_52w ? fund.low_52w.toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.pb_ratio ? fund.pb_ratio.toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.roe ? fund.roe.toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.debt_to_equity ? fund.debt_to_equity.toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.eps ? fund.eps.toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.eps_growth ? fund.eps_growth.toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.core_ebitda ? fund.core_ebitda.toLocaleString() : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.core_ebitda_margin
                    ? fund.core_ebitda_margin.toFixed(2)
                    : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.pat_margin ? fund.pat_margin.toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {fund.asset_turnover ? fund.asset_turnover.toFixed(2) : "N/A"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FundamentalsTable;
