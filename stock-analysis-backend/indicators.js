const {
  calculateSMA,
  calculateEMA,
  calculateRMA,
  calculateDirectionalMovement,
  calculateTR,
  calculateATR,
} = require("./helper.js");

function calculateRSI(closes, period = 14) {
  let gains = 0;
  let losses = 0;

  // Use period number of changes to start
  for (let i = 1; i <= period; i++) {
    let change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change; // turn negative loss into positive
  }

  // Calculate initial RMA
  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rsi = [];
  for (let i = period + 1; i < closes.length; i++) {
    let change = closes[i] - closes[i - 1];
    let gain = change > 0 ? change : 0;
    let loss = change < 0 ? -change : 0;

    // RMA (same as Pine Script's ta.rma)
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsiValue = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    rsi.push(rsiValue);
  }

  return rsi;
}

function calculateMACD(
  closes,
  fastLength = 12,
  slowLength = 26,
  signalLength = 9,
  smaSource = "EMA",
  smaSignal = "EMA"
) {
  if (!Array.isArray(closes) || closes.length < slowLength + signalLength) {
    throw new Error(
      "Invalid input: closes must have length >= slowLength + signalLength"
    );
  }
  const maFunction = smaSource === "SMA" ? calculateSMA : calculateEMA;
  const signalFunction = smaSignal === "SMA" ? calculateSMA : calculateEMA;
  const fastMa = maFunction(closes, fastLength);
  const slowMa = maFunction(closes, slowLength);
  const macd = fastMa.map((value, index) => value - (slowMa[index] || 0));
  const signal = signalFunction(macd, signalLength);
  const hist = macd.map((value, index) => value - (signal[index] || 0));
  return { macd, signal, hist };
}

function calculateADX(high, low, close, dilen = 14, adxlen = 14) {
  if (!Array.isArray(high) || high.length < dilen + adxlen) {
    throw new Error("Invalid input: arrays must have length >= dilen + adxlen");
  }
  let tr = calculateTR(high, low, close);
  let { plusDM, minusDM } = calculateDirectionalMovement(high, low);
  let smoothedTR = calculateRMA(tr, dilen);
  let smoothedPlusDM = calculateRMA(plusDM, dilen);
  let smoothedMinusDM = calculateRMA(minusDM, dilen);
  let plusDI = smoothedPlusDM.map(
    (value, index) => (value / smoothedTR[index]) * 100
  );
  let minusDI = smoothedMinusDM.map(
    (value, index) => (value / smoothedTR[index]) * 100
  );
  let dx = [];
  for (let i = 0; i < plusDI.length; i++) {
    let sum = plusDI[i] + minusDI[i];
    dx.push(sum === 0 ? 0 : (Math.abs(plusDI[i] - minusDI[i]) / sum) * 100);
  }
  let adx = calculateRMA(dx, adxlen);
  return { plusDI, minusDI, adx };
}

function calculateSupertrend(high, low, close, atrPeriod = 10, factor = 3.0) {
  if (!Array.isArray(high) || high.length < atrPeriod + 1) {
    throw new Error("Invalid input: arrays must have length >= atrPeriod + 1");
  }
  let atr = calculateATR(high, low, close, atrPeriod);
  let supertrend = new Array(high.length).fill(NaN);
  let direction = new Array(high.length).fill(0);
  for (let i = atrPeriod; i < high.length; i++) {
    let upperBand = (high[i] + low[i]) / 2 + factor * atr[i];
    let lowerBand = (high[i] + low[i]) / 2 - factor * atr[i];
    if (i === atrPeriod) {
      supertrend[i] = lowerBand; // Initial value
      direction[i] = 1;
    } else {
      supertrend[i] =
        close[i - 1] > supertrend[i - 1]
          ? Math.min(lowerBand, supertrend[i - 1])
          : Math.max(upperBand, supertrend[i - 1]);
      direction[i] = close[i] > supertrend[i] ? 1 : -1;
    }
  }
  return { supertrend, direction };
}

function donchian(prices, period) {
  const highs = prices.map((p) => p.high);
  const lows = prices.map((p) => p.low);
  const result = [];
  for (let i = period - 1; i < prices.length; i++) {
    const highSlice = highs.slice(i - period + 1, i + 1);
    const lowSlice = lows.slice(i - period + 1, i + 1);
    const highest = Math.max(...highSlice);
    const lowest = Math.min(...lowSlice);
    result.push((highest + lowest) / 2);
  }
  return result;
}

function calculateIchimokuCloud(
  prices,
  conversionPeriods = 9,
  basePeriods = 26,
  laggingSpan2Periods = 52,
  displacement = 26
) {
  if (
    !Array.isArray(prices) ||
    prices.length <
      Math.max(conversionPeriods, basePeriods, laggingSpan2Periods)
  ) {
    throw new Error(
      "Invalid input: prices must be an array with sufficient length"
    );
  }
  const conversionLine = donchian(prices, conversionPeriods);
  const baseLine = donchian(prices, basePeriods);
  const leadLine1 = [];
  const leadLine2 = donchian(prices, laggingSpan2Periods);
  const laggingSpan = [];
  for (let i = 0; i < conversionLine.length && i < baseLine.length; i++) {
    leadLine1.push((conversionLine[i] + baseLine[i]) / 2);
  }
  for (let i = 0; i < prices.length - displacement + 1; i++) {
    laggingSpan.push(prices[i].close);
  }
  return {
    conversionLine,
    baseLine,
    leadLine1,
    leadLine2,
    laggingSpan,
    kumoCloud: leadLine1.map((l1, i) =>
      l1 > leadLine2[i] ? l1 : leadLine2[i]
    ),
  };
}

function calculateParabolicSAR(
  prices,
  start = 0.02,
  increment = 0.02,
  maximum = 0.2
) {
  if (!Array.isArray(prices) || prices.length < 2) {
    throw new Error("Invalid input: prices must be an array with length >= 2");
  }
  let sar = [];
  let ep = prices[0].low;
  let af = start;
  let isUptrend = true;
  sar[0] = prices[0].low;
  for (let i = 1; i < prices.length; i++) {
    let prevSar = sar[i - 1];
    let currHigh = prices[i].high;
    let currLow = prices[i].low;
    if (isUptrend) {
      sar[i] = prevSar + af * (ep - prevSar);
      if (sar[i] > currLow) {
        isUptrend = false;
        sar[i] = ep;
        ep = currHigh;
        af = start;
      } else {
        if (currHigh > ep) {
          ep = currHigh;
          af = Math.min(af + increment, maximum);
        }
        sar[i] = Math.min(sar[i], currLow, prices[i - 1].low);
      }
    } else {
      sar[i] = prevSar + af * (ep - prevSar);
      if (sar[i] < currHigh) {
        isUptrend = true;
        sar[i] = ep;
        ep = currLow;
        af = start;
      } else {
        if (currLow < ep) {
          ep = currLow;
          af = Math.min(af + increment, maximum);
        }
        sar[i] = Math.max(sar[i], currHigh, prices[i - 1].high);
      }
    }
  }
  return sar;
}

function calculateWilliamsR(prices, length = 14) {
  if (!Array.isArray(prices) || prices.length < length) {
    throw new Error("Invalid input: prices must have length >= length");
  }
  const percentR = [];
  for (let i = length - 1; i < prices.length; i++) {
    const slice = prices.slice(i - length + 1, i + 1);
    const max = Math.max(...slice.map((p) => p.high));
    const min = Math.min(...slice.map((p) => p.low));
    const close = prices[i].close;
    const pr = max === min ? 0 : (100 * (close - max)) / (max - min);
    percentR.push(pr);
  }
  return percentR;
}

function calculateVWAP(
  prices,
  calcMode = "Standard Deviation",
  bandMult1 = 1.0,
  bandMult2 = 2.0,
  bandMult3 = 3.0,
  offset = 0
) {
  if (!Array.isArray(prices) || prices.length < 1) {
    throw new Error("Invalid input: prices must be an array with length >= 1");
  }
  let cumVolume = 0;
  let cumPriceVolume = 0;
  const vwap = [];
  const upperBands = [[], [], []];
  const lowerBands = [[], [], []];
  for (let i = 0; i < prices.length; i++) {
    const typicalPrice = (prices[i].high + prices[i].low + prices[i].close) / 3;
    const volume = prices[i].volume || 1;
    cumPriceVolume += typicalPrice * volume;
    cumVolume += volume;
    vwap.push(cumPriceVolume / cumVolume);
    if (i > 0) {
      const pricesSoFar = prices
        .slice(0, i + 1)
        .map((p) => (p.high + p.low + p.close) / 3);
      const mean = vwap[i];
      const variance =
        pricesSoFar.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) /
        (i + 1);
      const stdev = Math.sqrt(variance);
      const bandBasis = calcMode === "Standard Deviation" ? stdev : mean * 0.01;
      upperBands[0].push(mean + bandBasis * bandMult1);
      lowerBands[0].push(mean - bandBasis * bandMult1);
      upperBands[1].push(mean + bandBasis * bandMult2);
      lowerBands[1].push(mean - bandBasis * bandMult2);
      upperBands[2].push(mean + bandBasis * bandMult3);
      lowerBands[2].push(mean - bandBasis * bandMult3);
    } else {
      upperBands[0].push(NaN);
      lowerBands[0].push(NaN);
      upperBands[1].push(NaN);
      lowerBands[1].push(NaN);
      upperBands[2].push(NaN);
      lowerBands[2].push(NaN);
    }
  }
  return {
    vwap,
    upperBand1: upperBands[0],
    lowerBand1: lowerBands[0],
    upperBand2: upperBands[1],
    lowerBand2: lowerBands[1],
    upperBand3: upperBands[2],
    lowerBand3: lowerBands[2],
  };
}
function calculateBollingerBands(
  prices,
  length = 20,
  maType = "SMA",
  mult = 2.0,
  offset = 0
) {
  if (!Array.isArray(prices) || prices.length < length) {
    throw new Error("Invalid input: prices must have length >= length");
  }
  const closes = prices.map((p) => p.close);
  const basis = [];
  const upper = [];
  const lower = [];
  function sma(arr, len) {
    const result = [];
    for (let i = len - 1; i < arr.length; i++) {
      const slice = arr.slice(i - len + 1, i + 1);
      result.push(slice.reduce((sum, val) => sum + val, 0) / len);
    }
    return result;
  }
  function ema(arr, len) {
    const k = 2 / (len + 1);
    const result = [arr[0]];
    for (let i = 1; i < arr.length; i++) {
      result.push(arr[i] * k + result[i - 1] * (1 - k));
    }
    return result.slice(len - 1);
  }
  function rma(arr, len) {
    const k = 1 / len;
    const result = [arr[0]];
    for (let i = 1; i < arr.length; i++) {
      result.push(arr[i] * k + result[i - 1] * (1 - k));
    }
    return result.slice(len - 1);
  }
  function wma(arr, len) {
    const result = [];
    const weights = Array.from({ length: len }, (_, i) => i + 1);
    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    for (let i = len - 1; i < arr.length; i++) {
      const slice = arr.slice(i - len + 1, i + 1);
      let weightedSum = 0;
      for (let j = 0; j < len; j++) {
        weightedSum += slice[j] * weights[j];
      }
      result.push(weightedSum / weightSum);
    }
    return result;
  }
  let ma;
  switch (maType) {
    case "SMA":
      ma = sma(closes, length);
      break;
    case "EMA":
      ma = ema(closes, length);
      break;
    case "SMMA":
    case "RMA":
      ma = rma(closes, length);
      break;
    case "WMA":
      ma = wma(closes, length);
      break;
    default:
      ma = sma(closes, length);
  }
  for (let i = length - 1; i < closes.length; i++) {
    const slice = closes.slice(i - length + 1, i + 1);
    const mean = ma[i - length + 1];
    const variance =
      slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / length;
    const dev = mult * Math.sqrt(variance);
    basis.push(mean);
    upper.push(mean + dev);
    lower.push(mean - dev);
  }
  return { basis, upper, lower };
}
module.exports = {
  calculateRSI,
  calculateEMA,
  calculateMACD,
  calculateADX,
  calculateSupertrend,
  calculateBollingerBands,
  calculateVWAP,
  calculateWilliamsR,
  calculateParabolicSAR,
  calculateIchimokuCloud,
};
