export interface MarketData {
  symbol: string
  timestamp: Date
  price: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  changePercent: number
  bid: number
  ask: number
  spread: number
}

export interface OrderBookLevel {
  price: number
  quantity: number
}

export interface OrderBook {
  symbol: string
  timestamp: Date
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  spread: number
}

export interface MarketTick {
  symbol: string
  timestamp: Date
  price: number
  volume: number
  side: 'buy' | 'sell'
}

export interface TechnicalIndicators {
  symbol: string
  timestamp: Date
  rsi: number
  macd: { macd: number; signal: number; histogram: number }
  sma: { period5: number; period20: number; period50: number }
  ema: { period12: number; period26: number }
  bollinger: { upper: number; middle: number; lower: number }
  stochastic: { k: number; d: number }
  atr: number
  adx: number
  momentum: number
  williams: number
}

export interface MarketDataSubscription {
  id: string
  symbol: string
  type: 'price' | 'orderbook' | 'trades' | 'indicators'
  callback: (data: any) => void
  active: boolean
}

class MarketDataService {
  private subscriptions: Map<string, MarketDataSubscription> = new Map()
  private dataStreams: Map<string, any> = new Map()
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 10
  private reconnectDelay: number = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null

  // Simulated market data for demonstration
  private symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD']
  private priceData: Map<string, MarketData> = new Map()
  private priceHistory: Map<string, number[]> = new Map()

  constructor() {
    this.initializeMockData()
  }

  private initializeMockData() {
    // Initialize with realistic crypto prices
    const basePrices = {
      'BTCUSD': 43250,
      'ETHUSD': 2580,
      'ADAUSD': 0.485,
      'SOLUSD': 98.50,
      'DOTUSD': 7.25
    }

    this.symbols.forEach(symbol => {
      const basePrice = basePrices[symbol as keyof typeof basePrices] || 100
      const marketData: MarketData = {
        symbol,
        timestamp: new Date(),
        price: basePrice,
        open: basePrice * (0.98 + Math.random() * 0.04),
        high: basePrice * (1.01 + Math.random() * 0.03),
        low: basePrice * (0.97 + Math.random() * 0.02),
        close: basePrice,
        volume: Math.random() * 1000000,
        change: 0,
        changePercent: 0,
        bid: basePrice * 0.9995,
        ask: basePrice * 1.0005,
        spread: basePrice * 0.001
      }
      
      this.priceData.set(symbol, marketData)
      this.priceHistory.set(symbol, Array.from({ length: 100 }, () => basePrice * (0.95 + Math.random() * 0.1)))
    })
  }

  async connect(): Promise<boolean> {
    try {
      // Simulate WebSocket connection
      await new Promise(resolve => setTimeout(resolve, 500))
      
      this.isConnected = true
      this.reconnectAttempts = 0
      
      // Start price simulation
      this.startPriceSimulation()
      this.startHeartbeat()
      
      console.log('Market data service connected')
      return true
    } catch (error) {
      console.error('Failed to connect to market data service:', error)
      this.handleReconnection()
      return false
    }
  }

  disconnect() {
    this.isConnected = false
    this.subscriptions.clear()
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    console.log('Market data service disconnected')
  }

  subscribe(
    symbol: string,
    type: 'price' | 'orderbook' | 'trades' | 'indicators',
    callback: (data: any) => void
  ): string {
    const id = crypto.randomUUID()
    const subscription: MarketDataSubscription = {
      id,
      symbol,
      type,
      callback,
      active: true
    }
    
    this.subscriptions.set(id, subscription)
    
    // Send initial data if available
    switch (type) {
      case 'price':
        const priceData = this.priceData.get(symbol)
        if (priceData) {
          callback(priceData)
        }
        break
      case 'indicators':
        const indicators = this.calculateTechnicalIndicators(symbol)
        if (indicators) {
          callback(indicators)
        }
        break
      case 'orderbook':
        const orderbook = this.generateOrderBook(symbol)
        callback(orderbook)
        break
      case 'trades':
        // Will be sent as new trades occur
        break
    }
    
    return id
  }

  unsubscribe(subscriptionId: string) {
    this.subscriptions.delete(subscriptionId)
  }

  getLatestPrice(symbol: string): MarketData | undefined {
    return this.priceData.get(symbol)
  }

  getPriceHistory(symbol: string, periods: number = 100): number[] {
    const history = this.priceHistory.get(symbol) || []
    return history.slice(-periods)
  }

  private startPriceSimulation() {
    if (!this.isConnected) return

    setInterval(() => {
      this.symbols.forEach(symbol => {
        this.updatePrice(symbol)
      })
    }, 1000) // Update every second

    setInterval(() => {
      this.symbols.forEach(symbol => {
        this.generateTrade(symbol)
      })
    }, 500) // Generate trades every 500ms
  }

  private updatePrice(symbol: string) {
    const current = this.priceData.get(symbol)
    if (!current) return

    // Simulate realistic price movement with volatility clustering
    const volatility = 0.002 + Math.random() * 0.003 // 0.2-0.5% volatility
    const trend = (Math.random() - 0.5) * 2 // Random walk
    const momentum = Math.sin(Date.now() / 60000) * 0.001 // Slight trend component
    
    const priceChange = current.price * (trend * volatility + momentum)
    const newPrice = Math.max(current.price + priceChange, 0.001)
    
    // Update OHLC data
    const updatedData: MarketData = {
      ...current,
      timestamp: new Date(),
      price: newPrice,
      close: newPrice,
      high: Math.max(current.high, newPrice),
      low: Math.min(current.low, newPrice),
      change: newPrice - current.open,
      changePercent: ((newPrice - current.open) / current.open) * 100,
      bid: newPrice * (0.9995 + Math.random() * 0.0002),
      ask: newPrice * (1.0005 + Math.random() * 0.0002),
      volume: current.volume + Math.random() * 1000
    }

    updatedData.spread = updatedData.ask - updatedData.bid

    this.priceData.set(symbol, updatedData)
    
    // Update price history
    const history = this.priceHistory.get(symbol) || []
    history.push(newPrice)
    if (history.length > 500) history.shift() // Keep last 500 prices
    this.priceHistory.set(symbol, history)

    // Notify price subscribers
    this.subscriptions.forEach(sub => {
      if (sub.symbol === symbol && sub.type === 'price' && sub.active) {
        sub.callback(updatedData)
      }
    })

    // Update technical indicators every 10 price updates
    if (history.length % 10 === 0) {
      const indicators = this.calculateTechnicalIndicators(symbol)
      this.subscriptions.forEach(sub => {
        if (sub.symbol === symbol && sub.type === 'indicators' && sub.active) {
          sub.callback(indicators)
        }
      })
    }
  }

  private generateTrade(symbol: string) {
    const marketData = this.priceData.get(symbol)
    if (!marketData) return

    const trade: MarketTick = {
      symbol,
      timestamp: new Date(),
      price: marketData.price * (0.9999 + Math.random() * 0.0002),
      volume: Math.random() * 100,
      side: Math.random() > 0.5 ? 'buy' : 'sell'
    }

    // Notify trade subscribers
    this.subscriptions.forEach(sub => {
      if (sub.symbol === symbol && sub.type === 'trades' && sub.active) {
        sub.callback(trade)
      }
    })
  }

  private generateOrderBook(symbol: string): OrderBook {
    const marketData = this.priceData.get(symbol)
    if (!marketData) {
      throw new Error(`No market data for symbol: ${symbol}`)
    }

    const midPrice = (marketData.bid + marketData.ask) / 2
    const spread = marketData.spread
    
    const bids: OrderBookLevel[] = []
    const asks: OrderBookLevel[] = []

    // Generate 10 levels on each side
    for (let i = 0; i < 10; i++) {
      const bidPrice = midPrice - (spread / 2) - (i * spread * 0.1)
      const askPrice = midPrice + (spread / 2) + (i * spread * 0.1)
      
      bids.push({
        price: bidPrice,
        quantity: Math.random() * 100 + 10
      })
      
      asks.push({
        price: askPrice,
        quantity: Math.random() * 100 + 10
      })
    }

    const orderbook: OrderBook = {
      symbol,
      timestamp: new Date(),
      bids: bids.sort((a, b) => b.price - a.price), // Highest bid first
      asks: asks.sort((a, b) => a.price - b.price), // Lowest ask first
      spread
    }

    return orderbook
  }

  private calculateTechnicalIndicators(symbol: string): TechnicalIndicators | null {
    const history = this.priceHistory.get(symbol)
    if (!history || history.length < 50) return null

    const prices = history.slice(-50) // Use last 50 prices
    const marketData = this.priceData.get(symbol)
    if (!marketData) return null

    // RSI calculation (simplified)
    const rsi = this.calculateRSI(prices, 14)
    
    // Moving averages
    const sma5 = prices.slice(-5).reduce((a, b) => a + b) / 5
    const sma20 = prices.slice(-20).reduce((a, b) => a + b) / 20
    const sma50 = prices.reduce((a, b) => a + b) / prices.length
    
    // EMA calculation (simplified)
    const ema12 = this.calculateEMA(prices.slice(-12), 12)
    const ema26 = this.calculateEMA(prices.slice(-26), 26)
    
    // MACD
    const macdLine = ema12 - ema26
    const signalLine = macdLine * 0.9 // Simplified
    const histogram = macdLine - signalLine

    // Bollinger Bands
    const sma20Value = sma20
    const stdDev = Math.sqrt(prices.slice(-20).reduce((acc, price) => 
      acc + Math.pow(price - sma20Value, 2), 0) / 20)
    
    const indicators: TechnicalIndicators = {
      symbol,
      timestamp: new Date(),
      rsi,
      macd: {
        macd: macdLine,
        signal: signalLine,
        histogram
      },
      sma: {
        period5: sma5,
        period20: sma20,
        period50: sma50
      },
      ema: {
        period12: ema12,
        period26: ema26
      },
      bollinger: {
        upper: sma20Value + (stdDev * 2),
        middle: sma20Value,
        lower: sma20Value - (stdDev * 2)
      },
      stochastic: {
        k: Math.random() * 100, // Simplified
        d: Math.random() * 100
      },
      atr: stdDev * 2, // Simplified ATR
      adx: 20 + Math.random() * 60, // Random ADX for demo
      momentum: (prices[prices.length - 1] - prices[prices.length - 10]) / prices[prices.length - 10] * 100,
      williams: -Math.random() * 100 // Williams %R
    }

    return indicators
  }

  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50

    let gains = 0
    let losses = 0

    // Calculate initial average gains and losses
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) {
        gains += change
      } else {
        losses -= change
      }
    }

    let avgGain = gains / period
    let avgLoss = losses / period

    // Calculate RSI for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      const gain = change > 0 ? change : 0
      const loss = change < 0 ? -change : 0

      avgGain = (avgGain * (period - 1) + gain) / period
      avgLoss = (avgLoss * (period - 1) + loss) / period
    }

    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0
    if (prices.length === 1) return prices[0]

    const multiplier = 2 / (period + 1)
    let ema = prices[0]

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
    }

    return ema
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.isConnected) {
        this.handleReconnection()
      }
    }, 30000) // Check every 30 seconds
  }

  private async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(async () => {
      const connected = await this.connect()
      if (!connected) {
        this.reconnectDelay *= 2 // Exponential backoff
      }
    }, this.reconnectDelay)
  }

  // Neural network data preparation methods
  prepareFeatureData(symbol: string, periods: number = 60): number[][] {
    const history = this.priceHistory.get(symbol) || []
    const indicators = this.calculateTechnicalIndicators(symbol)
    
    if (history.length < periods || !indicators) {
      return []
    }

    const features: number[][] = []
    const prices = history.slice(-periods)
    
    // Prepare OHLCV + indicators as feature vectors
    for (let i = 0; i < prices.length; i++) {
      const price = prices[i]
      const prevPrice = i > 0 ? prices[i - 1] : price
      
      const feature = [
        price, // Close price
        prevPrice, // Previous close
        (price - prevPrice) / prevPrice, // Price change %
        indicators.rsi / 100, // Normalized RSI
        indicators.macd.macd,
        indicators.sma.period20,
        indicators.bollinger.upper - indicators.bollinger.lower, // Bollinger width
        Math.random() * 10000 // Simulated volume
      ]
      
      features.push(feature)
    }

    return features
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size
  }

  getActiveSubscriptions(): MarketDataSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active)
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService()
export default marketDataService