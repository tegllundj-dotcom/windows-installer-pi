import { AutomatedTradingEngine, AISignal, AutoTradingConfig } from './automatedTrading'
import { Portfolio, Order, Position, Trade } from './mockData'

export class AISignalService {
  private signals: AISignal[] = []
  private signalSubscribers: Array<(signal: AISignal) => void> = []
  private tradingEngine: AutomatedTradingEngine
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null

  constructor(config: AutoTradingConfig) {
    this.tradingEngine = new AutomatedTradingEngine(config)
  }

  updateConfig(config: AutoTradingConfig) {
    this.tradingEngine.updateConfig(config)
  }

  subscribeToSignals(callback: (signal: AISignal) => void) {
    this.signalSubscribers.push(callback)
    return () => {
      const index = this.signalSubscribers.indexOf(callback)
      if (index > -1) {
        this.signalSubscribers.splice(index, 1)
      }
    }
  }

  private notifySignalSubscribers(signal: AISignal) {
    this.signalSubscribers.forEach(callback => callback(signal))
  }

  private generateSignalForSymbol(symbol: string): AISignal {
    // Simulate AI analysis with realistic market behavior
    const basePrice = this.getLastKnownPrice(symbol)
    const currentPrice = basePrice * (0.98 + Math.random() * 0.04) // ±2% variation
    
    // Generate confidence based on "market conditions"
    const marketVolatility = 0.3 + Math.random() * 0.4 // 0.3 to 0.7
    const trendStrength = Math.random() // 0 to 1
    const volumeConfirmation = 0.5 + Math.random() * 0.5 // 0.5 to 1
    
    // Combine factors for overall confidence
    const rawConfidence = (
      (1 - marketVolatility) * 0.4 + // Lower volatility = higher confidence
      trendStrength * 0.4 + // Stronger trend = higher confidence
      volumeConfirmation * 0.2 // Volume confirmation
    )
    
    const confidence = Math.max(0.5, Math.min(0.95, rawConfidence))
    
    // Determine action based on technical factors
    const technicalScore = Math.random() - 0.5 // -0.5 to 0.5
    const sentimentScore = Math.random() - 0.5 // -0.5 to 0.5
    const momentumScore = Math.random() - 0.5 // -0.5 to 0.5
    
    const overallScore = technicalScore + sentimentScore + momentumScore
    const action: 'BUY' | 'SELL' = overallScore > 0 ? 'BUY' : 'SELL'
    
    const targetPrice = action === 'BUY' 
      ? currentPrice * (1 + Math.random() * 0.05 + 0.02) // +2% to +7%
      : currentPrice * (1 - Math.random() * 0.05 - 0.02) // -2% to -7%

    const getStrength = (conf: number): 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG' => {
      if (conf >= 0.9) return 'VERY_STRONG'
      if (conf >= 0.8) return 'STRONG'
      if (conf >= 0.7) return 'MODERATE'
      return 'WEAK'
    }

    const reasoningTemplates = {
      'BUY': [
        `Golden cross detected on ${symbol} with RSI showing bullish divergence at oversold levels`,
        `Machine learning model indicates ${symbol} breakout above key resistance with 89% historical success rate`,
        `Institutional buying pressure detected in ${symbol} with volume spike and positive sentiment shift`,
        `Neural network pattern recognition identified ${symbol} cup-and-handle formation with strong momentum`,
        `Multi-timeframe analysis shows ${symbol} in uptrend with support level bounce confirmation`,
        `Bollinger Band squeeze breakout detected in ${symbol} with increased volatility to upside`
      ],
      'SELL': [
        `Death cross formation in ${symbol} with declining volume and bearish MACD crossover`,
        `AI sentiment analysis indicates negative news flow impact on ${symbol} with institutional selling`,
        `Resistance level rejection detected in ${symbol} with double-top formation and declining momentum`,
        `Machine learning risk model flags ${symbol} for potential downside with correlation to market weakness`,
        `Technical analysis shows ${symbol} breaking key support with accelerating selling pressure`,
        `Pattern recognition identifies ${symbol} head-and-shoulders top with volume confirmation`
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
      strength: getStrength(confidence)
    }
  }

  private getLastKnownPrice(symbol: string): number {
    // Simulated price data - in real implementation, this would fetch from market data service
    const prices: Record<string, number> = {
      'AAPL': 182.50,
      'GOOGL': 142.30,
      'MSFT': 415.20,
      'TSLA': 248.85,
      'AMZN': 151.75,
      'NVDA': 875.30,
      'META': 485.60,
      'NFLX': 445.20,
      'SPY': 485.75,
      'QQQ': 395.40
    }
    return prices[symbol] || 100 + Math.random() * 900
  }

  private async generateSignals() {
    if (!this.isRunning) return

    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX', 'SPY', 'QQQ']
    
    // Generate 1-3 signals
    const numSignals = Math.floor(Math.random() * 3) + 1
    const selectedSymbols = symbols.sort(() => 0.5 - Math.random()).slice(0, numSignals)
    
    for (const symbol of selectedSymbols) {
      const signal = this.generateSignalForSymbol(symbol)
      this.signals.unshift(signal) // Add to beginning of array
      
      // Keep only last 20 signals
      if (this.signals.length > 20) {
        this.signals = this.signals.slice(0, 20)
      }
      
      this.notifySignalSubscribers(signal)
      
      // Add small delay between signals
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  async executeAutomatedTrading(
    portfolio: Portfolio,
    positions: Position[],
    orders: Order[],
    trades: Trade[],
    onUpdateOrders: (orders: Order[]) => void,
    onUpdatePositions: (positions: Position[]) => void,
    onUpdateTrades: (trades: Trade[]) => void,
    onUpdatePortfolio: (portfolio: Portfolio) => void
  ) {
    if (!this.isRunning) return

    // Get recent high-confidence signals that haven't been processed
    const highConfidenceSignals = this.signals
      .filter(signal => 
        signal.confidence >= 0.75 && // High confidence threshold
        Date.now() - signal.timestamp.getTime() < 300000 // Last 5 minutes
      )
      .slice(0, 3) // Limit to 3 signals per cycle

    for (const signal of highConfidenceSignals) {
      try {
        const result = await this.tradingEngine.executeSignal(
          signal,
          portfolio,
          positions,
          orders,
          trades,
          onUpdateOrders,
          onUpdatePositions,
          onUpdateTrades,
          onUpdatePortfolio
        )

        if (result.success && result.orderId) {
          console.log(`✅ Automated trade executed: ${result.message}`)
        } else {
          console.log(`❌ Signal rejected: ${result.message}`)
        }
      } catch (error) {
        console.error('Error executing automated trade:', error)
      }
    }
  }

  startSignalGeneration() {
    if (this.isRunning) return

    this.isRunning = true
    
    // Generate initial signals immediately
    this.generateSignals()
    
    // Then generate signals every 30-120 seconds
    const scheduleNext = () => {
      if (!this.isRunning) return
      
      const delay = 30000 + Math.random() * 90000 // 30-120 seconds
      this.intervalId = setTimeout(() => {
        this.generateSignals().then(() => {
          scheduleNext()
        })
      }, delay)
    }
    
    scheduleNext()
  }

  stopSignalGeneration() {
    this.isRunning = false
    if (this.intervalId) {
      clearTimeout(this.intervalId)
      this.intervalId = null
    }
  }

  getRecentSignals(count: number = 10): AISignal[] {
    return this.signals.slice(0, count)
  }

  getDailyStats() {
    return this.tradingEngine.getDailyStats()
  }

  getDefaultConfig(): AutoTradingConfig {
    return this.tradingEngine.getDefaultConfig()
  }
}