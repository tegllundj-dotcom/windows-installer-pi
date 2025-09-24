export interface TechnicalIndicator {
  sma: (prices: number[], period: number) => number[]
  ema: (prices: number[], period: number) => number[]
  rsi: (prices: number[], period: number) => number[]
  macd: (prices: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number) => {
    macd: number[]
    signal: number[]
    histogram: number[]
  }
  bollinger: (prices: number[], period: number, stdDev: number) => {
    upper: number[]
    middle: number[]
    lower: number[]
  }
}

export interface MarketData {
  symbol: string
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Signal {
  type: 'BUY' | 'SELL' | 'HOLD'
  strength: number // 0-1
  reason: string
  timestamp: string
  price: number
}

export interface StrategyConfig {
  id: string
  name: string
  description: string
  parameters: Record<string, number | string | boolean>
  riskManagement: {
    stopLoss: number // percentage
    takeProfit: number // percentage
    maxPositionSize: number // percentage of portfolio
    maxDrawdown: number // percentage
  }
  active: boolean
}

export interface BacktestResult {
  strategyId: string
  startDate: string
  endDate: string
  initialCapital: number
  finalCapital: number
  totalReturn: number
  totalReturnPercent: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  profitFactor: number
  maxDrawdown: number
  maxDrawdownPercent: number
  sharpeRatio: number
  avgWin: number
  avgLoss: number
  largestWin: number
  largestLoss: number
  trades: BacktestTrade[]
  equity: EquityPoint[]
}

export interface BacktestTrade {
  entryDate: string
  exitDate: string
  symbol: string
  type: 'LONG' | 'SHORT'
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  pnlPercent: number
  duration: number // days
  reason: string
}

export interface EquityPoint {
  date: string
  equity: number
  drawdown: number
}

export abstract class TradingStrategy {
  protected config: StrategyConfig
  protected indicators: TechnicalIndicator

  constructor(config: StrategyConfig) {
    this.config = config
    this.indicators = createTechnicalIndicators()
  }

  abstract generateSignal(data: MarketData[], currentIndex: number): Signal

  getConfig(): StrategyConfig {
    return this.config
  }

  updateConfig(newConfig: Partial<StrategyConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Technical Indicators Implementation
export function createTechnicalIndicators(): TechnicalIndicator {
  return {
    sma: (prices: number[], period: number): number[] => {
      const result: number[] = []
      for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
          result.push(NaN)
        } else {
          const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
          result.push(sum / period)
        }
      }
      return result
    },

    ema: (prices: number[], period: number): number[] => {
      const result: number[] = []
      const multiplier = 2 / (period + 1)
      
      for (let i = 0; i < prices.length; i++) {
        if (i === 0) {
          result.push(prices[i])
        } else {
          const ema = (prices[i] * multiplier) + (result[i - 1] * (1 - multiplier))
          result.push(ema)
        }
      }
      return result
    },

    rsi: (prices: number[], period: number): number[] => {
      const result: number[] = []
      const gains: number[] = []
      const losses: number[] = []

      // Calculate price changes
      for (let i = 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1]
        gains.push(change > 0 ? change : 0)
        losses.push(change < 0 ? -change : 0)
      }

      // Calculate RSI
      for (let i = 0; i < gains.length; i++) {
        if (i < period - 1) {
          result.push(NaN)
        } else {
          const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
          const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
          const rs = avgGain / (avgLoss || 0.001)
          const rsi = 100 - (100 / (1 + rs))
          result.push(rsi)
        }
      }

      return [NaN, ...result]
    },

    macd: (prices: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number) => {
      const indicators = createTechnicalIndicators()
      const fastEMA = indicators.ema(prices, fastPeriod)
      const slowEMA = indicators.ema(prices, slowPeriod)
      
      const macd = fastEMA.map((fast, i) => fast - slowEMA[i])
      const signal = indicators.ema(macd.filter(x => !isNaN(x)), signalPeriod)
      
      // Pad signal array to match macd length
      const paddedSignal = Array(macd.length - signal.length).fill(NaN).concat(signal)
      const histogram = macd.map((m, i) => m - paddedSignal[i])

      return { macd, signal: paddedSignal, histogram }
    },

    bollinger: (prices: number[], period: number, stdDev: number) => {
      const indicators = createTechnicalIndicators()
      const middle = indicators.sma(prices, period)
      const upper: number[] = []
      const lower: number[] = []

      for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
          upper.push(NaN)
          lower.push(NaN)
        } else {
          const slice = prices.slice(i - period + 1, i + 1)
          const mean = slice.reduce((a, b) => a + b, 0) / period
          const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period
          const std = Math.sqrt(variance)
          
          upper.push(middle[i] + (std * stdDev))
          lower.push(middle[i] - (std * stdDev))
        }
      }

      return { upper, middle, lower }
    }
  }
}

// Pre-built Strategy: Moving Average Crossover
export class MovingAverageCrossover extends TradingStrategy {
  generateSignal(data: MarketData[], currentIndex: number): Signal {
    const prices = data.map(d => d.close)
    const fastPeriod = this.config.parameters.fastPeriod as number
    const slowPeriod = this.config.parameters.slowPeriod as number
    
    const fastMA = this.indicators.sma(prices, fastPeriod)
    const slowMA = this.indicators.sma(prices, slowPeriod)
    
    const currentFast = fastMA[currentIndex]
    const currentSlow = slowMA[currentIndex]
    const prevFast = fastMA[currentIndex - 1]
    const prevSlow = slowMA[currentIndex - 1]
    
    if (isNaN(currentFast) || isNaN(currentSlow) || isNaN(prevFast) || isNaN(prevSlow)) {
      return {
        type: 'HOLD',
        strength: 0,
        reason: 'Insufficient data for signal generation',
        timestamp: data[currentIndex].timestamp,
        price: data[currentIndex].close
      }
    }
    
    // Golden Cross: Fast MA crosses above Slow MA
    if (prevFast <= prevSlow && currentFast > currentSlow) {
      return {
        type: 'BUY',
        strength: 0.8,
        reason: `Golden Cross: ${fastPeriod}-period MA crossed above ${slowPeriod}-period MA`,
        timestamp: data[currentIndex].timestamp,
        price: data[currentIndex].close
      }
    }
    
    // Death Cross: Fast MA crosses below Slow MA
    if (prevFast >= prevSlow && currentFast < currentSlow) {
      return {
        type: 'SELL',
        strength: 0.8,
        reason: `Death Cross: ${fastPeriod}-period MA crossed below ${slowPeriod}-period MA`,
        timestamp: data[currentIndex].timestamp,
        price: data[currentIndex].close
      }
    }
    
    return {
      type: 'HOLD',
      strength: 0,
      reason: 'No crossover signal detected',
      timestamp: data[currentIndex].timestamp,
      price: data[currentIndex].close
    }
  }
}

// Pre-built Strategy: RSI Mean Reversion
export class RSIMeanReversion extends TradingStrategy {
  generateSignal(data: MarketData[], currentIndex: number): Signal {
    const prices = data.map(d => d.close)
    const rsiPeriod = this.config.parameters.rsiPeriod as number
    const oversoldLevel = this.config.parameters.oversoldLevel as number
    const overboughtLevel = this.config.parameters.overboughtLevel as number
    
    const rsi = this.indicators.rsi(prices, rsiPeriod)
    const currentRSI = rsi[currentIndex]
    
    if (isNaN(currentRSI)) {
      return {
        type: 'HOLD',
        strength: 0,
        reason: 'Insufficient data for RSI calculation',
        timestamp: data[currentIndex].timestamp,
        price: data[currentIndex].close
      }
    }
    
    if (currentRSI <= oversoldLevel) {
      return {
        type: 'BUY',
        strength: Math.min(1, (oversoldLevel - currentRSI) / 10 + 0.5),
        reason: `RSI oversold at ${currentRSI.toFixed(2)}`,
        timestamp: data[currentIndex].timestamp,
        price: data[currentIndex].close
      }
    }
    
    if (currentRSI >= overboughtLevel) {
      return {
        type: 'SELL',
        strength: Math.min(1, (currentRSI - overboughtLevel) / 10 + 0.5),
        reason: `RSI overbought at ${currentRSI.toFixed(2)}`,
        timestamp: data[currentIndex].timestamp,
        price: data[currentIndex].close
      }
    }
    
    return {
      type: 'HOLD',
      strength: 0,
      reason: `RSI neutral at ${currentRSI.toFixed(2)}`,
      timestamp: data[currentIndex].timestamp,
      price: data[currentIndex].close
    }
  }
}

// Pre-built Strategy: Bollinger Bands
export class BollingerBands extends TradingStrategy {
  generateSignal(data: MarketData[], currentIndex: number): Signal {
    const prices = data.map(d => d.close)
    const period = this.config.parameters.period as number
    const stdDev = this.config.parameters.stdDev as number
    
    const bands = this.indicators.bollinger(prices, period, stdDev)
    const currentPrice = data[currentIndex].close
    const upper = bands.upper[currentIndex]
    const lower = bands.lower[currentIndex]
    const middle = bands.middle[currentIndex]
    
    if (isNaN(upper) || isNaN(lower) || isNaN(middle)) {
      return {
        type: 'HOLD',
        strength: 0,
        reason: 'Insufficient data for Bollinger Bands calculation',
        timestamp: data[currentIndex].timestamp,
        price: currentPrice
      }
    }
    
    // Price touches or crosses below lower band
    if (currentPrice <= lower) {
      const strength = Math.min(1, (lower - currentPrice) / (middle - lower) + 0.5)
      return {
        type: 'BUY',
        strength,
        reason: `Price touched lower Bollinger Band at ${lower.toFixed(2)}`,
        timestamp: data[currentIndex].timestamp,
        price: currentPrice
      }
    }
    
    // Price touches or crosses above upper band
    if (currentPrice >= upper) {
      const strength = Math.min(1, (currentPrice - upper) / (upper - middle) + 0.5)
      return {
        type: 'SELL',
        strength,
        reason: `Price touched upper Bollinger Band at ${upper.toFixed(2)}`,
        timestamp: data[currentIndex].timestamp,
        price: currentPrice
      }
    }
    
    return {
      type: 'HOLD',
      strength: 0,
      reason: 'Price within Bollinger Bands range',
      timestamp: data[currentIndex].timestamp,
      price: currentPrice
    }
  }
}