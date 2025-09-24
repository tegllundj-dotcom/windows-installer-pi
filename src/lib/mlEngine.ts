import { Trade, Position } from './mockData'

export interface PredictionResult {
  symbol: string
  priceTarget: number
  confidence: number
  direction: 'bullish' | 'bearish' | 'neutral'
  timeHorizon: '1h' | '4h' | '1d' | '1w'
  factors: string[]
}

export interface StrategyOptimization {
  strategyId: string
  optimizedParams: Record<string, number>
  expectedReturn: number
  riskScore: number
  winRate: number
  maxDrawdown: number
  sharpeRatio: number
}

export interface MarketRegime {
  regime: 'trending' | 'ranging' | 'volatile' | 'stable'
  confidence: number
  characteristics: string[]
  recommendedStrategies: string[]
}

export interface MLAnalysis {
  predictions: PredictionResult[]
  optimizations: StrategyOptimization[]
  marketRegime: MarketRegime
  riskFactors: string[]
  timestamp: Date
}

class MLEngine {
  private patterns: Map<string, number[]> = new Map()
  private volatilityCache: Map<string, number> = new Map()

  // Simplified ML prediction based on price patterns and momentum
  async predictPrices(symbols: string[], historicalData: Trade[]): Promise<PredictionResult[]> {
    const predictions: PredictionResult[] = []

    for (const symbol of symbols) {
      const symbolTrades = historicalData
        .filter(trade => trade.symbol === symbol)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      if (symbolTrades.length < 10) {
        predictions.push({
          symbol,
          priceTarget: symbolTrades[symbolTrades.length - 1]?.price || 100,
          confidence: 0.3,
          direction: 'neutral',
          timeHorizon: '1d',
          factors: ['insufficient_data']
        })
        continue
      }

      const prices = symbolTrades.map(t => t.price)
      const returns = this.calculateReturns(prices)
      const volatility = this.calculateVolatility(returns)
      const momentum = this.calculateMomentum(prices)
      const rsi = this.calculateRSI(prices)
      
      // Simple trend detection
      const shortMA = this.calculateSMA(prices.slice(-5))
      const longMA = this.calculateSMA(prices.slice(-10))
      const currentPrice = prices[prices.length - 1]

      // Pattern recognition
      const patterns = this.detectPatterns(prices.slice(-20))
      
      // Prediction logic
      let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral'
      let confidence = 0.5
      let priceTarget = currentPrice
      const factors: string[] = []

      // Trend analysis
      if (shortMA > longMA * 1.02) {
        direction = 'bullish'
        confidence += 0.2
        factors.push('bullish_trend')
        priceTarget = currentPrice * (1 + momentum * 0.1)
      } else if (shortMA < longMA * 0.98) {
        direction = 'bearish'
        confidence += 0.2
        factors.push('bearish_trend')
        priceTarget = currentPrice * (1 - Math.abs(momentum) * 0.1)
      }

      // Momentum analysis
      if (Math.abs(momentum) > 0.05) {
        confidence += 0.15
        factors.push(momentum > 0 ? 'strong_momentum' : 'weak_momentum')
      }

      // RSI analysis
      if (rsi < 30) {
        direction = direction === 'bearish' ? 'bearish' : 'bullish'
        confidence += 0.1
        factors.push('oversold')
      } else if (rsi > 70) {
        direction = direction === 'bullish' ? 'bullish' : 'bearish'
        confidence += 0.1
        factors.push('overbought')
      }

      // Pattern analysis
      if (patterns.length > 0) {
        confidence += 0.1
        factors.push(...patterns)
      }

      // Volatility adjustment
      if (volatility > 0.03) {
        confidence -= 0.1
        factors.push('high_volatility')
      }

      predictions.push({
        symbol,
        priceTarget: Math.max(priceTarget, currentPrice * 0.9),
        confidence: Math.min(Math.max(confidence, 0.1), 0.9),
        direction,
        timeHorizon: volatility > 0.02 ? '1h' : '1d',
        factors
      })
    }

    return predictions
  }

  // Strategy optimization using genetic algorithm concepts
  async optimizeStrategy(
    strategyId: string,
    historicalTrades: Trade[],
    currentParams: Record<string, number>
  ): Promise<StrategyOptimization> {
    // Simplified optimization - in real world, this would use more sophisticated ML
    const paramVariations = this.generateParameterVariations(currentParams)
    let bestParams = currentParams
    let bestScore = this.scoreStrategy(historicalTrades, currentParams)

    // Test parameter variations
    for (const params of paramVariations) {
      const score = this.scoreStrategy(historicalTrades, params)
      if (score > bestScore) {
        bestScore = score
        bestParams = params
      }
    }

    // Calculate performance metrics
    const trades = this.simulateTradesWithParams(historicalTrades, bestParams)
    const returns = this.calculateTradeReturns(trades)
    const winRate = returns.filter(r => r > 0).length / returns.length
    const totalReturn = returns.reduce((sum, r) => sum + r, 0)
    const avgReturn = totalReturn / returns.length
    const volatility = this.calculateVolatility(returns)
    const sharpeRatio = volatility > 0 ? avgReturn / volatility : 0
    const maxDrawdown = this.calculateMaxDrawdown(returns)

    return {
      strategyId,
      optimizedParams: bestParams,
      expectedReturn: totalReturn,
      riskScore: Math.min(volatility * 100, 10),
      winRate: winRate * 100,
      maxDrawdown: maxDrawdown * 100,
      sharpeRatio
    }
  }

  // Market regime detection
  async detectMarketRegime(trades: Trade[]): Promise<MarketRegime> {
    const prices = trades.map(t => t.price)
    const returns = this.calculateReturns(prices)
    const volatility = this.calculateVolatility(returns)
    
    // Simple regime detection logic
    const trend = this.calculateTrendStrength(prices)
    const volume = trades.reduce((sum, t) => sum + (t.quantity || 0), 0) / trades.length

    let regime: MarketRegime['regime']
    const characteristics: string[] = []
    const recommendedStrategies: string[] = []

    if (volatility > 0.03) {
      regime = 'volatile'
      characteristics.push('High volatility', 'Increased risk')
      recommendedStrategies.push('mean_reversion', 'volatility_arbitrage')
    } else if (Math.abs(trend) > 0.02) {
      regime = 'trending'
      characteristics.push('Strong directional movement')
      recommendedStrategies.push('momentum', 'trend_following')
    } else if (volatility < 0.01) {
      regime = 'stable'
      characteristics.push('Low volatility', 'Sideways movement')
      recommendedStrategies.push('scalping', 'carry_trade')
    } else {
      regime = 'ranging'
      characteristics.push('Bounded price action')
      recommendedStrategies.push('mean_reversion', 'range_trading')
    }

    const confidence = Math.min(0.9, 0.4 + Math.abs(trend) * 5 + volatility * 10)

    return {
      regime,
      confidence,
      characteristics,
      recommendedStrategies
    }
  }

  // Risk factor analysis
  analyzeRiskFactors(trades: Trade[], positions: Position[]): string[] {
    const factors: string[] = []
    
    // Concentration risk
    const symbolCounts = new Map<string, number>()
    trades.forEach(trade => {
      symbolCounts.set(trade.symbol, (symbolCounts.get(trade.symbol) || 0) + 1)
    })
    
    const totalTrades = trades.length
    for (const [symbol, count] of symbolCounts.entries()) {
      if (count / totalTrades > 0.4) {
        factors.push(`High concentration in ${symbol} (${Math.round(count/totalTrades*100)}%)`)
      }
    }

    // Large position sizes
    positions.forEach(pos => {
      if (pos.quantity * pos.currentPrice > 50000) {
        factors.push(`Large position in ${pos.symbol}`)
      }
    })

    // Recent losses
    const recentTrades = trades.slice(-10)
    const recentLosses = this.calculateTradeReturns(recentTrades).filter(r => r < 0)
    if (recentLosses.length > 6) {
      factors.push('High recent loss rate')
    }

    // Volatility exposure
    const returns = this.calculateTradeReturns(trades)
    const volatility = this.calculateVolatility(returns)
    if (volatility > 0.05) {
      factors.push('High portfolio volatility')
    }

    return factors
  }

  // Calculate returns from trades (simulate P&L)
  private calculateTradeReturns(trades: Trade[]): number[] {
    const returns: number[] = []
    const positions = new Map<string, { quantity: number, avgPrice: number }>()
    
    for (const trade of trades) {
      const existing = positions.get(trade.symbol) || { quantity: 0, avgPrice: 0 }
      
      if (trade.type === 'BUY') {
        const newQuantity = existing.quantity + trade.quantity
        const newAvgPrice = ((existing.quantity * existing.avgPrice) + (trade.quantity * trade.price)) / newQuantity
        positions.set(trade.symbol, { quantity: newQuantity, avgPrice: newAvgPrice })
        returns.push(-0.001) // Transaction cost
      } else {
        // SELL - calculate profit/loss
        const profit = (trade.price - existing.avgPrice) * Math.min(trade.quantity, existing.quantity)
        const profitPercent = existing.avgPrice > 0 ? profit / (existing.avgPrice * Math.min(trade.quantity, existing.quantity)) : 0
        returns.push(profitPercent)
        
        // Update position
        const newQuantity = Math.max(0, existing.quantity - trade.quantity)
        positions.set(trade.symbol, { quantity: newQuantity, avgPrice: existing.avgPrice })
      }
    }
    
    return returns
  }

  // Helper methods
  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1])
    }
    return returns
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
    return Math.sqrt(variance)
  }

  private calculateMomentum(prices: number[]): number {
    if (prices.length < 2) return 0
    return (prices[prices.length - 1] - prices[0]) / prices[0]
  }

  private calculateSMA(prices: number[]): number {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50
    
    const changes = this.calculateReturns(prices)
    const gains = changes.map(c => c > 0 ? c : 0)
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0)
    
    const avgGain = gains.slice(-period).reduce((sum, g) => sum + g, 0) / period
    const avgLoss = losses.slice(-period).reduce((sum, l) => sum + l, 0) / period
    
    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  private calculateTrendStrength(prices: number[]): number {
    if (prices.length < 2) return 0
    const shortMA = this.calculateSMA(prices.slice(-5))
    const longMA = this.calculateSMA(prices.slice(-20))
    return (shortMA - longMA) / longMA
  }

  private detectPatterns(prices: number[]): string[] {
    const patterns: string[] = []
    
    if (prices.length < 10) return patterns
    
    // Simple pattern detection
    const recent = prices.slice(-5)
    const isUptrend = recent.every((price, i) => i === 0 || price >= recent[i-1])
    const isDowntrend = recent.every((price, i) => i === 0 || price <= recent[i-1])
    
    if (isUptrend) patterns.push('uptrend_pattern')
    if (isDowntrend) patterns.push('downtrend_pattern')
    
    // Support/Resistance levels
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const current = prices[prices.length - 1]
    
    if (current <= min * 1.02) patterns.push('near_support')
    if (current >= max * 0.98) patterns.push('near_resistance')
    
    return patterns
  }

  private generateParameterVariations(params: Record<string, number>): Record<string, number>[] {
    const variations: Record<string, number>[] = []
    const keys = Object.keys(params)
    
    // Generate variations by adjusting each parameter by ±10%, ±20%
    const adjustments = [-0.2, -0.1, 0.1, 0.2]
    
    for (const adjustment of adjustments) {
      for (const key of keys) {
        const variation = { ...params }
        variation[key] = params[key] * (1 + adjustment)
        variations.push(variation)
      }
    }
    
    return variations
  }

  private scoreStrategy(trades: Trade[], params: Record<string, number>): number {
    // Simplified strategy scoring
    const returns = this.calculateTradeReturns(trades)
    const totalReturn = returns.reduce((sum, r) => sum + r, 0)
    const winRate = returns.filter(r => r > 0).length / returns.length
    const volatility = this.calculateVolatility(returns)
    
    // Score combines return, win rate, and penalizes volatility
    return totalReturn * winRate - volatility * 1000
  }

  private simulateTradesWithParams(trades: Trade[], params: Record<string, number>): Trade[] {
    // In a real implementation, this would re-run the strategy with new parameters
    // For now, just return the original trades with slight modifications
    return trades.map(trade => ({
      ...trade,
      price: trade.price * (1 + (Math.random() - 0.5) * 0.05) // Simulate price variation
    }))
  }

  private calculateMaxDrawdown(returns: number[]): number {
    let maxDrawdown = 0
    let peak = 0
    let cumulative = 0
    
    for (const ret of returns) {
      cumulative += ret
      if (cumulative > peak) {
        peak = cumulative
      }
      const drawdown = (peak - cumulative) / peak
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    }
    
    return maxDrawdown
  }
}

export const mlEngine = new MLEngine()