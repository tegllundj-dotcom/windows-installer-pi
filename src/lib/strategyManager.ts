import { 
  StrategyConfig, 
  TradingStrategy, 
  MovingAverageCrossover, 
  RSIMeanReversion, 
  BollingerBands 
} from './tradingStrategy'

export const DEFAULT_STRATEGIES: StrategyConfig[] = [
  {
    id: 'ma-crossover',
    name: 'Moving Average Crossover',
    description: 'Buy when fast MA crosses above slow MA, sell when it crosses below',
    parameters: {
      fastPeriod: 10,
      slowPeriod: 30,
    },
    riskManagement: {
      stopLoss: 5, // 5%
      takeProfit: 15, // 15%
      maxPositionSize: 20, // 20% of portfolio
      maxDrawdown: 10, // 10%
    },
    active: true
  },
  {
    id: 'rsi-mean-reversion',
    name: 'RSI Mean Reversion',
    description: 'Buy when RSI is oversold, sell when overbought',
    parameters: {
      rsiPeriod: 14,
      oversoldLevel: 30,
      overboughtLevel: 70,
    },
    riskManagement: {
      stopLoss: 3, // 3%
      takeProfit: 8, // 8%
      maxPositionSize: 15, // 15% of portfolio
      maxDrawdown: 8, // 8%
    },
    active: true
  },
  {
    id: 'bollinger-bands',
    name: 'Bollinger Bands',
    description: 'Buy at lower band, sell at upper band',
    parameters: {
      period: 20,
      stdDev: 2,
    },
    riskManagement: {
      stopLoss: 4, // 4%
      takeProfit: 12, // 12%
      maxPositionSize: 25, // 25% of portfolio
      maxDrawdown: 12, // 12%
    },
    active: false
  },
  {
    id: 'momentum-breakout',
    name: 'Momentum Breakout',
    description: 'Buy on upward breakouts, sell on volume spikes',
    parameters: {
      lookbackPeriod: 20,
      breakoutThreshold: 2.5, // Standard deviations
      volumeMultiplier: 1.5,
    },
    riskManagement: {
      stopLoss: 6, // 6%
      takeProfit: 18, // 18%
      maxPositionSize: 30, // 30% of portfolio
      maxDrawdown: 15, // 15%
    },
    active: false
  },
  {
    id: 'macd-divergence',
    name: 'MACD Divergence',
    description: 'Trade on MACD signal line crossovers and divergences',
    parameters: {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      minDivergenceBars: 10,
    },
    riskManagement: {
      stopLoss: 4.5, // 4.5%
      takeProfit: 14, // 14%
      maxPositionSize: 22, // 22% of portfolio
      maxDrawdown: 11, // 11%
    },
    active: false
  }
]

export function createStrategy(config: StrategyConfig): TradingStrategy {
  switch (config.id) {
    case 'ma-crossover':
      return new MovingAverageCrossover(config)
    case 'rsi-mean-reversion':
      return new RSIMeanReversion(config)
    case 'bollinger-bands':
      return new BollingerBands(config)
    default:
      throw new Error(`Unknown strategy: ${config.id}`)
  }
}

export function validateStrategyConfig(config: StrategyConfig): string[] {
  const errors: string[] = []
  
  // Basic validation
  if (!config.id || config.id.trim() === '') {
    errors.push('Strategy ID is required')
  }
  
  if (!config.name || config.name.trim() === '') {
    errors.push('Strategy name is required')
  }
  
  // Risk management validation
  const rm = config.riskManagement
  if (rm.stopLoss <= 0 || rm.stopLoss > 50) {
    errors.push('Stop loss must be between 0 and 50%')
  }
  
  if (rm.takeProfit <= 0 || rm.takeProfit > 100) {
    errors.push('Take profit must be between 0 and 100%')
  }
  
  if (rm.maxPositionSize <= 0 || rm.maxPositionSize > 100) {
    errors.push('Max position size must be between 0 and 100%')
  }
  
  if (rm.maxDrawdown <= 0 || rm.maxDrawdown > 50) {
    errors.push('Max drawdown must be between 0 and 50%')
  }
  
  // Strategy-specific validation
  switch (config.id) {
    case 'ma-crossover':
      if (typeof config.parameters.fastPeriod !== 'number' || config.parameters.fastPeriod <= 0) {
        errors.push('Fast period must be a positive number')
      }
      if (typeof config.parameters.slowPeriod !== 'number' || config.parameters.slowPeriod <= 0) {
        errors.push('Slow period must be a positive number')
      }
      if (config.parameters.fastPeriod >= config.parameters.slowPeriod) {
        errors.push('Fast period must be less than slow period')
      }
      break
      
    case 'rsi-mean-reversion':
      if (typeof config.parameters.rsiPeriod !== 'number' || config.parameters.rsiPeriod <= 0) {
        errors.push('RSI period must be a positive number')
      }
      if (typeof config.parameters.oversoldLevel !== 'number' || 
          config.parameters.oversoldLevel <= 0 || 
          config.parameters.oversoldLevel >= 50) {
        errors.push('Oversold level must be between 0 and 50')
      }
      if (typeof config.parameters.overboughtLevel !== 'number' || 
          config.parameters.overboughtLevel <= 50 || 
          config.parameters.overboughtLevel >= 100) {
        errors.push('Overbought level must be between 50 and 100')
      }
      break
      
    case 'bollinger-bands':
      if (typeof config.parameters.period !== 'number' || config.parameters.period <= 0) {
        errors.push('Period must be a positive number')
      }
      if (typeof config.parameters.stdDev !== 'number' || 
          config.parameters.stdDev <= 0 || 
          config.parameters.stdDev > 4) {
        errors.push('Standard deviation must be between 0 and 4')
      }
      break
  }
  
  return errors
}

export function getStrategyParameterInfo(strategyId: string): Record<string, {
  type: 'number' | 'string' | 'boolean'
  min?: number
  max?: number
  step?: number
  description: string
  default: any
}> {
  switch (strategyId) {
    case 'ma-crossover':
      return {
        fastPeriod: {
          type: 'number',
          min: 1,
          max: 50,
          step: 1,
          description: 'Fast moving average period (days)',
          default: 10
        },
        slowPeriod: {
          type: 'number',
          min: 10,
          max: 200,
          step: 1,
          description: 'Slow moving average period (days)',
          default: 30
        }
      }
      
    case 'rsi-mean-reversion':
      return {
        rsiPeriod: {
          type: 'number',
          min: 5,
          max: 30,
          step: 1,
          description: 'RSI calculation period (days)',
          default: 14
        },
        oversoldLevel: {
          type: 'number',
          min: 10,
          max: 40,
          step: 1,
          description: 'RSI oversold threshold',
          default: 30
        },
        overboughtLevel: {
          type: 'number',
          min: 60,
          max: 90,
          step: 1,
          description: 'RSI overbought threshold',
          default: 70
        }
      }
      
    case 'bollinger-bands':
      return {
        period: {
          type: 'number',
          min: 10,
          max: 50,
          step: 1,
          description: 'Bollinger Bands period (days)',
          default: 20
        },
        stdDev: {
          type: 'number',
          min: 1,
          max: 3,
          step: 0.1,
          description: 'Standard deviations for bands',
          default: 2
        }
      }
      
    default:
      return {}
  }
}

export function calculateExpectedReturn(
  totalReturn: number, 
  days: number, 
  annualize: boolean = true
): number {
  const dailyReturn = totalReturn / days
  return annualize ? dailyReturn * 252 : dailyReturn // 252 trading days per year
}

export function calculateSharpeRatio(
  returns: number[], 
  riskFreeRate: number = 0.02
): number {
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const excess = avgReturn - (riskFreeRate / 252) // Daily risk-free rate
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length
  const volatility = Math.sqrt(variance)
  
  return volatility > 0 ? (excess / volatility) * Math.sqrt(252) : 0
}

export function calculateMaxDrawdown(equity: number[]): { maxDrawdown: number, maxDrawdownPercent: number } {
  let maxEquity = equity[0]
  let maxDrawdown = 0
  let maxDrawdownPercent = 0
  
  for (const value of equity) {
    if (value > maxEquity) {
      maxEquity = value
    }
    
    const drawdown = maxEquity - value
    const drawdownPercent = (drawdown / maxEquity) * 100
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
      maxDrawdownPercent = drawdownPercent
    }
  }
  
  return { maxDrawdown, maxDrawdownPercent }
}