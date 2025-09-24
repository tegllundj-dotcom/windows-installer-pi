export interface MarketDataPoint {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: Date
  indicators?: {
    rsi?: number
    macd?: number
    ma20?: number
    ma50?: number
    bb_upper?: number
    bb_lower?: number
    volatility?: number
  }
}

export interface MarketSentiment {
  score: number // -1 to 1
  label: 'BEARISH' | 'NEUTRAL' | 'BULLISH'
  volume_weighted: number
  news_sentiment: number
  technical_sentiment: number
}

export class RealTimeMarketDataService {
  private subscribers: Map<string, ((data: MarketDataPoint) => void)[]> = new Map()
  private sentimentSubscribers: ((sentiment: MarketSentiment) => void)[] = []
  private intervals: Set<NodeJS.Timeout> = new Set()
  
  // Simulate real-time market data
  subscribe(symbol: string, callback: (data: MarketDataPoint) => void) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, [])
      this.startDataStream(symbol)
    }
    
    this.subscribers.get(symbol)!.push(callback)
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(symbol)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
        
        if (callbacks.length === 0) {
          this.stopDataStream(symbol)
          this.subscribers.delete(symbol)
        }
      }
    }
  }
  
  subscribeToMarketSentiment(callback: (sentiment: MarketSentiment) => void) {
    this.sentimentSubscribers.push(callback)
    
    if (this.sentimentSubscribers.length === 1) {
      this.startSentimentStream()
    }
    
    return () => {
      const index = this.sentimentSubscribers.indexOf(callback)
      if (index > -1) {
        this.sentimentSubscribers.splice(index, 1)
      }
      
      if (this.sentimentSubscribers.length === 0) {
        this.stopSentimentStream()
      }
    }
  }
  
  private startDataStream(symbol: string) {
    let basePrice = this.getBasePrice(symbol)
    let lastPrice = basePrice
    
    const interval = setInterval(() => {
      // Generate realistic price movement
      const volatility = this.getSymbolVolatility(symbol)
      const change = (Math.random() - 0.5) * volatility * 2
      const newPrice = Math.max(0.01, lastPrice + change)
      
      // Calculate technical indicators
      const indicators = this.calculateTechnicalIndicators(symbol, newPrice)
      
      const dataPoint: MarketDataPoint = {
        symbol,
        price: newPrice,
        change: newPrice - basePrice,
        changePercent: ((newPrice - basePrice) / basePrice) * 100,
        volume: Math.floor(Math.random() * 1000000) + 500000,
        timestamp: new Date(),
        indicators
      }
      
      // Emit to subscribers
      this.subscribers.get(symbol)?.forEach(callback => callback(dataPoint))
      
      lastPrice = newPrice
      
      // Update base price occasionally to simulate longer-term trends
      if (Math.random() < 0.1) {
        basePrice = newPrice
      }
    }, 2000) // Update every 2 seconds
    
    this.intervals.add(interval)
  }
  
  private startSentimentStream() {
    const sentimentInterval = setInterval(async () => {
      // Generate AI-powered market sentiment analysis
      const sentiment = await this.generateMarketSentiment()
      this.sentimentSubscribers.forEach(callback => callback(sentiment))
    }, 30000) // Update every 30 seconds
    
    this.intervals.add(sentimentInterval)
  }
  
  private async generateMarketSentiment(): Promise<MarketSentiment> {
    try {
      const prompt = (window as any).spark.llmPrompt`
        As a market sentiment analyzer, provide a comprehensive real-time sentiment analysis.
        
        Consider:
        - Current market conditions
        - Recent news and events
        - Technical indicators across major indices
        - Options flow and institutional activity
        - Global economic factors
        
        Return as JSON:
        {
          "score": 0.25,
          "label": "BULLISH",
          "volume_weighted": 0.3,
          "news_sentiment": 0.2,
          "technical_sentiment": 0.15,
          "reasoning": "Brief explanation of current sentiment"
        }
        
        Score should be between -1 (extremely bearish) and 1 (extremely bullish).
        Label should be BEARISH, NEUTRAL, or BULLISH based on score.
      `
      
      const response = await (window as any).spark.llm(prompt, 'gpt-4o', true)
      const data = JSON.parse(response)
      
      return {
        score: data.score || 0,
        label: data.label || 'NEUTRAL',
        volume_weighted: data.volume_weighted || 0,
        news_sentiment: data.news_sentiment || 0,
        technical_sentiment: data.technical_sentiment || 0
      }
    } catch (error) {
      console.error('Failed to generate market sentiment:', error)
      return {
        score: 0,
        label: 'NEUTRAL',
        volume_weighted: 0,
        news_sentiment: 0,
        technical_sentiment: 0
      }
    }
  }
  
  private stopDataStream(symbol: string) {
    // Note: In a real implementation, we'd track intervals per symbol
    // For this demo, we'll clear all intervals when no symbols are subscribed
    if (this.subscribers.size === 0) {
      this.intervals.forEach(interval => clearInterval(interval))
      this.intervals.clear()
    }
  }
  
  private stopSentimentStream() {
    // Clear sentiment-related intervals
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
  }
  
  private getBasePrice(symbol: string): number {
    const basePrices: Record<string, number> = {
      'AAPL': 185.25,
      'MSFT': 342.15,
      'GOOGL': 138.45,
      'AMZN': 127.90,
      'TSLA': 251.20,
      'NVDA': 475.80,
      'META': 312.50,
      'BTCUSD': 43250.00,
      'ETHUSD': 2520.00
    }
    return basePrices[symbol] || 100.00
  }
  
  private getSymbolVolatility(symbol: string): number {
    const volatilities: Record<string, number> = {
      'AAPL': 2.5,
      'MSFT': 3.0,
      'GOOGL': 4.2,
      'AMZN': 4.8,
      'TSLA': 8.5,
      'NVDA': 6.2,
      'META': 5.1,
      'BTCUSD': 500.0,
      'ETHUSD': 50.0
    }
    return volatilities[symbol] || 2.0
  }
  
  private calculateTechnicalIndicators(symbol: string, currentPrice: number) {
    // Mock technical indicators calculation
    // In a real app, this would use historical data
    return {
      rsi: Math.random() * 100,
      macd: (Math.random() - 0.5) * 10,
      ma20: currentPrice * (0.98 + Math.random() * 0.04),
      ma50: currentPrice * (0.95 + Math.random() * 0.10),
      bb_upper: currentPrice * 1.05,
      bb_lower: currentPrice * 0.95,
      volatility: Math.random() * 0.5 + 0.1
    }
  }
  
  // Get current market data for a symbol (one-time fetch)
  async getCurrentData(symbol: string): Promise<MarketDataPoint> {
    const basePrice = this.getBasePrice(symbol)
    const volatility = this.getSymbolVolatility(symbol)
    const change = (Math.random() - 0.5) * volatility
    const currentPrice = basePrice + change
    
    return {
      symbol,
      price: currentPrice,
      change,
      changePercent: (change / basePrice) * 100,
      volume: Math.floor(Math.random() * 1000000) + 500000,
      timestamp: new Date(),
      indicators: this.calculateTechnicalIndicators(symbol, currentPrice)
    }
  }
  
  // Batch fetch multiple symbols
  async getBatchData(symbols: string[]): Promise<MarketDataPoint[]> {
    return Promise.all(symbols.map(symbol => this.getCurrentData(symbol)))
  }
  
  destroy() {
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
    this.subscribers.clear()
    this.sentimentSubscribers.length = 0
  }
}

// Global instance
export const marketDataService = new RealTimeMarketDataService()