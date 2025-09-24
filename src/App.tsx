import { Toaster } from "@/components/ui/sonner"
import { useKV } from '@github/spark/hooks'
import { useEffect } from 'react'
import { TradingDashboard } from '@/components/TradingDashboard'
import { generateMockData, generateMockOrders, type Portfolio, type Trade, type Position, type Order } from '@/lib/mockData'

function App() {
  const [portfolioData, setPortfolioData] = useKV<Portfolio | null>("portfolio-data", null)
  const [trades, setTrades] = useKV<Trade[]>("trades-history", [])
  const [positions, setPositions] = useKV<Position[]>("current-positions", [])
  const [orders, setOrders] = useKV<Order[]>("active-orders", [])

  useEffect(() => {
    if (!portfolioData) {
      const mockData = generateMockData()
      const mockOrders = generateMockOrders()
      setPortfolioData(mockData.portfolio)
      setTrades(mockData.trades)
      setPositions(mockData.positions)
      setOrders(mockOrders)
    }
  }, [portfolioData, setPortfolioData, setTrades, setPositions, setOrders])

  if (!portfolioData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <TradingDashboard 
        portfolio={portfolioData}
        trades={trades || []}
        positions={positions || []}
        orders={orders || []}
        onUpdatePortfolio={setPortfolioData}
        onUpdateTrades={setTrades}
        onUpdatePositions={setPositions}
        onUpdateOrders={setOrders}
      />
      <Toaster position="top-right" />
    </>
  )
}

export default App