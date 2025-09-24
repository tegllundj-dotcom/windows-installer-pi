export interface Portfolio {
  totalValue: number
  dailyPL: number
  dailyPLPercent: number
  availableCash: number
  totalGainLoss: number
  totalGainLossPercent: number
}

export interface Trade {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  quantity: number
  price: number
  timestamp: string
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED'
}

export interface Position {
  symbol: string
  quantity: number
  avgPrice: number
  currentPrice: number
  marketValue: number
  gainLoss: number
  gainLossPercent: number
  lastUpdate: string
}

export function generateMockData() {
  const portfolio: Portfolio = {
    totalValue: 125750.85,
    dailyPL: 2340.12,
    dailyPLPercent: 1.89,
    availableCash: 15420.30,
    totalGainLoss: 8750.85,
    totalGainLossPercent: 7.48
  }

  const trades: Trade[] = [
    {
      id: '1',
      symbol: 'AAPL',
      type: 'BUY',
      quantity: 50,
      price: 185.25,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'COMPLETED'
    },
    {
      id: '2', 
      symbol: 'MSFT',
      type: 'SELL',
      quantity: 25,
      price: 342.15,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: 'COMPLETED'
    },
    {
      id: '3',
      symbol: 'GOOGL',
      type: 'BUY',
      quantity: 15,
      price: 138.45,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING'
    }
  ]

  const positions: Position[] = [
    {
      symbol: 'AAPL',
      quantity: 150,
      avgPrice: 178.30,
      currentPrice: 185.25,
      marketValue: 27787.50,
      gainLoss: 1042.50,
      gainLossPercent: 3.90,
      lastUpdate: new Date().toISOString()
    },
    {
      symbol: 'MSFT',
      quantity: 75,
      avgPrice: 335.20,
      currentPrice: 342.15,
      marketValue: 25661.25,
      gainLoss: 521.25,
      gainLossPercent: 2.07,
      lastUpdate: new Date().toISOString()
    },
    {
      symbol: 'GOOGL',
      quantity: 100,
      avgPrice: 142.80,
      currentPrice: 138.45,
      marketValue: 13845.00,
      gainLoss: -435.00,
      gainLossPercent: -3.05,
      lastUpdate: new Date().toISOString()
    },
    {
      symbol: 'TSLA',
      quantity: 80,
      avgPrice: 245.60,
      currentPrice: 251.20,
      marketValue: 20096.00,
      gainLoss: 448.00,
      gainLossPercent: 2.28,
      lastUpdate: new Date().toISOString()
    }
  ]

  return { portfolio, trades, positions }
}