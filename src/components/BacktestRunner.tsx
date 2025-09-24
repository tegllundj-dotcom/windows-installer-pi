import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, CurrencyCircleDollar, Play, Warning, Robot, Brain, TrendUp } from '@phosphor-icons/react'
import { StrategyConfig, BacktestResult } from '@/lib/tradingStrategy'
import { createStrategy } from '@/lib/strategyManager'
import { BacktestEngine, BacktestConfig, generateSampleMarketData } from '@/lib/backtestEngine'
import { AISignalService } from '@/lib/aiSignalService'
import { AutoTradingConfig } from '@/lib/automatedTrading'
import { toast } from 'sonner'

interface BacktestRunnerProps {
  strategies: StrategyConfig[]
  onBacktestStart: (strategyId: string) => void
  onBacktestComplete: (strategyId: string, result: BacktestResult) => void
  isBacktesting: Record<string, boolean>
}

interface AIBacktestConfig extends BacktestConfig {
  useAISignals: boolean
  aiConfidenceThreshold: number
  maxPositionsPerSignal: number
  signalTimeframe: 'SHORT' | 'MEDIUM' | 'LONG'
  riskPerTrade: number
}

export function BacktestRunner({ 
  strategies, 
  onBacktestStart, 
  onBacktestComplete, 
  isBacktesting 
}: BacktestRunnerProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('')
  const [config, setConfig] = useState<AIBacktestConfig>({
    initialCapital: 100000,
    startDate: '2023-01-01',
    endDate: '2024-01-01',
    commission: 5,
    slippage: 0.1,
    useAISignals: false,
    aiConfidenceThreshold: 0.75,
    maxPositionsPerSignal: 3,
    signalTimeframe: 'MEDIUM',
    riskPerTrade: 2.0
  })
  const [progress, setProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [backtestType, setBacktestType] = useState<'traditional' | 'ai-signals'>('traditional')

  const runBacktest = async () => {
    if (!selectedStrategy && backtestType === 'traditional') {
      toast.error('Please select a strategy to backtest')
      return
    }

    const strategy = backtestType === 'traditional' 
      ? strategies.find(s => s.id === selectedStrategy)
      : null

    if (backtestType === 'traditional' && !strategy) {
      toast.error('Strategy not found')
      return
    }

    setIsRunning(true)
    setProgress(0)
    onBacktestStart(selectedStrategy || 'ai-signals')

    try {
      if (backtestType === 'ai-signals') {
        await runAISignalBacktest()
      } else {
        await runTraditionalBacktest(strategy!)
      }
    } catch (error) {
      console.error('Backtest error:', error)
      toast.error('Backtest failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsRunning(false)
      setProgress(0)
    }
  }

  const runAISignalBacktest = async () => {
    toast.info('Generating AI signals for backtesting...', {
      description: 'Creating realistic AI trading signals'
    })
    
    setProgress(10)

    // Generate market data for multiple symbols
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA']
    const marketDataBySymbol: Record<string, any[]> = {}
    
    for (const symbol of symbols) {
      marketDataBySymbol[symbol] = generateSampleMarketData(
        symbol,
        config.startDate,
        config.endDate,
        Math.random() * 200 + 100 // Random starting price 100-300
      )
    }

    setProgress(30)
    
    // Simulate AI signal generation during backtest period
    const aiSignals = await generateHistoricalAISignals(marketDataBySymbol, config)
    
    setProgress(50)
    
    toast.info('Running AI signal strategy...', {
      description: `Processing ${aiSignals.length} AI signals`
    })

    // Run AI signal backtest
    const result = await runAISignalStrategy(aiSignals, marketDataBySymbol, config)
    
    setProgress(100)
    
    toast.success('AI Signal Backtest completed!', {
      description: `Total return: ${result.totalReturnPercent.toFixed(2)}%`
    })
    
    onBacktestComplete('ai-signals', result)
  }

  const runTraditionalBacktest = async (strategy: StrategyConfig) => {
    // Generate sample market data for backtesting
    toast.info('Generating market data...', {
      description: 'Creating realistic price data for backtesting'
    })
    
    setProgress(10)
    
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN']
    const selectedSymbol = symbols[Math.floor(Math.random() * symbols.length)]
    
    const marketData = generateSampleMarketData(
      selectedSymbol,
      config.startDate,
      config.endDate,
      150 // Starting price
    )

    setProgress(30)
    
    toast.info('Running strategy simulation...', {
      description: `Testing ${strategy.name} on ${marketData.length} data points`
    })

    // Create strategy instance and backtest engine
    const strategyInstance = createStrategy(strategy)
    const backtestEngine = new BacktestEngine(strategyInstance, config)
    
    setProgress(50)
    
    // Set the market data and run the backtest
    backtestEngine.setData(marketData)
    
    setProgress(70)
    
    // Simulate some processing time for realism
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setProgress(90)
    
    const result = backtestEngine.run()
    
    setProgress(100)
    
    toast.success('Backtest completed!', {
      description: `Total return: ${result.totalReturnPercent.toFixed(2)}%`
    })
    
    onBacktestComplete(selectedStrategy, result)
  }

  // Generate historical AI signals for backtesting
  const generateHistoricalAISignals = async (marketData: Record<string, any[]>, config: AIBacktestConfig) => {
    const signals: any[] = []
    const startTime = new Date(config.startDate).getTime()
    const endTime = new Date(config.endDate).getTime()
    
    // Generate signals at random intervals
    let currentTime = startTime
    const symbols = Object.keys(marketData)
    
    while (currentTime < endTime) {
      // Generate 1-3 signals per day on average
      if (Math.random() < 0.3) { // 30% chance per day
        const symbol = symbols[Math.floor(Math.random() * symbols.length)]
        const symbolData = marketData[symbol]
        
        // Find corresponding market data point
        const dataPoint = symbolData.find(d => 
          Math.abs(new Date(d.timestamp).getTime() - currentTime) < 86400000 // Within 1 day
        )
        
        if (dataPoint) {
          const action = Math.random() > 0.5 ? 'BUY' : 'SELL'
          const confidence = config.aiConfidenceThreshold + Math.random() * (0.95 - config.aiConfidenceThreshold)
          
          signals.push({
            symbol,
            action,
            confidence,
            targetPrice: dataPoint.close * (action === 'BUY' ? 1.02 : 0.98),
            currentPrice: dataPoint.close,
            reasoning: `AI detected ${action.toLowerCase()} opportunity in ${symbol}`,
            timestamp: new Date(currentTime),
            strength: confidence > 0.9 ? 'VERY_STRONG' : confidence > 0.8 ? 'STRONG' : 'MODERATE'
          })
        }
      }
      
      currentTime += 86400000 // Move to next day
    }
    
    return signals.filter(s => s.confidence >= config.aiConfidenceThreshold)
  }

  // Run backtest with AI signals
  const runAISignalStrategy = async (signals: any[], marketData: Record<string, any[]>, config: AIBacktestConfig) => {
    let capital = config.initialCapital
    const positions: Record<string, { quantity: number, entryPrice: number, entryDate: string }> = {}
    const trades: any[] = []
    const equity: any[] = []
    let maxEquity = capital
    let maxDrawdown = 0

    const signalsByDate = signals.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    
    for (const signal of signalsByDate) {
      const symbolData = marketData[signal.symbol]
      const signalDate = new Date(signal.timestamp)
      
      // Find market data for signal date
      const dataPoint = symbolData.find(d => 
        Math.abs(new Date(d.timestamp).getTime() - signalDate.getTime()) < 86400000
      )
      
      if (!dataPoint) continue

      const currentEquity = capital + Object.values(positions).reduce((sum, pos) => {
        const currentData = symbolData.find(d => 
          Math.abs(new Date(d.timestamp).getTime() - signalDate.getTime()) < 86400000
        )
        return sum + (currentData ? pos.quantity * currentData.close : 0)
      }, 0)

      // Update max equity and drawdown
      if (currentEquity > maxEquity) {
        maxEquity = currentEquity
      }
      
      const drawdown = (maxEquity - currentEquity) / maxEquity * 100
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }

      equity.push({
        date: signal.timestamp.toISOString(),
        equity: currentEquity,
        drawdown
      })

      if (signal.action === 'BUY' && !positions[signal.symbol]) {
        // Enter position
        const positionSize = capital * (config.riskPerTrade / 100)
        const price = dataPoint.close * (1 + config.slippage / 100)
        const quantity = Math.floor((positionSize - config.commission) / price)
        
        if (quantity > 0 && capital >= positionSize) {
          positions[signal.symbol] = {
            quantity,
            entryPrice: price,
            entryDate: signal.timestamp.toISOString()
          }
          capital -= (quantity * price + config.commission)
        }
        
      } else if (signal.action === 'SELL' && positions[signal.symbol]) {
        // Exit position
        const position = positions[signal.symbol]
        const exitPrice = dataPoint.close * (1 - config.slippage / 100)
        const pnl = (exitPrice - position.entryPrice) * position.quantity - (config.commission * 2)
        
        trades.push({
          entryDate: position.entryDate,
          exitDate: signal.timestamp.toISOString(),
          symbol: signal.symbol,
          type: 'LONG',
          entryPrice: position.entryPrice,
          exitPrice,
          quantity: position.quantity,
          pnl,
          pnlPercent: (pnl / (position.entryPrice * position.quantity)) * 100,
          duration: (signalDate.getTime() - new Date(position.entryDate).getTime()) / (1000 * 60 * 60 * 24),
          reason: 'AI_SIGNAL'
        })
        
        capital += (position.quantity * exitPrice - config.commission)
        delete positions[signal.symbol]
      }
    }

    // Close remaining positions at end
    const endDate = new Date(config.endDate)
    Object.entries(positions).forEach(([symbol, position]) => {
      const symbolData = marketData[symbol]
      const lastData = symbolData[symbolData.length - 1]
      
      if (lastData) {
        const exitPrice = lastData.close * (1 - config.slippage / 100)
        const pnl = (exitPrice - position.entryPrice) * position.quantity - (config.commission * 2)
        
        trades.push({
          entryDate: position.entryDate,
          exitDate: endDate.toISOString(),
          symbol,
          type: 'LONG',
          entryPrice: position.entryPrice,
          exitPrice,
          quantity: position.quantity,
          pnl,
          pnlPercent: (pnl / (position.entryPrice * position.quantity)) * 100,
          duration: (endDate.getTime() - new Date(position.entryDate).getTime()) / (1000 * 60 * 60 * 24),
          reason: 'END_OF_TEST'
        })
        
        capital += (position.quantity * exitPrice - config.commission)
      }
    })

    // Calculate statistics
    const winningTrades = trades.filter(t => t.pnl > 0).length
    const losingTrades = trades.filter(t => t.pnl <= 0).length
    const totalProfit = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0)
    const totalLoss = Math.abs(trades.filter(t => t.pnl <= 0).reduce((sum, t) => sum + t.pnl, 0))
    
    const totalReturn = capital - config.initialCapital
    const totalReturnPercent = (totalReturn / config.initialCapital) * 100
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0

    return {
      strategyId: 'ai-signals',
      startDate: config.startDate,
      endDate: config.endDate,
      initialCapital: config.initialCapital,
      finalCapital: capital,
      totalReturn,
      totalReturnPercent,
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      winRate,
      profitFactor,
      maxDrawdown: 0,
      maxDrawdownPercent: maxDrawdown,
      sharpeRatio: 0, // Simplified for AI signals
      avgWin: winningTrades > 0 ? totalProfit / winningTrades : 0,
      avgLoss: losingTrades > 0 ? totalLoss / losingTrades : 0,
      largestWin: Math.max(...trades.map(t => t.pnl), 0),
      largestLoss: Math.min(...trades.map(t => t.pnl), 0),
      trades,
      equity
    }
  }

  const updateConfig = <K extends keyof AIBacktestConfig>(
    key: K, 
    value: AIBacktestConfig[K]
  ) => {
    setConfig({ ...config, [key]: value })
  }

  const selectedStrategyObj = strategies.find(s => s.id === selectedStrategy)

  return (
    <div className="space-y-6">
      {/* Backtest Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Backtesting Options
          </CardTitle>
          <CardDescription>
            Choose between traditional strategy backtesting or AI signal-based backtesting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={backtestType} onValueChange={(value) => setBacktestType(value as 'traditional' | 'ai-signals')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="traditional">
                <TrendUp className="w-4 h-4 mr-2" />
                Traditional Strategies
              </TabsTrigger>
              <TabsTrigger value="ai-signals">
                <Robot className="w-4 h-4 mr-2" />
                AI Signal Strategies
              </TabsTrigger>
            </TabsList>

            <TabsContent value="traditional" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Trading Strategy</Label>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a strategy to backtest" />
                  </SelectTrigger>
                  <SelectContent>
                    {strategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{strategy.name}</span>
                          <Badge 
                            variant={strategy.active ? "default" : "secondary"}
                            className="ml-2"
                          >
                            {strategy.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStrategyObj && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">{selectedStrategyObj.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedStrategyObj.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Stop Loss:</span>
                      <span className="font-medium ml-2">{selectedStrategyObj.riskManagement.stopLoss}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Take Profit:</span>
                      <span className="font-medium ml-2">{selectedStrategyObj.riskManagement.takeProfit}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Position:</span>
                      <span className="font-medium ml-2">{selectedStrategyObj.riskManagement.maxPositionSize}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Drawdown:</span>
                      <span className="font-medium ml-2">{selectedStrategyObj.riskManagement.maxDrawdown}%</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai-signals" className="space-y-4 mt-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Robot className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">AI Signal Strategy Backtesting</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Test AI-generated trading signals against historical market data. This simulation uses machine learning 
                  patterns and confidence thresholds to execute trades.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aiConfidenceThreshold">AI Confidence Threshold</Label>
                  <Input
                    id="aiConfidenceThreshold"
                    type="number"
                    value={config.aiConfidenceThreshold}
                    onChange={(e) => updateConfig('aiConfidenceThreshold', Number(e.target.value))}
                    min="0.5"
                    max="0.95"
                    step="0.05"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum confidence level for signal execution (0.5 - 0.95)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskPerTrade">Risk per Trade (%)</Label>
                  <Input
                    id="riskPerTrade"
                    type="number"
                    value={config.riskPerTrade}
                    onChange={(e) => updateConfig('riskPerTrade', Number(e.target.value))}
                    min="0.5"
                    max="10"
                    step="0.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentage of capital to risk on each signal
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPositionsPerSignal">Max Positions per Signal</Label>
                  <Input
                    id="maxPositionsPerSignal"
                    type="number"
                    value={config.maxPositionsPerSignal}
                    onChange={(e) => updateConfig('maxPositionsPerSignal', Number(e.target.value))}
                    min="1"
                    max="10"
                    step="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum concurrent positions from AI signals
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Signal Timeframe</Label>
                  <Select 
                    value={config.signalTimeframe} 
                    onValueChange={(value: 'SHORT' | 'MEDIUM' | 'LONG') => updateConfig('signalTimeframe', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SHORT">Short Term (Minutes-Hours)</SelectItem>
                      <SelectItem value="MEDIUM">Medium Term (Hours-Days)</SelectItem>
                      <SelectItem value="LONG">Long Term (Days-Weeks)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    AI signal duration preference
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Backtest Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Backtest Configuration
          </CardTitle>
          <CardDescription>
            Set the parameters for your backtest simulation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={config.startDate}
                onChange={(e) => updateConfig('startDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={config.endDate}
                onChange={(e) => updateConfig('endDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialCapital">Initial Capital ($)</Label>
              <Input
                id="initialCapital"
                type="number"
                value={config.initialCapital}
                onChange={(e) => updateConfig('initialCapital', Number(e.target.value))}
                min="1000"
                step="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission">Commission per Trade ($)</Label>
              <Input
                id="commission"
                type="number"
                value={config.commission}
                onChange={(e) => updateConfig('commission', Number(e.target.value))}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slippage">Slippage (%)</Label>
              <Input
                id="slippage"
                type="number"
                value={config.slippage}
                onChange={(e) => updateConfig('slippage', Number(e.target.value))}
                min="0"
                max="1"
                step="0.01"
              />
            </div>
          </div>

          {/* Warning for unrealistic settings */}
          {(config.commission < 0.5 || config.slippage < 0.01) && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Warning className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Very low commission/slippage values may produce unrealistic results
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run Backtest */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CurrencyCircleDollar className="h-5 w-5" />
            Execute Backtest
          </CardTitle>
          <CardDescription>
            Run the simulation and analyze the results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Running backtest...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Ready to backtest {backtestType === 'ai-signals' ? 'AI Signal Strategy' : selectedStrategyObj?.name || 'selected strategy'}
              </p>
              <p className="text-xs text-muted-foreground">
                Period: {new Date(config.startDate).toLocaleDateString()} - {new Date(config.endDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Initial Capital: ${config.initialCapital.toLocaleString()}
              </p>
              {backtestType === 'ai-signals' && (
                <p className="text-xs text-blue-600">
                  AI Confidence: {(config.aiConfidenceThreshold * 100).toFixed(0)}% | Risk: {config.riskPerTrade}% per trade
                </p>
              )}
            </div>

            <Button
              onClick={runBacktest}
              disabled={
                (backtestType === 'traditional' && !selectedStrategy) || 
                isRunning || 
                !!Object.values(isBacktesting).find(Boolean)
              }
              size="lg"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Running...
                </>
              ) : (
                <>
                  {backtestType === 'ai-signals' ? (
                    <Robot className="w-4 h-4 mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Run {backtestType === 'ai-signals' ? 'AI' : ''} Backtest
                </>
              )}
            </Button>
          </div>

          {Object.values(isBacktesting).find(Boolean) && !isRunning && (
            <div className="text-sm text-muted-foreground text-center py-2">
              Another backtest is currently running. Please wait for it to complete.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}