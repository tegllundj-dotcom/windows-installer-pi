import { Position, Order, Trade, Portfolio } from './mockData'

export interface RiskParameters {
  maxPositionSize: number // Maximum position size as % of portfolio
  stopLossPercent: number // Stop loss percentage
  takeProfitPercent: number // Take profit percentage
  maxDailyLoss: number // Maximum daily loss as % of portfolio
  maxOpenPositions: number // Maximum number of open positions
  confidenceThreshold: number // Minimum AI confidence (0-1) to execute trades
  allowedSymbols: string[] // Symbols allowed for automated trading
}

export interface AISignal {
  symbol: string
  action: 'BUY' | 'SELL'
  confidence: number // 0-1
  targetPrice: number
  currentPrice: number
  reasoning: string
  timestamp: Date
  strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG'
}

export interface AutoTradingConfig {
  enabled: boolean
  riskParameters: RiskParameters
  tradingHours: {
    start: string // HH:MM format
    end: string // HH:MM format
    timezone: string
  }
}

export class AutomatedTradingEngine {
  private config: AutoTradingConfig
  private executedTradesToday = 0
  private dailyPnL = 0
  private lastResetDate = new Date().toDateString()

  constructor(config: AutoTradingConfig) {
    this.config = config
  }

  updateConfig(config: AutoTradingConfig) {
    this.config = config
  }

  private resetDailyCounters() {
    const today = new Date().toDateString()
    if (this.lastResetDate !== today) {
      this.executedTradesToday = 0
      this.dailyPnL = 0
      this.lastResetDate = today
    }
  }

  private isWithinTradingHours(): boolean {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    return currentTime >= this.config.tradingHours.start && 
           currentTime <= this.config.tradingHours.end
  }

  private calculatePositionSize(
    signal: AISignal, 
    portfolio: Portfolio, 
    existingPositions: Position[]
  ): number {
    const { maxPositionSize, confidenceThreshold } = this.config.riskParameters
    
    // Base position size as percentage of portfolio
    const baseSize = (portfolio.totalValue * maxPositionSize) / 100
    
    // Adjust size based on confidence (higher confidence = larger position)
    const confidenceMultiplier = Math.min(signal.confidence / confidenceThreshold, 2)
    
    // Adjust size based on signal strength
    const strengthMultipliers = {
      'WEAK': 0.5,
      'MODERATE': 0.75,
      'STRONG': 1.0,
      'VERY_STRONG': 1.25
    }
    
    const adjustedSize = baseSize * confidenceMultiplier * strengthMultipliers[signal.strength]
    
    return Math.floor(adjustedSize / signal.currentPrice)
  }

  private validateSignal(
    signal: AISignal, 
    portfolio: Portfolio, 
    positions: Position[], 
    orders: Order[]
  ): { valid: boolean; reason?: string } {
    this.resetDailyCounters()

    // Check if automated trading is enabled
    if (!this.config.enabled) {
      return { valid: false, reason: 'Automated trading is disabled' }
    }

    // Check trading hours
    if (!this.isWithinTradingHours()) {
      return { valid: false, reason: 'Outside trading hours' }
    }

    // Check confidence threshold
    if (signal.confidence < this.config.riskParameters.confidenceThreshold) {
      return { valid: false, reason: `Confidence ${signal.confidence.toFixed(2)} below threshold ${this.config.riskParameters.confidenceThreshold}` }
    }

    // Check if symbol is allowed
    if (!this.config.riskParameters.allowedSymbols.includes(signal.symbol)) {
      return { valid: false, reason: `Symbol ${signal.symbol} not in allowed list` }
    }

    // Check maximum open positions
    if (positions.length >= this.config.riskParameters.maxOpenPositions) {
      return { valid: false, reason: 'Maximum open positions reached' }
    }

    // Check daily loss limit
    if (this.dailyPnL <= -Math.abs(portfolio.totalValue * this.config.riskParameters.maxDailyLoss / 100)) {
      return { valid: false, reason: 'Daily loss limit reached' }
    }

    // Check for existing position in same symbol
    const existingPosition = positions.find(p => p.symbol === signal.symbol)
    if (existingPosition && 
        ((signal.action === 'BUY' && existingPosition.quantity > 0) ||
         (signal.action === 'SELL' && existingPosition.quantity < 0))) {
      return { valid: false, reason: 'Already have position in same direction' }
    }

    return { valid: true }
  }

  async executeSignal(
    signal: AISignal,
    portfolio: Portfolio,
    positions: Position[],
    orders: Order[],
    trades: Trade[],
    onUpdateOrders: (orders: Order[]) => void,
    onUpdatePositions: (positions: Position[]) => void,
    onUpdateTrades: (trades: Trade[]) => void,
    onUpdatePortfolio: (portfolio: Portfolio) => void
  ): Promise<{ success: boolean; message: string; orderId?: string }> {
    
    const validation = this.validateSignal(signal, portfolio, positions, orders)
    if (!validation.valid) {
      return { success: false, message: validation.reason || 'Signal validation failed' }
    }

    try {
      const quantity = this.calculatePositionSize(signal, portfolio, positions)
      
      if (quantity <= 0) {
        return { success: false, message: 'Calculated position size too small' }
      }

      const orderId = `AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Calculate stop loss and take profit prices
      const stopLossPrice = signal.action === 'BUY' 
        ? signal.currentPrice * (1 - this.config.riskParameters.stopLossPercent / 100)
        : signal.currentPrice * (1 + this.config.riskParameters.stopLossPercent / 100)
      
      const takeProfitPrice = signal.action === 'BUY'
        ? signal.currentPrice * (1 + this.config.riskParameters.takeProfitPercent / 100)
        : signal.currentPrice * (1 - this.config.riskParameters.takeProfitPercent / 100)

      // Create main order
      const mainOrder: Order = {
        id: orderId,
        symbol: signal.symbol,
        type: signal.action,
        orderType: 'MARKET',
        quantity,
        price: signal.currentPrice,
        status: 'FILLED',
        timestamp: new Date().toISOString(),
        filledQuantity: quantity,
        avgFillPrice: signal.currentPrice,
        condition: 'DAY'
      }

      // Create stop loss order
      const stopLossOrder: Order = {
        id: `SL_${orderId}`,
        symbol: signal.symbol,
        type: signal.action === 'BUY' ? 'SELL' : 'BUY',
        orderType: 'STOP_LOSS',
        quantity,
        stopPrice: stopLossPrice,
        status: 'PENDING',
        timestamp: new Date().toISOString(),
        filledQuantity: 0,
        condition: 'GTC'
      }

      // Create take profit order
      const takeProfitOrder: Order = {
        id: `TP_${orderId}`,
        symbol: signal.symbol,
        type: signal.action === 'BUY' ? 'SELL' : 'BUY',
        orderType: 'LIMIT',
        quantity,
        price: takeProfitPrice,
        status: 'PENDING',
        timestamp: new Date().toISOString(),
        filledQuantity: 0,
        condition: 'GTC'
      }

      // Update orders
      const newOrders = [...orders, mainOrder, stopLossOrder, takeProfitOrder]
      onUpdateOrders(newOrders)

      // Create or update position
      const existingPositionIndex = positions.findIndex(p => p.symbol === signal.symbol)
      const newQuantity = signal.action === 'BUY' ? quantity : -quantity
      
      if (existingPositionIndex >= 0) {
        const updatedPositions = [...positions]
        const existingPos = updatedPositions[existingPositionIndex]
        const totalQuantity = existingPos.quantity + newQuantity
        const newAvgPrice = totalQuantity !== 0 ? 
          (existingPos.avgPrice * existingPos.quantity + signal.currentPrice * newQuantity) / totalQuantity :
          signal.currentPrice
        
        updatedPositions[existingPositionIndex] = {
          ...existingPos,
          quantity: totalQuantity,
          avgPrice: newAvgPrice,
          currentPrice: signal.currentPrice,
          marketValue: totalQuantity * signal.currentPrice,
          gainLoss: (signal.currentPrice - newAvgPrice) * totalQuantity,
          gainLossPercent: totalQuantity !== 0 ? ((signal.currentPrice - newAvgPrice) / newAvgPrice) * 100 : 0,
          lastUpdate: new Date().toISOString()
        }
        onUpdatePositions(updatedPositions)
      } else {
        const newPosition: Position = {
          symbol: signal.symbol,
          quantity: newQuantity,
          avgPrice: signal.currentPrice,
          currentPrice: signal.currentPrice,
          marketValue: newQuantity * signal.currentPrice,
          gainLoss: 0,
          gainLossPercent: 0,
          lastUpdate: new Date().toISOString()
        }
        onUpdatePositions([...positions, newPosition])
      }

      // Create trade record
      const trade: Trade = {
        id: orderId,
        symbol: signal.symbol,
        type: signal.action,
        quantity,
        price: signal.currentPrice,
        timestamp: new Date().toISOString(),
        status: 'COMPLETED'
      }

      onUpdateTrades([...trades, trade])

      // Update portfolio (adjust available cash)
      const tradeCost = quantity * signal.currentPrice
      const commission = tradeCost * 0.001 // 0.1% commission
      const newAvailableCash = portfolio.availableCash - tradeCost - commission
      
      onUpdatePortfolio({
        ...portfolio,
        availableCash: newAvailableCash,
        totalValue: portfolio.totalValue, // Will be recalculated with new positions
      })

      this.executedTradesToday++
      
      return { 
        success: true, 
        message: `Executed ${signal.action} ${quantity} shares of ${signal.symbol} at $${signal.currentPrice.toFixed(2)}`,
        orderId 
      }

    } catch (error) {
      return { 
        success: false, 
        message: `Failed to execute trade: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  generateAISignal(symbol: string, marketData: any): AISignal {
    // This is a simplified AI signal generation for demo purposes
    // In real implementation, this would use the ML models from mlEngine.ts
    
    const currentPrice = marketData.price || Math.random() * 1000 + 50
    const confidence = Math.random() * 0.4 + 0.6 // 0.6 to 1.0
    const action: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL'
    
    const priceDirection = action === 'BUY' ? 1 : -1
    const targetPrice = currentPrice * (1 + (Math.random() * 0.05 + 0.02) * priceDirection)
    
    const confidenceToStrength = (conf: number): 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG' => {
      if (conf >= 0.9) return 'VERY_STRONG'
      if (conf >= 0.8) return 'STRONG'
      if (conf >= 0.7) return 'MODERATE'
      return 'WEAK'
    }

    const reasoningTemplates = {
      'BUY': [
        'Technical indicators show strong bullish momentum with RSI divergence',
        'Machine learning model detected breakout pattern with high probability',
        'Market sentiment analysis indicates positive outlook with volume confirmation',
        'Neural network identified support level bounce with trend continuation signal'
      ],
      'SELL': [
        'Bearish divergence detected with overbought conditions in multiple timeframes',
        'AI pattern recognition suggests resistance level rejection',
        'Sentiment analysis shows deteriorating market conditions',
        'Neural network indicates potential trend reversal with volume weakness'
      ]
    }

    const reasoning = reasoningTemplates[action][Math.floor(Math.random() * reasoningTemplates[action].length)]

    return {
      symbol,
      action,
      confidence,
      targetPrice,
      currentPrice,
      reasoning,
      timestamp: new Date(),
      strength: confidenceToStrength(confidence)
    }
  }

  getDefaultRiskParameters(): RiskParameters {
    return {
      maxPositionSize: 5, // 5% of portfolio per position
      stopLossPercent: 2, // 2% stop loss
      takeProfitPercent: 4, // 4% take profit (2:1 risk/reward)
      maxDailyLoss: 10, // 10% maximum daily loss
      maxOpenPositions: 5,
      confidenceThreshold: 0.75, // 75% minimum confidence
      allowedSymbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX', 'SPY', 'QQQ']
    }
  }

  getDefaultConfig(): AutoTradingConfig {
    return {
      enabled: false,
      riskParameters: this.getDefaultRiskParameters(),
      tradingHours: {
        start: '09:30',
        end: '16:00',
        timezone: 'America/New_York'
      }
    }
  }

  getDailyStats() {
    this.resetDailyCounters()
    return {
      tradesExecuted: this.executedTradesToday,
      dailyPnL: this.dailyPnL
    }
  }
}