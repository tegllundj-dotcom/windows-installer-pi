import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendUp, TrendDown, Activity, CurrencyDollar, ChartBar, Plus, Clock, Target, Robot, TestTube } from "@phosphor-icons/react"
import { Portfolio, Trade, Position, Order } from "@/lib/mockData"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { TradeDialog } from "@/components/TradeDialog"
import { AdvancedTradeDialog } from "@/components/AdvancedTradeDialog"
import { OrdersManagement } from "@/components/OrdersManagement"
import { RiskManagement } from "@/components/RiskManagement"
import { QuickActions } from "@/components/QuickActions"
import { PortfolioChart } from "@/components/PortfolioChart"
import { StrategyManager } from "@/components/StrategyManager"
import { BacktestRunner } from "@/components/BacktestRunner"
import { BacktestResults } from "@/components/BacktestResults"
import { MLPredictions } from "@/components/MLPredictions"
import { MLPerformance } from "@/components/MLPerformance"
import { NeuralNetworkPanel } from "@/components/NeuralNetworkPanel"
import { NeuralNetworkAnalysis } from "@/components/NeuralNetworkAnalysis"
import { PatternVisualization } from "@/components/PatternVisualization"
import { ModelTrainingPanel } from "@/components/ModelTrainingPanel"
import { AISignalCenter } from "@/components/AISignalCenter"
import { AutoTradingConfigPanel } from "@/components/AutoTradingConfigPanel"
import { useState, useEffect, useRef } from "react"
import { MarketPrediction, DetectedPattern } from "@/lib/neuralNetwork"
import { AISignalService } from "@/lib/aiSignalService"
import { AutoTradingConfig, AISignal } from "@/lib/automatedTrading"
import { StrategyConfig, BacktestResult } from "@/lib/tradingStrategy"
import { DEFAULT_STRATEGIES } from "@/lib/strategyManager"
import { useKV } from '@github/spark/hooks'

interface TradingDashboardProps {
  portfolio: Portfolio
  trades: Trade[]
  positions: Position[]
  orders: Order[]
  onUpdatePortfolio: (portfolio: Portfolio) => void
  onUpdateTrades: (trades: Trade[]) => void
  onUpdatePositions: (positions: Position[]) => void
  onUpdateOrders: (orders: Order[]) => void
}

export function TradingDashboard({
  portfolio,
  trades,
  positions,
  orders,
  onUpdatePortfolio,
  onUpdateTrades,
  onUpdatePositions,
  onUpdateOrders
}: TradingDashboardProps) {
  const [predictions, setPredictions] = useState<MarketPrediction[]>([])
  const [patterns, setPatterns] = useState<DetectedPattern[]>([])
  const [autoTradingConfig, setAutoTradingConfig] = useKV<AutoTradingConfig>(
    "auto-trading-config", 
    null as any
  )
  const [recentSignals, setRecentSignals] = useState<AISignal[]>([])
  const [dailyStats, setDailyStats] = useState({ tradesExecuted: 0, dailyPnL: 0 })
  const aiSignalServiceRef = useRef<AISignalService | null>(null)

  // Backtesting state
  const [strategies, setStrategies] = useKV<StrategyConfig[]>("trading-strategies", DEFAULT_STRATEGIES)
  const [backtestResults, setBacktestResults] = useKV<Record<string, BacktestResult>>("backtest-results", {})
  const [isBacktesting, setIsBacktesting] = useState<Record<string, boolean>>({})

  // Initialize AI Signal Service
  useEffect(() => {
    if (!autoTradingConfig) {
      const tempService = new AISignalService({} as any)
      const defaultConfig = tempService.getDefaultConfig()
      setAutoTradingConfig(defaultConfig)
      aiSignalServiceRef.current = tempService
    } else {
      if (!aiSignalServiceRef.current) {
        aiSignalServiceRef.current = new AISignalService(autoTradingConfig)
      } else {
        aiSignalServiceRef.current.updateConfig(autoTradingConfig)
      }
    }
  }, [autoTradingConfig, setAutoTradingConfig])

  // Start/stop signal generation based on config
  useEffect(() => {
    const service = aiSignalServiceRef.current
    if (!service) return

    if (autoTradingConfig?.enabled) {
      service.startSignalGeneration()
      
      // Subscribe to new signals
      const unsubscribe = service.subscribeToSignals((signal) => {
        setRecentSignals(prev => [signal, ...prev.slice(0, 9)]) // Keep last 10
      })

      return () => {
        unsubscribe()
        service.stopSignalGeneration()
      }
    } else {
      service.stopSignalGeneration()
    }
  }, [autoTradingConfig?.enabled])

  // Execute automated trading every 30 seconds when enabled
  useEffect(() => {
    if (!autoTradingConfig?.enabled || !aiSignalServiceRef.current) return

    const interval = setInterval(async () => {
      const service = aiSignalServiceRef.current
      if (!service) return

      await service.executeAutomatedTrading(
        portfolio,
        positions,
        orders,
        trades,
        onUpdateOrders,
        onUpdatePositions,
        onUpdateTrades,
        onUpdatePortfolio
      )

      // Update daily stats
      setDailyStats(service.getDailyStats())
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [autoTradingConfig?.enabled, portfolio, positions, orders, trades, onUpdateOrders, onUpdatePositions, onUpdateTrades, onUpdatePortfolio])

  const totalPositionValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0)
  const pendingOrders = orders.filter(o => o.status === 'PENDING')

  const handleOrderPlace = (newOrder: Order) => {
    onUpdateOrders([...orders, newOrder])
  }

  const handleOrderCancel = (orderId: string) => {
    onUpdateOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: 'CANCELLED' as const } : order
    ))
  }

  const handleBacktestStart = (strategyId: string) => {
    setIsBacktesting(prev => ({ ...prev, [strategyId]: true }))
  }

  const handleBacktestComplete = (strategyId: string, result: BacktestResult) => {
    setIsBacktesting(prev => ({ ...prev, [strategyId]: false }))
    setBacktestResults(prev => ({ ...prev, [strategyId]: result }))
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Auto-Trading Dashboard</h1>
            <p className="text-muted-foreground">Real-time portfolio management and trading</p>
          </div>
          <div className="flex gap-2">
            <TradeDialog 
              positions={positions}
              onTradeComplete={(newTrade) => {
                onUpdateTrades([...trades, newTrade])
              }}
              onOrderPlace={handleOrderPlace}
            />
            <AdvancedTradeDialog
              positions={positions}
              onOrderPlace={handleOrderPlace}
            />
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
              <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{formatCurrency(portfolio.totalValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{formatPercent(portfolio.totalGainLossPercent)} all time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
              {portfolio.dailyPL >= 0 ? 
                <TrendUp className="h-4 w-4 text-green-600" /> :
                <TrendDown className="h-4 w-4 text-red-600" />
              }
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${portfolio.dailyPL >= 0 ? 'profit' : 'loss'}`}>
                {formatCurrency(portfolio.dailyPL)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatPercent(portfolio.dailyPLPercent)} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Cash</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{formatCurrency(portfolio.availableCash)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for trading
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active orders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="positions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="trades">Recent Trades</TabsTrigger>
            <TabsTrigger value="ai-signals">AI Signals</TabsTrigger>
            <TabsTrigger value="auto-trading">
              <Robot className="w-4 h-4 mr-1" />
              Auto Trading
            </TabsTrigger>
            <TabsTrigger value="backtesting">
              <TestTube className="w-4 h-4 mr-1" />
              Backtesting
            </TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="neural-networks">Neural Networks</TabsTrigger>
            <TabsTrigger value="risk">Risk Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="ml-predictions">AI Predictions</TabsTrigger>
            <TabsTrigger value="ml-engine">ML Engine</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-4">
            <QuickActions 
              positions={positions}
              onOrderPlace={handleOrderPlace}
            />
            <Card>
              <CardHeader>
                <CardTitle>Current Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">Market Value</TableHead>
                      <TableHead className="text-right">Gain/Loss</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => (
                      <TableRow key={position.symbol}>
                        <TableCell className="font-medium">{position.symbol}</TableCell>
                        <TableCell className="text-right font-mono">{position.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(position.avgPrice)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(position.currentPrice)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(position.marketValue)}</TableCell>
                        <TableCell className={`text-right font-mono ${position.gainLoss >= 0 ? 'profit' : 'loss'}`}>
                          {formatCurrency(position.gainLoss)}
                        </TableCell>
                        <TableCell className={`text-right font-mono ${position.gainLossPercent >= 0 ? 'profit' : 'loss'}`}>
                          {formatPercent(position.gainLossPercent)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <OrdersManagement 
              orders={orders}
              onCancelOrder={handleOrderCancel}
            />
          </TabsContent>

          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.slice().reverse().map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === 'BUY' ? 'default' : 'secondary'}>
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{trade.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(trade.price)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(trade.quantity * trade.price)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            trade.status === 'COMPLETED' ? 'default' : 
                            trade.status === 'PENDING' ? 'secondary' : 'destructive'
                          }>
                            {trade.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(trade.timestamp).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-signals" className="space-y-4">
            <AISignalCenter 
              onSignalAction={(signal, action) => {
                if (action === 'execute') {
                  // Convert AI signal to order
                  const newOrder: Order = {
                    id: `order_${Date.now()}`,
                    symbol: signal.symbol,
                    type: signal.type as 'BUY' | 'SELL',
                    orderType: 'LIMIT',
                    quantity: Math.floor(10000 / signal.price), // $10k position size
                    price: signal.price,
                    status: 'PENDING',
                    timestamp: new Date().toISOString(),
                    filledQuantity: 0,
                    condition: 'DAY'
                  }
                  onUpdateOrders([...orders, newOrder])
                }
              }}
            />
          </TabsContent>

          <TabsContent value="auto-trading" className="space-y-4">
            {autoTradingConfig && (
              <AutoTradingConfigPanel
                config={autoTradingConfig}
                onConfigChange={setAutoTradingConfig}
                recentSignals={recentSignals}
                dailyStats={dailyStats}
              />
            )}
          </TabsContent>

          <TabsContent value="backtesting" className="space-y-4">
            <Tabs defaultValue="runner" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="runner">
                  <TestTube className="w-4 h-4 mr-1" />
                  Run Backtests
                </TabsTrigger>
                <TabsTrigger value="results">
                  <ChartBar className="w-4 h-4 mr-1" />
                  Results & Analysis
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="runner">
                <BacktestRunner
                  strategies={strategies || []}
                  onBacktestStart={handleBacktestStart}
                  onBacktestComplete={handleBacktestComplete}
                  isBacktesting={isBacktesting}
                />
              </TabsContent>
              
              <TabsContent value="results">
                <BacktestResults
                  results={backtestResults || {}}
                  strategies={strategies || []}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <StrategyManager />
          </TabsContent>

          <TabsContent value="neural-networks" className="space-y-4">
            <Tabs defaultValue="real-time" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="real-time">Real-time Analysis</TabsTrigger>
                <TabsTrigger value="analysis">Market Analysis</TabsTrigger>
                <TabsTrigger value="training">Model Training</TabsTrigger>
              </TabsList>
              
              <TabsContent value="real-time">
                <NeuralNetworkAnalysis symbol="BTCUSD" />
              </TabsContent>
              
              <TabsContent value="analysis">
                <NeuralNetworkPanel 
                  isActive={true}
                  onPredictionsUpdate={setPredictions}
                  onPatternsUpdate={setPatterns}
                />
              </TabsContent>
              
              <TabsContent value="training">
                <ModelTrainingPanel 
                  models={[]}
                  onModelUpdate={() => {}}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <RiskManagement 
              portfolio={portfolio}
              positions={positions}
              orders={orders}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PortfolioChart positions={positions} />
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Return</span>
                    <span className={`font-mono font-medium ${portfolio.totalGainLoss >= 0 ? 'profit' : 'loss'}`}>
                      {formatPercent(portfolio.totalGainLossPercent)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Return</span>
                    <span className={`font-mono font-medium ${portfolio.dailyPL >= 0 ? 'profit' : 'loss'}`}>
                      {formatPercent(portfolio.dailyPLPercent)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Portfolio Value</span>
                    <span className="font-mono font-medium">{formatCurrency(portfolio.totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Balance</span>
                    <span className="font-mono font-medium">{formatCurrency(portfolio.availableCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Invested Amount</span>
                    <span className="font-mono font-medium">{formatCurrency(totalPositionValue)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ml-predictions" className="space-y-4">
            <MLPredictions 
              trades={trades}
              positions={positions}
            />
            {(predictions.length > 0 || patterns.length > 0) && (
              <PatternVisualization 
                patterns={patterns}
                predictions={predictions}
              />
            )}
          </TabsContent>

          <TabsContent value="ml-engine" className="space-y-4">
            <MLPerformance 
              trades={trades}
              positions={positions}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}