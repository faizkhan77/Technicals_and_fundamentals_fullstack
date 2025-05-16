const pool = require("./db");
const { calculateSMA, calculateEMA, calculateATR } = require("./helper.js");
const {
  calculateRSI,
  calculateMACD,
  calculateADX,
  calculateSupertrend,
  calculateBollingerBands,
  calculateVWAP,
  calculateWilliamsR,
  calculateParabolicSAR,
  calculateIchimokuCloud,
} = require("./indicators.js");

async function getStockData(
  selectedIndicators = [
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
  ]
) {
  try {
    const [rows] = await pool.query(`
   SELECT 
    sp.scripcode, 
    sp.open,
    sp.high, 
    sp.low, 
    sp.close, 
    sp.updTime, 
    sp.volume,
    cm.industry, 
    cm.symbol, 
    cm.s_name, 
    cm.compname 
FROM stock_prices_bse_eod sp
JOIN company_master cm ON sp.scripcode = cm.scripcode
WHERE sp.scripcode > 267
ORDER BY sp.scripcode, sp.updTime
LIMIT 50000;
    `);

    const validRows = rows.filter((row) => row.symbol && row.compname);
    console.log(`Total rows: ${rows.length}, Valid rows: ${validRows.length}`);

    const grouped = validRows.reduce((acc, row) => {
      const key = row.scripcode;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    const results = [];
    for (const scripcode in grouped) {
      const stockData = grouped[scripcode];
      const minDataPoints = 52;
      if (stockData.length < minDataPoints) {
        console.log(
          `Skipping ${scripcode}: insufficient data (${stockData.length} < ${minDataPoints})`
        );
        continue;
      }

      if (!stockData[0].symbol || !stockData[0].compname) {
        console.log(`Invalid data for scripcode ${scripcode}:`, stockData[0]);
        continue;
      }

      const opens = stockData.map((row) => row.open);
      const highs = stockData.map((row) => row.high);
      const lows = stockData.map((row) => row.low);
      const closes = stockData.map((row) => row.close);
      const volumes = stockData.map((row) => row.volume || 1);
      const dates = stockData.map((row) => row.updTime);

      const prices = stockData.map((row, i) => ({
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume || 1,
      }));

      if (
        highs.length !== lows.length ||
        lows.length !== closes.length ||
        closes.length !== dates.length ||
        closes.length !== volumes.length
      ) {
        console.log(
          `Data mismatch for ${scripcode}: highs=${highs.length}, lows=${lows.length}, closes=${closes.length}, volumes=${volumes.length}, dates=${dates.length}`
        );
        continue;
      }

      let indicators;
      try {
        indicators = {
          rsi14: calculateRSI(closes, 14),
          ema9: calculateEMA(closes, 9),
          sma20: calculateSMA(closes, 20),
          macd: calculateMACD(closes, 12, 26, 9, "EMA", "EMA"),
          adx: calculateADX(highs, lows, closes, 14, 14),
          supertrend: calculateSupertrend(highs, lows, closes, 10, 3.0),
          bollinger: calculateBollingerBands(prices, 20, "SMA", 2.0),
          vwap: calculateVWAP(prices),
          williamsR: calculateWilliamsR(prices, 14),
          psar: calculateParabolicSAR(prices, 0.02, 0.02, 0.2),
          ichimoku: calculateIchimokuCloud(prices, 9, 26, 52),
          atr: calculateATR(highs, lows, closes, 14),
        };
      } catch (e) {
        console.log(
          `Error calculating indicators for ${scripcode}: ${e.message}`
        );
        continue;
      }

      const {
        rsi14,
        ema9,
        sma20,
        macd,
        adx,
        supertrend,
        bollinger,
        vwap,
        williamsR,
        psar,
        ichimoku,
        atr,
      } = indicators;
      const { macd: macdLine, signal } = macd || {};
      const { plusDI, minusDI, adx: adxLine } = adx || {};
      const { supertrend: supertrendLine, direction } = supertrend || {};
      const {
        basis: middleBand,
        upper: upperBand,
        lower: lowerBand,
      } = bollinger || {};
      const { vwap: vwapLine } = vwap || {};
      const {
        conversionLine: tenkanSen,
        baseLine: kijunSen,
        leadLine1: senkouSpanA,
        leadLine2: senkouSpanB,
        laggingSpan: chikouSpan,
      } = ichimoku || {};

      if (
        !rsi14 ||
        rsi14.length === 0 ||
        !macdLine ||
        !adxLine ||
        !supertrendLine
      ) {
        console.log(
          `Skipping ${scripcode} due to missing critical indicator values`
        );
        continue;
      }

      if (!ema9 || ema9.length === 0)
        console.log(`Warning: EMA9 missing for ${scripcode}`);
      if (!sma20 || sma20.length === 0)
        console.log(`Warning: SMA20 missing for ${scripcode}`);
      if (!upperBand || !lowerBand)
        console.log(`Warning: Bollinger Bands missing for ${scripcode}`);
      if (!vwapLine || vwapLine.length === 0)
        console.log(`Warning: VWAP missing for ${scripcode}`);
      if (!williamsR || williamsR.length === 0)
        console.log(`Warning: WilliamsR missing for ${scripcode}`);
      if (!psar || psar.length === 0)
        console.log(`Warning: PSAR missing for ${scripcode}`);
      if (!tenkanSen || !kijunSen)
        console.log(`Warning: Ichimoku missing for ${scripcode}`);
      if (!atr || atr.length === 0)
        console.log(`Warning: ATR missing for ${scripcode}`);

      const latestPrice = closes[closes.length - 1];
      const latestOpen = opens[opens.length - 1];
      const latestRSI = rsi14.length > 0 ? rsi14[rsi14.length - 1] : null;
      const latestEMA9 = ema9 && ema9.length > 0 ? ema9[ema9.length - 1] : null;
      const latestSMA20 =
        sma20 && sma20.length > 0 ? sma20[sma20.length - 1] : null;
      const latestMACD =
        macdLine.length > 0 ? macdLine[macdLine.length - 1] : null;
      const latestSignal =
        signal && signal.length > 0 ? signal[signal.length - 1] : null;
      const latestADX = adxLine.length > 0 ? adxLine[adxLine.length - 1] : null;
      const latestPlusDI =
        plusDI && plusDI.length > 0 ? plusDI[plusDI.length - 1] : null;
      const latestMinusDI =
        minusDI && minusDI.length > 0 ? minusDI[minusDI.length - 1] : null;
      const latestSupertrendDirection =
        direction && direction.length > 0
          ? direction[direction.length - 1]
          : null;
      const latestSupertrend =
        supertrendLine && supertrendLine.length > 0
          ? supertrendLine[supertrendLine.length - 1]
          : null;
      const latestUpperBand =
        upperBand && upperBand.length > 0
          ? upperBand[upperBand.length - 1]
          : null;
      const latestLowerBand =
        lowerBand && lowerBand.length > 0
          ? lowerBand[lowerBand.length - 1]
          : null;
      const latestVWAP =
        vwapLine && vwapLine.length > 0 ? vwapLine[vwapLine.length - 1] : null;
      const latestWilliamsR =
        williamsR && williamsR.length > 0
          ? williamsR[williamsR.length - 1]
          : null;
      const latestPSAR = psar && psar.length > 0 ? psar[psar.length - 1] : null;
      const latestTenkanSen =
        tenkanSen && tenkanSen.length > 0
          ? tenkanSen[tenkanSen.length - 1]
          : null;
      const latestKijunSen =
        kijunSen && kijunSen.length > 0 ? kijunSen[kijunSen.length - 1] : null;
      const latestSenkouSpanA =
        senkouSpanA && senkouSpanA.length > 26
          ? senkouSpanA[senkouSpanA.length - 26]
          : null;
      const latestSenkouSpanB =
        senkouSpanB && senkouSpanB.length > 26
          ? senkouSpanB[senkouSpanB.length - 26]
          : null;
      const latestChikouSpan =
        chikouSpan && chikouSpan.length > 0
          ? chikouSpan[chikouSpan.length - 1]
          : null;
      const latestATR = atr && atr.length > 0 ? atr[atr.length - 1] : null;

      const indicatorDecisions = {
        RSI: "Neutral",
        EMA: "Neutral",
        SMA: "Neutral",
        MACD: "Neutral",
        ADX: "Neutral",
        Supertrend: "Neutral",
        BollingerBands: "Neutral",
        VWAP: "Neutral",
        WilliamsR: "Neutral",
        PSAR: "Neutral",
        Ichimoku: "Neutral",
        ATR: "Neutral",
      };

      if (latestRSI !== null) {
        if (latestRSI < 20) indicatorDecisions.RSI = "Strong Buy";
        else if (latestRSI < 30) indicatorDecisions.RSI = "Buy";
        else if (latestRSI > 80) indicatorDecisions.RSI = "Strong Sell";
        else if (latestRSI > 70) indicatorDecisions.RSI = "Sell";
      }

      if (latestEMA9 !== null) {
        if (latestPrice > latestEMA9 * 1.05)
          indicatorDecisions.EMA = "Strong Buy";
        else if (latestPrice > latestEMA9) indicatorDecisions.EMA = "Buy";
        else if (latestPrice < latestEMA9 * 0.95)
          indicatorDecisions.EMA = "Strong Sell";
        else if (latestPrice < latestEMA9) indicatorDecisions.EMA = "Sell";
      }

      if (latestSMA20 !== null) {
        if (latestPrice > latestSMA20 * 1.05)
          indicatorDecisions.SMA = "Strong Buy";
        else if (latestPrice > latestSMA20) indicatorDecisions.SMA = "Buy";
        else if (latestPrice < latestSMA20 * 0.95)
          indicatorDecisions.SMA = "Strong Sell";
        else if (latestPrice < latestSMA20) indicatorDecisions.SMA = "Sell";
      }

      if (latestMACD !== null && latestSignal !== null) {
        const macdDiff = latestMACD - latestSignal;
        if (
          latestMACD > latestSignal &&
          latestMACD > 0 &&
          macdDiff > Math.abs(latestMACD) * 0.1
        ) {
          indicatorDecisions.MACD = "Strong Buy";
        } else if (latestMACD > latestSignal) {
          indicatorDecisions.MACD = "Buy";
        } else if (
          latestMACD < latestSignal &&
          latestMACD < 0 &&
          Math.abs(macdDiff) > Math.abs(latestMACD) * 0.1
        ) {
          indicatorDecisions.MACD = "Strong Sell";
        } else if (latestMACD < latestSignal) {
          indicatorDecisions.MACD = "Sell";
        }
      }

      if (
        latestADX !== null &&
        latestPlusDI !== null &&
        latestMinusDI !== null
      ) {
        if (latestADX > 40 && latestPlusDI > latestMinusDI) {
          indicatorDecisions.ADX = "Strong Buy";
        } else if (latestADX > 25 && latestPlusDI > latestMinusDI) {
          indicatorDecisions.ADX = "Buy";
        } else if (latestADX > 40 && latestMinusDI > latestPlusDI) {
          indicatorDecisions.ADX = "Strong Sell";
        } else if (latestADX > 25 && latestMinusDI > latestPlusDI) {
          indicatorDecisions.ADX = "Sell";
        }
      }

      if (latestSupertrendDirection !== null && latestSupertrend !== null) {
        if (latestSupertrendDirection === 1 && latestPrice > latestSupertrend) {
          indicatorDecisions.Supertrend = "Buy";
        } else if (
          latestSupertrendDirection === -1 &&
          latestPrice < latestSupertrend
        ) {
          indicatorDecisions.Supertrend = "Sell";
        }
      }

      if (
        latestUpperBand !== null &&
        latestLowerBand !== null &&
        middleBand !== null
      ) {
        if (latestPrice < latestLowerBand)
          indicatorDecisions.BollingerBands = "Strong Buy";
        else if (latestPrice > latestUpperBand)
          indicatorDecisions.BollingerBands = "Strong Sell";
        else if (latestPrice < middleBand[middleBand.length - 1])
          indicatorDecisions.BollingerBands = "Sell";
        else if (latestPrice > middleBand[middleBand.length - 1])
          indicatorDecisions.BollingerBands = "Buy";
      }

      if (latestVWAP !== null) {
        if (latestPrice > latestVWAP * 1.03)
          indicatorDecisions.VWAP = "Strong Buy";
        else if (latestPrice > latestVWAP) indicatorDecisions.VWAP = "Buy";
        else if (latestPrice < latestVWAP * 0.97)
          indicatorDecisions.VWAP = "Strong Sell";
        else if (latestPrice < latestVWAP) indicatorDecisions.VWAP = "Sell";
      }

      if (latestWilliamsR !== null) {
        if (latestWilliamsR > -20) indicatorDecisions.WilliamsR = "Strong Sell";
        else if (latestWilliamsR > -30) indicatorDecisions.WilliamsR = "Sell";
        else if (latestWilliamsR < -80)
          indicatorDecisions.WilliamsR = "Strong Buy";
        else if (latestWilliamsR < -70) indicatorDecisions.WilliamsR = "Buy";
      }

      if (latestPSAR !== null) {
        if (
          latestPrice > latestPSAR &&
          latestPSAR < closes[closes.length - 2]
        ) {
          indicatorDecisions.PSAR = "Buy";
        } else if (
          latestPrice < latestPSAR &&
          latestPSAR > closes[closes.length - 2]
        ) {
          indicatorDecisions.PSAR = "Sell";
        }
      }

      if (
        latestSenkouSpanA !== null &&
        latestSenkouSpanB !== null &&
        latestTenkanSen !== null &&
        latestKijunSen !== null &&
        latestChikouSpan !== null
      ) {
        const cloudTop = Math.max(latestSenkouSpanA, latestSenkouSpanB);
        const cloudBottom = Math.min(latestSenkouSpanA, latestSenkouSpanB);
        if (
          latestPrice > cloudTop &&
          latestTenkanSen > latestKijunSen &&
          latestChikouSpan > closes[closes.length - 27]
        ) {
          indicatorDecisions.Ichimoku = "Strong Buy";
        } else if (latestPrice > cloudTop && latestTenkanSen > latestKijunSen) {
          indicatorDecisions.Ichimoku = "Buy";
        } else if (
          latestPrice < cloudBottom &&
          latestTenkanSen < latestKijunSen &&
          latestChikouSpan < closes[closes.length - 27]
        ) {
          indicatorDecisions.Ichimoku = "Strong Sell";
        } else if (
          latestPrice < cloudBottom &&
          latestTenkanSen < latestKijunSen
        ) {
          indicatorDecisions.Ichimoku = "Sell";
        }
      }

      if (latestATR !== null && latestEMA9 !== null) {
        if (latestATR < closes[closes.length - 1] * 0.01) {
          indicatorDecisions.ATR = "Neutral";
        } else if (
          latestPrice > latestEMA9 &&
          latestATR > closes[closes.length - 1] * 0.02
        ) {
          indicatorDecisions.ATR = "Buy";
        } else if (
          latestPrice < latestEMA9 &&
          latestATR > closes[closes.length - 1] * 0.02
        ) {
          indicatorDecisions.ATR = "Sell";
        }
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
        BollingerBands: 1,
        VWAP: 1,
        WilliamsR: 1,
        PSAR: 1,
        Ichimoku: 1.5,
        ATR: 1,
      };

      // Only consider selected indicators for the total score
      const totalScore = Object.entries(indicatorDecisions)
        .filter(([indicator]) => selectedIndicators.includes(indicator))
        .reduce(
          (sum, [indicator, decision]) =>
            sum + (decisionScores[decision] || 0) * weights[indicator],
          0
        );

      let decision = "Neutral";
      if (selectedIndicators.length === 0) {
        decision = "Neutral"; // Default to Neutral if no indicators selected
      } else if (totalScore >= 1.5) {
        decision = "Strong Buy";
      } else if (totalScore >= 0.5) {
        decision = "Buy";
      } else if (totalScore <= -1.5) {
        decision = "Strong Sell";
      } else if (totalScore <= -0.5) {
        decision = "Sell";
      }

      // Debug: Log decision and score
      console.log(
        `Stock ${scripcode}: Decision=${decision}, Score=${totalScore.toFixed(
          2
        )}, SelectedIndicators=${selectedIndicators}, IndicatorDecisions=`,
        indicatorDecisions
      );

      const latestDate = dates[dates.length - 1];
      const { industry, symbol, s_name, compname } = stockData[0];

      results.push({
        scripcode,
        symbol,
        company_name: compname,
        industry,
        s_name,
        latestPrice,
        latestOpen,
        latestRSI: latestRSI !== null ? Number(latestRSI.toFixed(2)) : null,
        latestEMA9: latestEMA9 !== null ? Number(latestEMA9.toFixed(2)) : null,
        latestSMA20:
          latestSMA20 !== null ? Number(latestSMA20.toFixed(2)) : null,
        latestMACD: latestMACD !== null ? Number(latestMACD.toFixed(2)) : null,
        latestADX: latestADX !== null ? Number(latestADX.toFixed(2)) : null,
        latestPlusDI:
          latestPlusDI !== null ? Number(latestPlusDI.toFixed(2)) : null,
        latestMinusDI:
          latestMinusDI !== null ? Number(latestMinusDI.toFixed(2)) : null,
        latestSupertrendDirection: latestSupertrendDirection,
        latestSupertrend:
          latestSupertrend !== null
            ? Number(latestSupertrend.toFixed(2))
            : null,
        latestUpperBand:
          latestUpperBand !== null ? Number(latestUpperBand.toFixed(2)) : null,
        latestLowerBand:
          latestLowerBand !== null ? Number(latestLowerBand.toFixed(2)) : null,
        latestVWAP: latestVWAP !== null ? Number(latestVWAP.toFixed(2)) : null,
        latestWilliamsR:
          latestWilliamsR !== null ? Number(latestWilliamsR.toFixed(2)) : null,
        latestPSAR: latestPSAR !== null ? Number(latestPSAR.toFixed(2)) : null,
        latestTenkanSen:
          latestTenkanSen !== null ? Number(latestTenkanSen.toFixed(2)) : null,
        latestKijunSen:
          latestKijunSen !== null ? Number(latestKijunSen.toFixed(2)) : null,
        latestSenkouSpanA:
          latestSenkouSpanA !== null
            ? Number(latestSenkouSpanA.toFixed(2))
            : null,
        latestSenkouSpanB:
          latestSenkouSpanB !== null
            ? Number(latestSenkouSpanB.toFixed(2))
            : null,
        latestChikouSpan:
          latestChikouSpan !== null
            ? Number(latestChikouSpan.toFixed(2))
            : null,
        latestATR: latestATR !== null ? Number(latestATR.toFixed(2)) : null,
        decision,
        indicatorDecisions,
        selectedIndicators, // Include selected indicators in the response
        latestDate,
        ema9,
        sma20,
        dates,
        closes,
      });
    }

    // Debug: Log all decision values
    console.log("Unique decisions:", [
      ...new Set(results.map((r) => r.decision)),
    ]);

    return results;
  } catch (error) {
    console.error(`Error fetching stock data: ${error.message}`);
    throw error;
  }
}

module.exports = getStockData;
