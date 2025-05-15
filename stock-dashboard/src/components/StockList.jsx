import React from "react";

const StockList = ({ stocks, onStockSelect }) => {
  if (stocks.length === 0) {
    return <p className="text-center text-gray-500">No stocks to display</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stocks.map((stock) => (
        <div
          key={stock.scripcode}
          onClick={() => onStockSelect(stock)}
          className="bg-zinc-800 shadow-lg rounded-lg p-6 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          <h3 className="text-xl font-semibold text-white">{stock.symbol}</h3>
          <p className="text-gray-400 truncate">{stock.company_name}</p>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-300">
              Price:{" "}
              <span className="font-semibold text-emerald-500">
                {stock.latestPrice.toFixed(2)}
              </span>
            </p>
            <p className="text-sm font-medium text-gray-300">
              Open:{" "}
              <span className="font-semibold text-emerald-500">
                {stock.latestOpen.toFixed(2)}
              </span>
            </p>
            <p className="text-sm font-medium text-gray-300">
              RSI:{" "}
              <span className="font-semibold text-green-500">
                {stock.latestRSI.toFixed(2)}
              </span>
            </p>
            <p className="text-sm font-medium text-gray-300">
              MACD:{" "}
              <span className="font-semibold text-green-500">
                {stock.latestMACD.toFixed(2)}
              </span>
            </p>
            <p className="text-sm font-medium text-gray-300">
              ADX:{" "}
              <span className="font-semibold text-green-500">
                {stock.latestADX ? stock.latestADX.toFixed(2) : "N/A"}
              </span>
            </p>
            <p className="text-sm font-medium text-gray-300">
              +DI/-DI:{" "}
              <span className="font-semibold text-green-500">
                {stock.latestPlusDI.toFixed(2)} /{" "}
                {stock.latestMinusDI.toFixed(2)}
              </span>
            </p>
            <p className="text-sm font-medium text-gray-300">
              Supertrend:{" "}
              <span className="font-semibold text-green-500">
                {stock.latestSupertrendDirection === 1 ? "Up" : "Down"}
              </span>
            </p>
            <p className="text-sm font-medium text-gray-300">
              Decision:{" "}
              <span
                className={`font-semibold ${
                  stock.decision === "BUY"
                    ? "text-green-500"
                    : stock.decision === "SELL"
                    ? "text-red-500"
                    : "text-yellow-500"
                }`}
              >
                {stock.decision}
              </span>
            </p>
            <p className="text-sm font-medium text-gray-300">
              Date:{" "}
              <span className="font-semibold text-gray-300">
                {new Date(stock.latestDate).toLocaleDateString()}
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StockList;
