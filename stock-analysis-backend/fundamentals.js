const express = require("express");
const router = express.Router();
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

router.get("/", async (req, res) => {
  try {
    // Step 1: Fetch fundamentals data with the latest financials and 52-week high/low
    const [fundamentalsRows] = await pool.query(`
      SELECT 
        cm.fincode,
        cm.scripcode,
        cm.symbol,
        cm.compname,
        cm.industry,
        cm.s_name,
        cm.mcap,
        cm.last_traded_price,
        cf.adjusted_eps,
        cf.epsGrowth,
        cf.yeild AS dividend_yield,
        cf.price_to_earnings_ratio,
        cf.price_to_book_ratio,
        cf.return_on_equity,
        cf.return_on_assets AS roce, -- Proxy for ROCE
        cf.debt_ratio AS debt_to_equity,
        cf.core_ebita AS core_ebitda,
        cf.core_ebita_margin AS core_ebitda_margin,
        cf.pat_margin,
        cf.asset_turnover,
        (
          SELECT MAX(sp.high)
          FROM stock_prices_bse_eod sp
          WHERE sp.fincode = cm.fincode
          AND sp.scripcode > 267
          AND sp.updTime >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
        ) AS high_52w,
        (
          SELECT MIN(sp.low)
          FROM stock_prices_bse_eod sp
          WHERE sp.fincode = cm.fincode
          AND sp.scripcode > 267
          AND sp.updTime >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
        ) AS low_52w
      FROM company_master cm
      LEFT JOIN companyfinancials cf
        ON cm.fincode = cf.fincode
        AND cf.type = 'A' -- Annual financials
        AND cf.year_end = (
          SELECT MAX(year_end)
          FROM companyfinancials cf2
          WHERE cf2.fincode = cm.fincode
          AND cf2.type = 'A'
        )
      WHERE cm.symbol IS NOT NULL 
        AND cm.compname IS NOT NULL
        AND cm.scripcode > 267
      LIMIT 10000;
    `);

    console.log(`Fundamentals rows fetched: ${fundamentalsRows.length}`);

    // Step 2: Fetch historical stock price data for indicator calculations
    const fincodes = fundamentalsRows.map((row) => row.fincode);
    const [priceRows] = await pool.query(
      `
      SELECT 
        sp.fincode,
        sp.open,
        sp.high,
        sp.low,
        sp.close,
        sp.updTime,
        sp.volume
      FROM stock_prices_bse_eod sp
      WHERE sp.fincode IN (?)
      AND sp.scripcode > 267
      ORDER BY sp.fincode, sp.updTime;
    `,
      [fincodes]
    );

    // Group price data by fincode
    const priceDataByFincode = priceRows.reduce((acc, row) => {
      if (!acc[row.fincode]) acc[row.fincode] = [];
      acc[row.fincode].push(row);
      return acc;
    }, {});

    // Step 3: Calculate indicators and decisions for each stock
    const fundamentalsWithIndicators = fundamentalsRows.map((fund) => {
      const stockPrices = priceDataByFincode[fund.fincode] || [];
      const minDataPoints = 52; // Minimum data points needed for most indicators

      // Initialize default values
      let latestRSI = null,
        rsiDecision = "N/A";
      let latestEMA9 = null,
        emaDecision = "N/A";
      let latestSMA20 = null,
        smaDecision = "N/A";
      let latestMACD = null,
        latestSignal = null,
        macdDecision = "N/A";
      let latestADX = null,
        latestPlusDI = null,
        latestMinusDI = null,
        adxDecision = "N/A";
      let latestSupertrend = null,
        latestSupertrendDirection = null,
        supertrendDecision = "N/A";
      let latestUpperBand = null,
        latestLowerBand = null,
        bollingerDecision = "N/A";
      let latestVWAP = null,
        vwapDecision = "N/A";
      let latestWilliamsR = null,
        williamsRDecision = "N/A";
      let latestPSAR = null,
        psarDecision = "N/A";
      let latestTenkanSen = null,
        latestKijunSen = null,
        latestSenkouSpanA = null,
        latestSenkouSpanB = null,
        latestChikouSpan = null,
        ichimokuDecision = "N/A";
      let latestATR = null,
        atrDecision = "N/A";

      if (stockPrices.length >= 14) {
        // Minimum for RSI
        const opens = stockPrices.map((row) => row.open);
        const highs = stockPrices.map((row) => row.high);
        const lows = stockPrices.map((row) => row.low);
        const closes = stockPrices.map((row) => row.close);
        const volumes = stockPrices.map((row) => row.volume || 1);

        const prices = stockPrices.map((row) => ({
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume || 1,
        }));

        // Calculate indicators
        try {
          const rsi14 = calculateRSI(closes, 14);
          const ema9 = stockPrices.length >= 9 ? calculateEMA(closes, 9) : [];
          const sma20 =
            stockPrices.length >= 20 ? calculateSMA(closes, 20) : [];
          const macd =
            stockPrices.length >= 26
              ? calculateMACD(closes, 12, 26, 9, "EMA", "EMA")
              : {};
          const adx =
            stockPrices.length >= 28
              ? calculateADX(highs, lows, closes, 14, 14)
              : {};
          const supertrend =
            stockPrices.length >= 10
              ? calculateSupertrend(highs, lows, closes, 10, 3.0)
              : {};
          const bollinger =
            stockPrices.length >= 20
              ? calculateBollingerBands(prices, 20, "SMA", 2.0)
              : {};
          const vwap = calculateVWAP(prices);
          const williamsR =
            stockPrices.length >= 14 ? calculateWilliamsR(prices, 14) : [];
          const psar =
            stockPrices.length >= 2
              ? calculateParabolicSAR(prices, 0.02, 0.02, 0.2)
              : [];
          const ichimoku =
            stockPrices.length >= 52
              ? calculateIchimokuCloud(prices, 9, 26, 52)
              : {};
          const atr =
            stockPrices.length >= 14
              ? calculateATR(highs, lows, closes, 14)
              : [];

          // Extract latest values
          latestRSI =
            rsi14.length > 0
              ? Number(rsi14[rsi14.length - 1].toFixed(2))
              : null;
          latestEMA9 =
            ema9.length > 0 ? Number(ema9[ema9.length - 1].toFixed(2)) : null;
          latestSMA20 =
            sma20.length > 0
              ? Number(sma20[sma20.length - 1].toFixed(2))
              : null;
          const { macd: macdLine, signal } = macd || {};
          latestMACD =
            macdLine && macdLine.length > 0
              ? Number(macdLine[macdLine.length - 1].toFixed(2))
              : null;
          latestSignal =
            signal && signal.length > 0
              ? Number(signal[signal.length - 1].toFixed(2))
              : null;
          const { plusDI, minusDI, adx: adxLine } = adx || {};
          latestADX =
            adxLine && adxLine.length > 0
              ? Number(adxLine[adxLine.length - 1].toFixed(2))
              : null;
          latestPlusDI =
            plusDI && plusDI.length > 0
              ? Number(plusDI[plusDI.length - 1].toFixed(2))
              : null;
          latestMinusDI =
            minusDI && minusDI.length > 0
              ? Number(minusDI[minusDI.length - 1].toFixed(2))
              : null;
          const { supertrend: supertrendLine, direction } = supertrend || {};
          latestSupertrendDirection =
            direction && direction.length > 0
              ? direction[direction.length - 1]
              : null;
          latestSupertrend =
            supertrendLine && supertrendLine.length > 0
              ? Number(supertrendLine[supertrendLine.length - 1].toFixed(2))
              : null;
          const { upper: upperBand, lower: lowerBand } = bollinger || {};
          latestUpperBand =
            upperBand && upperBand.length > 0
              ? Number(upperBand[upperBand.length - 1].toFixed(2))
              : null;
          latestLowerBand =
            lowerBand && lowerBand.length > 0
              ? Number(lowerBand[lowerBand.length - 1].toFixed(2))
              : null;
          const { vwap: vwapLine } = vwap || {};
          latestVWAP =
            vwapLine && vwapLine.length > 0
              ? Number(vwapLine[vwapLine.length - 1].toFixed(2))
              : null;
          latestWilliamsR =
            williamsR.length > 0
              ? Number(williamsR[williamsR.length - 1].toFixed(2))
              : null;
          latestPSAR =
            psar.length > 0 ? Number(psar[psar.length - 1].toFixed(2)) : null;
          const {
            conversionLine: tenkanSen,
            baseLine: kijunSen,
            leadLine1: senkouSpanA,
            leadLine2: senkouSpanB,
            laggingSpan: chikouSpan,
          } = ichimoku || {};
          latestTenkanSen =
            tenkanSen && tenkanSen.length > 0
              ? Number(tenkanSen[tenkanSen.length - 1].toFixed(2))
              : null;
          latestKijunSen =
            kijunSen && kijunSen.length > 0
              ? Number(kijunSen[kijunSen.length - 1].toFixed(2))
              : null;
          latestSenkouSpanA =
            senkouSpanA && senkouSpanA.length > 26
              ? Number(senkouSpanA[senkouSpanA.length - 26].toFixed(2))
              : null;
          latestSenkouSpanB =
            senkouSpanB && senkouSpanB.length > 26
              ? Number(senkouSpanB[senkouSpanB.length - 26].toFixed(2))
              : null;
          latestChikouSpan =
            chikouSpan && chikouSpan.length > 0
              ? Number(chikouSpan[chikouSpan.length - 1].toFixed(2))
              : null;
          latestATR =
            atr.length > 0 ? Number(atr[atr.length - 1].toFixed(2)) : null;

          // Calculate decisions
          const latestPrice = closes[closes.length - 1];

          // RSI Decision
          if (latestRSI !== null) {
            if (latestRSI < 20) rsiDecision = "Strong Buy";
            else if (latestRSI < 30) rsiDecision = "Buy";
            else if (latestRSI > 80) rsiDecision = "Strong Sell";
            else if (latestRSI > 70) rsiDecision = "Sell";
            else rsiDecision = "Neutral";
          }

          // EMA Decision
          if (latestEMA9 !== null) {
            if (latestPrice > latestEMA9 * 1.05) emaDecision = "Strong Buy";
            else if (latestPrice > latestEMA9) emaDecision = "Buy";
            else if (latestPrice < latestEMA9 * 0.95)
              emaDecision = "Strong Sell";
            else if (latestPrice < latestEMA9) emaDecision = "Sell";
            else emaDecision = "Neutral";
          }

          // SMA Decision
          if (latestSMA20 !== null) {
            if (latestPrice > latestSMA20 * 1.05) smaDecision = "Strong Buy";
            else if (latestPrice > latestSMA20) smaDecision = "Buy";
            else if (latestPrice < latestSMA20 * 0.95)
              smaDecision = "Strong Sell";
            else if (latestPrice < latestSMA20) smaDecision = "Sell";
            else smaDecision = "Neutral";
          }

          // MACD Decision
          if (latestMACD !== null && latestSignal !== null) {
            const macdDiff = latestMACD - latestSignal;
            if (
              latestMACD > latestSignal &&
              latestMACD > 0 &&
              macdDiff > Math.abs(latestMACD) * 0.1
            ) {
              macdDecision = "Strong Buy";
            } else if (latestMACD > latestSignal) {
              macdDecision = "Buy";
            } else if (
              latestMACD < latestSignal &&
              latestMACD < 0 &&
              Math.abs(macdDiff) > Math.abs(latestMACD) * 0.1
            ) {
              macdDecision = "Strong Sell";
            } else if (latestMACD < latestSignal) {
              macdDecision = "Sell";
            } else {
              macdDecision = "Neutral";
            }
          }

          // ADX Decision
          if (
            latestADX !== null &&
            latestPlusDI !== null &&
            latestMinusDI !== null
          ) {
            if (latestADX > 40 && latestPlusDI > latestMinusDI) {
              adxDecision = "Strong Buy";
            } else if (latestADX > 25 && latestPlusDI > latestMinusDI) {
              adxDecision = "Buy";
            } else if (latestADX > 40 && latestMinusDI > latestPlusDI) {
              adxDecision = "Strong Sell";
            } else if (latestADX > 25 && latestMinusDI > latestPlusDI) {
              adxDecision = "Sell";
            } else {
              adxDecision = "Neutral";
            }
          }

          // Supertrend Decision
          if (latestSupertrendDirection !== null && latestSupertrend !== null) {
            if (
              latestSupertrendDirection === 1 &&
              latestPrice > latestSupertrend
            ) {
              supertrendDecision = "Buy";
            } else if (
              latestSupertrendDirection === -1 &&
              latestPrice < latestSupertrend
            ) {
              supertrendDecision = "Sell";
            } else {
              supertrendDecision = "Neutral";
            }
          }

          // Bollinger Bands Decision
          if (latestUpperBand !== null && latestLowerBand !== null) {
            const middleBand = (latestUpperBand + latestLowerBand) / 2;
            if (latestPrice < latestLowerBand) bollingerDecision = "Strong Buy";
            else if (latestPrice > latestUpperBand)
              bollingerDecision = "Strong Sell";
            else if (latestPrice < middleBand) bollingerDecision = "Sell";
            else if (latestPrice > middleBand) bollingerDecision = "Buy";
            else bollingerDecision = "Neutral";
          }

          // VWAP Decision
          if (latestVWAP !== null) {
            if (latestPrice > latestVWAP * 1.03) vwapDecision = "Strong Buy";
            else if (latestPrice > latestVWAP) vwapDecision = "Buy";
            else if (latestPrice < latestVWAP * 0.97)
              vwapDecision = "Strong Sell";
            else if (latestPrice < latestVWAP) vwapDecision = "Sell";
            else vwapDecision = "Neutral";
          }

          // Williams %R Decision
          if (latestWilliamsR !== null) {
            if (latestWilliamsR > -20) williamsRDecision = "Strong Sell";
            else if (latestWilliamsR > -30) williamsRDecision = "Sell";
            else if (latestWilliamsR < -80) williamsRDecision = "Strong Buy";
            else if (latestWilliamsR < -70) williamsRDecision = "Buy";
            else williamsRDecision = "Neutral";
          }

          // Parabolic SAR Decision
          if (latestPSAR !== null) {
            if (
              latestPrice > latestPSAR &&
              latestPSAR < closes[closes.length - 2]
            ) {
              psarDecision = "Buy";
            } else if (
              latestPrice < latestPSAR &&
              latestPSAR > closes[closes.length - 2]
            ) {
              psarDecision = "Sell";
            } else {
              psarDecision = "Neutral";
            }
          }

          // Ichimoku Cloud Decision
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
              ichimokuDecision = "Strong Buy";
            } else if (
              latestPrice > cloudTop &&
              latestTenkanSen > latestKijunSen
            ) {
              ichimokuDecision = "Buy";
            } else if (
              latestPrice < cloudBottom &&
              latestTenkanSen < latestKijunSen &&
              latestChikouSpan < closes[closes.length - 27]
            ) {
              ichimokuDecision = "Strong Sell";
            } else if (
              latestPrice < cloudBottom &&
              latestTenkanSen < latestKijunSen
            ) {
              ichimokuDecision = "Sell";
            } else {
              ichimokuDecision = "Neutral";
            }
          }

          // ATR Decision
          if (latestATR !== null && latestEMA9 !== null) {
            if (latestATR < closes[closes.length - 1] * 0.01) {
              atrDecision = "Neutral";
            } else if (
              latestPrice > latestEMA9 &&
              latestATR > closes[closes.length - 1] * 0.02
            ) {
              atrDecision = "Buy";
            } else if (
              latestPrice < latestEMA9 &&
              latestATR > closes[closes.length - 1] * 0.02
            ) {
              atrDecision = "Sell";
            } else {
              atrDecision = "Neutral";
            }
          }
        } catch (e) {
          console.log(
            `Error calculating indicators for fincode ${fund.fincode}: ${e.message}`
          );
        }
      }

      return {
        fincode: fund.fincode,
        scripcode: fund.scripcode,
        symbol: fund.symbol,
        company_name: fund.compname,
        industry: fund.industry,
        s_name: fund.s_name,
        market_cap: fund.mcap,
        current_price: fund.last_traded_price,
        high_52w: fund.high_52w,
        low_52w: fund.low_52w,
        eps: fund.adjusted_eps,
        eps_growth: fund.epsGrowth,
        dividend_yield: fund.dividend_yield,
        pe_ratio: fund.price_to_earnings_ratio,
        pb_ratio: fund.price_to_book_ratio,
        roe: fund.return_on_equity,
        roce: fund.roce,
        debt_to_equity: fund.debt_to_equity,
        core_ebitda: fund.core_ebitda,
        core_ebitda_margin: fund.core_ebitda_margin,
        pat_margin: fund.pat_margin,
        asset_turnover: fund.asset_turnover,
        latestRSI,
        rsiDecision,
        latestEMA9,
        emaDecision,
        latestSMA20,
        smaDecision,
        latestMACD,
        latestSignal,
        macdDecision,
        latestADX,
        latestPlusDI,
        latestMinusDI,
        adxDecision,
        latestSupertrend,
        latestSupertrendDirection,
        supertrendDecision,
        latestUpperBand,
        latestLowerBand,
        bollingerDecision,
        latestVWAP,
        vwapDecision,
        latestWilliamsR,
        williamsRDecision,
        latestPSAR,
        psarDecision,
        latestTenkanSen,
        latestKijunSen,
        latestSenkouSpanA,
        latestSenkouSpanB,
        latestChikouSpan,
        ichimokuDecision,
        latestATR,
        atrDecision,
      };
    });

    res.json(fundamentalsWithIndicators);
  } catch (error) {
    console.error("Error fetching fundamentals:", error);
    res.status(500).json({ error: "Failed to fetch fundamentals data" });
  }
});

module.exports = router;
