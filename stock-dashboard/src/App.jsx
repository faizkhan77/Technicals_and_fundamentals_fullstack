import React, { useState, useEffect } from "react";
import axios from "axios";
import StockTabs from "./components/StockTabs";
import { Link } from "react-router-dom";

const App = () => {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleIndicators, setVisibleIndicators] = useState({
    RSI: true,
    EMA: true,
    SMA: true,
    MACD: true,
    ADX: true,
    Supertrend: true,
    BollingerBands: true,
    VWAP: true,
    WilliamsR: true,
    PSAR: true,
    Ichimoku: true,
    ATR: true,
  });

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        // Create array of selected indicators
        const selectedIndicators = Object.keys(visibleIndicators).filter(
          (indicator) => visibleIndicators[indicator]
        );

        // Send GET request with selectedIndicators as query parameter
        const response = await axios.get(
          "http://localhost:3000/api/stock-decisions",
          {
            params: {
              selectedIndicators: selectedIndicators.join(","),
            },
          }
        );
        const validStocks = response.data.filter(
          (stock) =>
            stock &&
            typeof stock.symbol === "string" &&
            typeof stock.company_name === "string"
        );
        setStocks(validStocks);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch stock data");
        setLoading(false);
      }
    };
    fetchStocks();
  }, [visibleIndicators]);

  const filteredStocks = stocks.filter((stock) => {
    const symbol = stock.symbol || "";
    const companyName = stock.company_name || "";
    return (
      symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      companyName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
  };

  const toggleIndicator = (indicator) => {
    setVisibleIndicators((prev) => ({
      ...prev,
      [indicator]: !prev[indicator],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm py-6">
        <div className="max-w-6xl px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Brainfog Stock Analysis Dashboard
          </h1>
          <Link
            to="/fundamentals"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300"
          >
            Fundamentals Dashboard
          </Link>
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
            {/* Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search by symbol or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400 transition-all duration-300"
                />
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Indicator Section */}
            <div className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Select Indicators
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Object.keys(visibleIndicators).map((indicator) => (
                  <label
                    key={indicator}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleIndicators[indicator]}
                      onChange={() => toggleIndicator(indicator)}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                    />
                    <span className="text-sm text-gray-700">{indicator}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stock Tabs and Table */}
            <StockTabs
              stocks={filteredStocks}
              onStockSelect={handleStockSelect}
              visibleIndicators={visibleIndicators}
            />
          </>
        )}
      </main>
    </div>
  );
};
export default App;
