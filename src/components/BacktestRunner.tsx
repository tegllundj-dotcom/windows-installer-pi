import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, CurrencyCircleDollar, Play, Warning } from '@phosphor-icons/react'
import { StrategyConfig, BacktestResult } from '@/lib/tradingStrategy'
import { createStrategy } from '@/lib/strategyManager'
import { BacktestEngine, BacktestConfig, generateSampleMarketData } from '@/lib/backtestEngine'
import { toast } from 'sonner'

interface BacktestRunnerProps {
  strategies: StrategyConfig[]
  onBacktestStart: (strategyId: string) => void
  onBacktestComplete: (strategyId: string, result: BacktestResult) => void
  isBacktesting: Record<string, boolean>
}

export function BacktestRunner({ 
  strategies, 
  onBacktestStart, 
  onBacktestComplete, 
  isBacktesting 
}: BacktestRunnerProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('')
  const [config, setConfig] = useState<BacktestConfig>({
    initialCapital: 100000,
    startDate: '2023-01-01',
    endDate: '2024-01-01',
    commission: 5,
    slippage: 0.1
  })
  const [progress, setProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const runBacktest = async () => {
    if (!selectedStrategy) {
      toast.error('Please select a strategy to backtest')
      return
    }

    const strategy = strategies.find(s => s.id === selectedStrategy)
    if (!strategy) {
      toast.error('Strategy not found')
      return
    }

    setIsRunning(true)
    setProgress(0)
    onBacktestStart(selectedStrategy)

    try {
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

  const updateConfig = <K extends keyof BacktestConfig>(
    key: K, 
    value: BacktestConfig[K]
  ) => {
    setConfig({ ...config, [key]: value })
  }

  const selectedStrategyObj = strategies.find(s => s.id === selectedStrategy)

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Strategy Selection
          </CardTitle>
          <CardDescription>
            Choose a strategy to backtest against historical market data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                Ready to backtest {selectedStrategyObj?.name || 'selected strategy'}
              </p>
              <p className="text-xs text-muted-foreground">
                Period: {new Date(config.startDate).toLocaleDateString()} - {new Date(config.endDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Initial Capital: ${config.initialCapital.toLocaleString()}
              </p>
            </div>

            <Button
              onClick={runBacktest}
              disabled={!selectedStrategy || isRunning || !!Object.values(isBacktesting).find(Boolean)}
              size="lg"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Backtest
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