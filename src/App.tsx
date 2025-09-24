import { Toaster } from "@/components/ui/sonner"
import { useKV } from '@github/spark/hooks'
import { useEffect } from 'react'
import { TradingDashboard } from '@/components/TradingDashboard'
import { generateMockData, type Portfolio, type Trade, type Position } from '@/lib/mockData'

function App() {
  const [portfolioData, setPortfolioData] = useKV<Portfolio | null>("portfolio-data", null)
  const [trades, setTrades] = useKV<Trade[]>("trades-history", [])
  const [positions, setPositions] = useKV<Position[]>("current-positions", [])

  useEffect(() => {
    if (!portfolioData) {
      const mockData = generateMockData()
      setPortfolioData(mockData.portfolio)
      setTrades(mockData.trades)
      setPositions(mockData.positions)
    }
  }, [portfolioData, setPortfolioData, setTrades, setPositions])

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
        onUpdatePortfolio={setPortfolioData}
        onUpdateTrades={setTrades}
        onUpdatePositions={setPositions}
      />
      <Toaster position="top-right" />
    </>
  )
}

export default App