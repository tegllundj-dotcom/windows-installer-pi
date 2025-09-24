import { 
  TradingStrategy, 
  MarketData, 
  Signal, 
  BacktestResult, 
  BacktestTrade, 
  EquityPoint 
} from './tradingStrategy'

export interface BacktestConfig {
  initialCapital: number
  startDate: string
  endDate: string
  commission: number // per trade
  slippage: number // percentage
}

export class BacktestEngine {
  private config: BacktestConfig
  private strategy: TradingStrategy
  private data: MarketData[]
  
  constructor(strategy: TradingStrategy, config: BacktestConfig) {
    this.strategy = strategy
    this.config = config
    this.data = []
  }

  setData(data: MarketData[]): void {
    // Filter data by date range
    const startDate = new Date(this.config.startDate)
    const endDate = new Date(this.config.endDate)
    
    this.data = data.filter(d => {
      const date = new Date(d.timestamp)
      return date >= startDate && date <= endDate
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  run(): BacktestResult {
    if (this.data.length === 0) {
      throw new Error('No data available for backtesting')
    }

    let capital = this.config.initialCapital
    let position = 0 // number of shares
    let positionValue = 0
    let entryPrice = 0
    let entryDate = ''
    
    const trades: BacktestTrade[] = []
    const equity: EquityPoint[] = []
    let maxEquity = capital
    let maxDrawdown = 0
    
    // Track trade statistics
    let winningTrades = 0
    let losingTrades = 0
    let totalProfit = 0
    let totalLoss = 0
    let largestWin = 0
    let largestLoss = 0

    for (let i = 1; i < this.data.length; i++) {
      const currentData = this.data[i]
      const signal = this.strategy.generateSignal(this.data, i)
      
      // Calculate current portfolio value
      const currentEquity = capital + (position * currentData.close)
      
      // Update max equity and drawdown
      if (currentEquity > maxEquity) {
        maxEquity = currentEquity
      }
      
      const drawdown = (maxEquity - currentEquity) / maxEquity * 100
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }

      equity.push({
        date: currentData.timestamp,
        equity: currentEquity,
        drawdown
      })

      // Process signals
      if (signal.type === 'BUY' && position === 0 && signal.strength > 0.5) {
        // Enter long position
        const maxPositionSize = this.strategy.getConfig().riskManagement.maxPositionSize / 100
        const availableCapital = capital * maxPositionSize
        const price = currentData.close * (1 + this.config.slippage / 100) // Apply slippage
        const shares = Math.floor((availableCapital - this.config.commission) / price)
        
        if (shares > 0) {
          position = shares
          positionValue = shares * price
          capital -= (positionValue + this.config.commission)
          entryPrice = price
          entryDate = currentData.timestamp
        }
        
      } else if (signal.type === 'SELL' && position > 0 && signal.strength > 0.5) {
        // Exit long position
        this.exitPosition('SIGNAL', currentData, position, entryPrice, entryDate, capital, trades)
        capital += this.calculateExitValue(position, currentData.close)
        position = 0
        positionValue = 0
      }

      // Risk management - Stop Loss
      if (position > 0) {
        const currentPrice = currentData.close
        const stopLossPrice = entryPrice * (1 - this.strategy.getConfig().riskManagement.stopLoss / 100)
        const takeProfitPrice = entryPrice * (1 + this.strategy.getConfig().riskManagement.takeProfit / 100)
        
        if (currentPrice <= stopLossPrice) {
          this.exitPosition('STOP_LOSS', currentData, position, entryPrice, entryDate, capital, trades)
          capital += this.calculateExitValue(position, currentPrice)
          position = 0
          positionValue = 0
        } else if (currentPrice >= takeProfitPrice) {
          this.exitPosition('TAKE_PROFIT', currentData, position, entryPrice, entryDate, capital, trades)
          capital += this.calculateExitValue(position, currentPrice)
          position = 0
          positionValue = 0
        }
      }
    }

    // Close any remaining positions
    if (position > 0 && this.data.length > 0) {
      const lastData = this.data[this.data.length - 1]
      this.exitPosition('END_OF_TEST', lastData, position, entryPrice, entryDate, capital, trades)
      capital += this.calculateExitValue(position, lastData.close)
    }

    // Calculate statistics
    trades.forEach(trade => {
      if (trade.pnl > 0) {
        winningTrades++
        totalProfit += trade.pnl
        largestWin = Math.max(largestWin, trade.pnl)
      } else {
        losingTrades++
        totalLoss += Math.abs(trade.pnl)
        largestLoss = Math.max(largestLoss, Math.abs(trade.pnl))
      }
    })

    const totalReturn = capital - this.config.initialCapital
    const totalReturnPercent = (totalReturn / this.config.initialCapital) * 100
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0
    const avgWin = winningTrades > 0 ? totalProfit / winningTrades : 0
    const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0
    
    // Calculate Sharpe Ratio (simplified)
    const returns = equity.map((e, i) => i > 0 ? (e.equity - equity[i-1].equity) / equity[i-1].equity : 0).slice(1)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const returnStdDev = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length)
    const sharpeRatio = returnStdDev > 0 ? (avgReturn / returnStdDev) * Math.sqrt(252) : 0 // Annualized

    return {
      strategyId: this.strategy.getConfig().id,
      startDate: this.config.startDate,
      endDate: this.config.endDate,
      initialCapital: this.config.initialCapital,
      finalCapital: capital,
      totalReturn,
      totalReturnPercent,
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      winRate,
      profitFactor,
      maxDrawdown,
      maxDrawdownPercent: maxDrawdown,
      sharpeRatio,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      trades,
      equity
    }
  }

  private exitPosition(
    reason: string, 
    currentData: MarketData, 
    position: number, 
    entryPrice: number, 
    entryDate: string, 
    capital: number, 
    trades: BacktestTrade[]
  ): void {
    const exitPrice = currentData.close * (1 - this.config.slippage / 100) // Apply slippage
    const pnl = (exitPrice - entryPrice) * position - (this.config.commission * 2) // Entry + Exit commission
    const pnlPercent = (pnl / (entryPrice * position)) * 100
    const duration = (new Date(currentData.timestamp).getTime() - new Date(entryDate).getTime()) / (1000 * 60 * 60 * 24)

    trades.push({
      entryDate,
      exitDate: currentData.timestamp,
      symbol: currentData.symbol,
      type: 'LONG',
      entryPrice,
      exitPrice,
      quantity: position,
      pnl,
      pnlPercent,
      duration,
      reason
    })
  }

  private calculateExitValue(position: number, price: number): number {
    return (position * price * (1 - this.config.slippage / 100)) - this.config.commission
  }
}

// Generate sample market data for backtesting
export function generateSampleMarketData(
  symbol: string, 
  startDate: string, 
  endDate: string, 
  initialPrice: number = 100
): MarketData[] {
  const data: MarketData[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  let currentPrice = initialPrice
  let currentDate = new Date(start)
  
  while (currentDate <= end) {
    // Skip weekends
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      // Generate random price movement (simple random walk)
      const change = (Math.random() - 0.5) * 0.04 // ±2% daily change
      const trend = Math.sin(currentDate.getTime() / (1000 * 60 * 60 * 24 * 30)) * 0.001 // Monthly trend
      
      currentPrice *= (1 + change + trend)
      
      const open = currentPrice * (1 + (Math.random() - 0.5) * 0.01)
      const high = Math.max(open, currentPrice) * (1 + Math.random() * 0.02)
      const low = Math.min(open, currentPrice) * (1 - Math.random() * 0.02)
      const close = currentPrice
      const volume = Math.floor(Math.random() * 1000000 + 100000)
      
      data.push({
        symbol,
        timestamp: currentDate.toISOString(),
        open,
        high,
        low,
        close,
        volume
      })
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return data
}