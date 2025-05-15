import React, { useState } from "react";
import StockTable from "./StockTable";

const StockTabs = ({ stocks, onStockSelect, visibleIndicators }) => {
  const [activeTab, setActiveTab] = useState("All");
  const [sortConfig, setSortConfig] = useState({
    key: "latestPrice",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Calculate stock counts for each tab
  const tabCounts = {
    All: stocks.length,
    "Strong Buy": stocks.filter(
      (stock) => stock.decision?.toLowerCase() === "strong buy"
    ).length,
    Buy: stocks.filter((stock) => stock.decision?.toLowerCase() === "buy")
      .length,
    Neutral: stocks.filter(
      (stock) => stock.decision?.toLowerCase() === "neutral"
    ).length,
    Sell: stocks.filter((stock) => stock.decision?.toLowerCase() === "sell")
      .length,
    "Strong Sell": stocks.filter(
      (stock) => stock.decision?.toLowerCase() === "strong sell"
    ).length,
  };

  // Filter stocks by active tab (case-insensitive)
  const filteredStocks =
    activeTab === "All"
      ? stocks
      : stocks.filter(
          (stock) =>
            stock.decision &&
            stock.decision.toLowerCase() === activeTab.toLowerCase()
        );

  const sortedStocks = [...filteredStocks].sort((a, b) => {
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

  const totalPages = Math.ceil(sortedStocks.length / itemsPerPage);
  const paginatedStocks = sortedStocks.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
        {["All", "Strong Buy", "Buy", "Neutral", "Sell", "Strong Sell"].map(
          (tab) => (
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
              {tab} <span className="ml-1">({tabCounts[tab] || 0})</span>
            </button>
          )
        )}
      </div>

      {/* Table */}
      <StockTable
        stocks={paginatedStocks}
        onStockSelect={onStockSelect}
        visibleIndicators={visibleIndicators}
        onSort={handleSort}
        sortConfig={sortConfig}
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
    </div>
  );
};

export default StockTabs;
