function calculateSMA(closes, length) {
  if (!Array.isArray(closes) || closes.length < length || length < 1) {
    throw new Error(
      "Invalid input: closes must be an array with length >= period"
    );
  }
  let sma = new Array(closes.length).fill(NaN);
  let sum = closes.slice(0, length).reduce((s, v) => s + v, 0);
  sma[length - 1] = sum / length;
  for (let i = length; i < closes.length; i++) {
    sum = sum - closes[i - length] + closes[i];
    sma[i] = sum / length;
  }
  return sma;
}

function calculateEMA(closes, length) {
  if (!Array.isArray(closes) || closes.length < length || length < 1) {
    throw new Error(
      "Invalid input: closes must be an array with length >= period"
    );
  }
  const alpha = 2 / (length + 1);
  let ema = new Array(closes.length).fill(NaN);
  ema[length - 1] =
    closes.slice(0, length).reduce((sum, price) => sum + price, 0) / length;
  for (let i = length; i < closes.length; i++) {
    ema[i] = alpha * closes[i] + (1 - alpha) * ema[i - 1];
  }
  return ema;
}

// Calculate the True Range (TR)
function calculateTR(high, low, close) {
  if (
    !Array.isArray(high) ||
    high.length !== low.length ||
    high.length !== close.length ||
    high.length < 2
  ) {
    throw new Error(
      "Invalid input: high, low, close must be arrays of equal length >= 2"
    );
  }
  let tr = [];
  for (let i = 1; i < high.length; i++) {
    tr.push(
      Math.max(
        high[i] - low[i],
        Math.abs(high[i] - close[i - 1]),
        Math.abs(low[i] - close[i - 1])
      )
    );
  }
  return tr;
}

function calculateATR(high, low, close, period) {
  if (!Array.isArray(high) || high.length < period + 1 || period < 1) {
    throw new Error("Invalid input: arrays must have length >= period + 1");
  }
  const tr = calculateTR(high, low, close);
  let atr = new Array(high.length).fill(NaN);
  atr[period] =
    tr.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  for (let i = period + 1; i < high.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i - 1]) / period;
  }
  return atr;
}

// Calculate Directional Movement (plusDM, minusDM)
function calculateDirectionalMovement(high, low) {
  if (!Array.isArray(high) || high.length !== low.length || high.length < 2) {
    throw new Error(
      "Invalid input: high, low must be arrays of equal length >= 2"
    );
  }
  let up = [],
    down = [],
    plusDM = [],
    minusDM = [];
  for (let i = 1; i < high.length; i++) {
    up.push(high[i] - high[i - 1]);
    down.push(low[i - 1] - low[i]);
    plusDM.push(up[i - 1] > down[i - 1] && up[i - 1] > 0 ? up[i - 1] : 0);
    minusDM.push(down[i - 1] > up[i - 1] && down[i - 1] > 0 ? down[i - 1] : 0);
  }
  return { plusDM, minusDM };
}

// Calculate the Running Moving Average (RMA)
function calculateRMA(values, length) {
  if (!Array.isArray(values) || values.length < length || length < 1) {
    throw new Error(
      "Invalid input: values must be an array with length >= period"
    );
  }
  let rma = new Array(values.length).fill(NaN);
  rma[length - 1] =
    values.slice(0, length).reduce((sum, val) => sum + val, 0) / length;
  for (let i = length; i < values.length; i++) {
    rma[i] = (rma[i - 1] * (length - 1) + values[i]) / length;
  }
  return rma;
}

module.exports = {
  calculateSMA,
  calculateEMA,
  calculateRMA,
  calculateDirectionalMovement,
  calculateTR,
  calculateATR,
};
