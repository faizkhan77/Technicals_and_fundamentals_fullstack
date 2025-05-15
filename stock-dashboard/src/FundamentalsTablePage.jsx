import React, { useState, useEffect } from "react";
import axios from "axios";
import FundamentalsTable from "./FundamentalsTable";

const FundamentalsTablePage = () => {
  const [fundamentals, setFundamentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [filteredFundamentals, setFilteredFundamentals] = useState([]);
  const [selectedIndicators, setSelectedIndicators] = useState([]); // Now an array
  const [activeTab, setActiveTab] = useState("All");
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch data from the fundamentals endpoint
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fundamentalsResponse = await axios.get(
          "http://localhost:3000/api/fundamentals"
        );
        const validFundamentals = fundamentalsResponse.data.filter(
          (stock) =>
            stock &&
            typeof stock.symbol === "string" &&
            typeof stock.company_name === "string"
        );

        // Filter out stocks where any decision field is "N/A"
        const decisionFields = [
          "rsiDecision",
          "emaDecision",
          "smaDecision",
          "macdDecision",
          "adxDecision",
          "supertrendDecision",
          "bollingerDecision",
          "vwapDecision",
          "williamsRDecision",
          "psarDecision",
          "ichimokuDecision",
          "atrDecision",
        ];

        const filteredFundamentals = validFundamentals.filter((stock) =>
          decisionFields.every((field) => stock[field] !== "N/A")
        );

        // Compute overall decision for each stock based on selected indicators
        const fundamentalsWithOverall = filteredFundamentals.map((stock) =>
          computeOverallDecision(stock, selectedIndicators)
        );

        setFundamentals(fundamentalsWithOverall);
        setFilteredFundamentals(fundamentalsWithOverall);

        console.log("Fundamentals Count:", fundamentalsWithOverall.length);
        console.log(
          "Sample Fundamentals:",
          fundamentalsWithOverall.slice(0, 2)
        );

        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch data");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Recompute overall decision whenever selectedIndicators changes
  useEffect(() => {
    const updatedFundamentals = fundamentals.map((stock) =>
      computeOverallDecision(stock, selectedIndicators)
    );
    setFundamentals(updatedFundamentals);
    setFilteredFundamentals(updatedFundamentals);
    setPage(1);
  }, [selectedIndicators]);

  // List of indicators for the dropdown
  const indicators = [
    "RSI",
    "EMA",
    "SMA",
    "MACD",
    "ADX",
    "Supertrend",
    "Bollinger Bands",
    "VWAP",
    "Williams %R",
    "Parabolic SAR",
    "Ichimoku Cloud",
    "ATR",
  ];

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

  // Ranking logic for overall decision
  const computeOverallDecision = (stock, selectedIndicators) => {
    if (!selectedIndicators || selectedIndicators.length === 0) {
      return { ...stock, overallDecision: "N/A" };
    }

    const decisionScores = {
      "Strong Buy": 2,
      Buy: 1,
      Neutral: 0,
      Sell: -1,
      "Strong Sell": -2,
    };

    const weights = {
      RSI: 1,
      EMA: 1.5,
      SMA: 1.5,
      MACD: 1,
      ADX: 1,
      Supertrend: 1.5,
      "Bollinger Bands": 1,
      VWAP: 1,
      "Williams %R": 1,
      "Parabolic SAR": 1,
      "Ichimoku Cloud": 1.5,
      ATR: 1,
    };

    const totalScore = selectedIndicators.reduce((sum, indicator) => {
      const decisionField = indicatorFields[indicator].decision;
      const decision = stock[decisionField];
      const score = decisionScores[decision] || 0;
      const weight = weights[indicator] || 1;
      return sum + score * weight;
    }, 0);

    let overallDecision = "Neutral";
    if (totalScore >= 1.5) overallDecision = "Strong Buy";
    else if (totalScore >= 0.5) overallDecision = "Buy";
    else if (totalScore <= -1.5) overallDecision = "Strong Sell";
    else if (totalScore <= -0.5) overallDecision = "Sell";

    return { ...stock, overallDecision };
  };

  // Step 1: Apply the same filtering logic as FundamentalsTable (all indicators must agree)
  const filteredByAgreement = fundamentals
    .map((fund) => {
      if (selectedIndicators.length === 0) {
        return { ...fund, overallDecision: "N/A" };
      }

      // Get the decisions for all selected indicators
      const decisions = selectedIndicators.map(
        (indicator) => fund[indicatorFields[indicator].decision]
      );

      // Check if all decisions are the same
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

  // Step 2: Apply tab filter (based on overallDecision set by the agreement logic)
  const filteredByIndicator =
    selectedIndicators.length > 0
      ? filteredByAgreement.filter(
          (stock) =>
            activeTab === "All" ||
            (stock.overallDecision &&
              stock.overallDecision.toLowerCase() === activeTab.toLowerCase())
        )
      : filteredByAgreement;

  // Step 3: Apply query filter
  const filteredByQuery = query.trim()
    ? filteredByIndicator.filter((stock) => {
        try {
          const conditions = query.split("AND").map((cond) => cond.trim());
          return conditions.every((condition) => {
            for (const indicator of indicators) {
              if (condition.includes(indicator)) {
                const [_, operator, value] =
                  condition.match(
                    new RegExp(`${indicator}\\s*([<>=])\\s*(\\d+)`)
                  ) || [];
                if (!operator || !value) return false;
                const indicatorValue =
                  stock[indicatorFields[indicator].value] !== null
                    ? parseFloat(stock[indicatorFields[indicator].value])
                    : null;
                const val = parseFloat(value);
                if (indicatorValue === null) return false;
                if (operator === "<") return indicatorValue < val;
                if (operator === ">") return indicatorValue > val;
                if (operator === "=") return indicatorValue === val;
              }
            }
            if (condition.includes("Market Capitalization")) {
              const [_, operator, value] =
                condition.match(/Market Capitalization\s*([<>=])\s*(\d+)/) ||
                [];
              if (!operator || !value) return false;
              const mcap =
                stock.market_cap !== null ? parseFloat(stock.market_cap) : 0;
              const val = parseFloat(value);
              if (operator === "<") return mcap < val;
              if (operator === ">") return mcap > val;
              if (operator === "=") return mcap === val;
            }
            return true;
          });
        } catch (err) {
          console.error("Invalid query:", err);
          return true; // Keep the stock if query parsing fails
        }
      })
    : filteredByIndicator;

  // Step 4: Compute tab counts based on filteredByAgreement (before tab and query filters)
  const tabCounts =
    selectedIndicators.length > 0
      ? filteredByAgreement.reduce(
          (counts, stock) => {
            counts.All += 1;
            const decision = stock.overallDecision;
            if (decision) {
              const tabKey = decision
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
              if (counts[tabKey] !== undefined) {
                counts[tabKey] += 1;
              }
            }
            return counts;
          },
          {
            All: 0,
            "Strong Buy": 0,
            Buy: 0,
            Neutral: 0,
            Sell: 0,
            "Strong Sell": 0,
          }
        )
      : { All: fundamentals.length };

  // Step 5: Apply pagination on the fully filtered data
  const totalPages = Math.ceil(filteredByQuery.length / itemsPerPage);
  const paginatedFundamentals = filteredByQuery.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Parse and apply custom query
  const handleQuerySubmit = () => {
    if (!query.trim()) {
      setFilteredFundamentals(filteredByAgreement);
      setPage(1);
      return;
    }

    try {
      const conditions = query.split("AND").map((cond) => cond.trim());
      const filtered = filteredByAgreement.filter((stock) => {
        return conditions.every((condition) => {
          for (const indicator of indicators) {
            if (condition.includes(indicator)) {
              const [_, operator, value] =
                condition.match(
                  new RegExp(`${indicator}\\s*([<>=])\\s*(\\d+)`)
                ) || [];
              if (!operator || !value) return false;
              const indicatorValue =
                stock[indicatorFields[indicator].value] !== null
                  ? parseFloat(stock[indicatorFields[indicator].value])
                  : null;
              const val = parseFloat(value);
              if (indicatorValue === null) return false;
              if (operator === "<") return indicatorValue < val;
              if (operator === ">") return indicatorValue > val;
              if (operator === "=") return indicatorValue === val;
            }
          }
          if (condition.includes("Market Capitalization")) {
            const [_, operator, value] =
              condition.match(/Market Capitalization\s*([<>=])\s*(\d+)/) || [];
            if (!operator || !value) return false;
            const mcap =
              stock.market_cap !== null ? parseFloat(stock.market_cap) : 0;
            const val = parseFloat(value);
            if (operator === "<") return mcap < val;
            if (operator === ">") return mcap > val;
            if (operator === "=") return mcap === val;
          }
          return true;
        });
      });
      setFilteredFundamentals(filtered);
      setPage(1);
    } catch (err) {
      console.error("Invalid query:", err);
      setFilteredFundamentals(filteredByAgreement);
      setPage(1);
    }
  };

  // Handle stock selection
  const handleStockSelect = (stock) => {
    console.log("Selected stock:", stock);
  };

  // Handle indicator selection
  const handleIndicatorSelect = (indicator) => {
    if (!selectedIndicators.includes(indicator)) {
      setSelectedIndicators([...selectedIndicators, indicator]);
    }
  };

  // Handle indicator removal
  const handleIndicatorRemove = (indicator) => {
    setSelectedIndicators(
      selectedIndicators.filter((ind) => ind !== indicator)
    );
    setActiveTab("All");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm py-6">
        <div className="max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Fundamentals Dashboard
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-t-blue-500 rounded-full"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        )}
        {error && (
          <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        {!loading && !error && (
          <>
            {/* Indicators Dropdown and Selected Tabs */}
            <div className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Select Indicators
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value=""
                  onChange={(e) => handleIndicatorSelect(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 transition-all duration-300"
                >
                  <option value="" disabled>
                    Select an Indicator
                  </option>
                  {indicators
                    .filter(
                      (indicator) => !selectedIndicators.includes(indicator)
                    )
                    .map((indicator) => (
                      <option key={indicator} value={indicator}>
                        {indicator}
                      </option>
                    ))}
                </select>
                {/* Selected Indicators as Tabs */}
                {selectedIndicators.map((indicator) => (
                  <div
                    key={indicator}
                    className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {indicator}
                    <button
                      onClick={() => handleIndicatorRemove(indicator)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Indicator Tabs (if at least one indicator is selected) */}
            {selectedIndicators.length > 0 && (
              <div className="mb-6 bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
                  {[
                    "All",
                    "Strong Buy",
                    "Buy",
                    "Neutral",
                    "Sell",
                    "Strong Sell",
                  ].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setPage(1);
                      }}
                      className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                        activeTab === tab
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tab}{" "}
                      <span className="ml-1">({tabCounts[tab] || 0})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fundamentals Table */}
            <FundamentalsTable
              fundamentals={paginatedFundamentals}
              onStockSelect={handleStockSelect}
              selectedIndicators={selectedIndicators}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                    page === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  }`}
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                    page === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  }`}
                >
                  Next
                </button>
              </div>
            )}

            {/* Query Input */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Filter Stocks by Query
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="e.g., RSI < 30 AND Market Capitalization > 500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400 transition-all duration-300"
                />
                <button
                  onClick={handleQuerySubmit}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default FundamentalsTablePage;
