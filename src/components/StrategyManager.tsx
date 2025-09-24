import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, Gear, TrendUp, TrendDown, Activity, ChartBar } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { StrategyConfig, BacktestResult } from '@/lib/tradingStrategy'
import { DEFAULT_STRATEGIES } from '@/lib/strategyManager'
import { StrategyConfigDialog } from './StrategyConfigDialog'
import { BacktestResults } from './BacktestResults'
import { BacktestRunner } from './BacktestRunner'

interface StrategyManagerProps {
  onStrategySignal?: (signal: any) => void
}

export function StrategyManager({ onStrategySignal }: StrategyManagerProps) {
  const [strategies, setStrategies] = useKV<StrategyConfig[]>('trading-strategies', DEFAULT_STRATEGIES)
  const [backtestResults, setBacktestResults] = useKV<Record<string, BacktestResult>>('backtest-results', {})
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)
  const [isBacktesting, setIsBacktesting] = useState<Record<string, boolean>>({})
  const [showBacktestDialog, setShowBacktestDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)

  const handleToggleStrategy = (strategyId: string, active: boolean) => {
    setStrategies((current) => 
      (current || []).map(s => s.id === strategyId ? { ...s, active } : s)
    )
    
    const strategy = (strategies || []).find(s => s.id === strategyId)
    toast.success(`Strategy "${strategy?.name}" ${active ? 'activated' : 'deactivated'}`)
  }

  const handleBacktestComplete = (strategyId: string, result: BacktestResult) => {
    setBacktestResults((current) => ({
      ...(current || {}),
      [strategyId]: result
    }))
    
    setIsBacktesting((current) => ({
      ...(current || {}),
      [strategyId]: false
    }))

    const strategy = (strategies || []).find(s => s.id === strategyId)
    toast.success(`Backtest completed for "${strategy?.name}"`, {
      description: `Total Return: ${result.totalReturnPercent.toFixed(2)}%`
    })
  }

  const handleBacktestStart = (strategyId: string) => {
    setIsBacktesting((current) => ({
      ...current,
      [strategyId]: true
    }))
  }

  const handleStrategyUpdate = (updatedStrategy: StrategyConfig) => {
    setStrategies((current) => 
      (current || []).map(s => s.id === updatedStrategy.id ? updatedStrategy : s)
    )
    
    toast.success(`Strategy "${updatedStrategy.name}" updated`)
  }

  const safeStrategies = strategies || []
  const safeBacktestResults = backtestResults || {}
  
  const activeStrategies = safeStrategies.filter(s => s.active)
  const inactiveStrategies = safeStrategies.filter(s => !s.active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Strategy Manager</h2>
          <p className="text-muted-foreground">
            Configure and backtest automated trading strategies
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1">
            {activeStrategies.length} Active
          </Badge>
          
          <Dialog open={showBacktestDialog} onOpenChange={setShowBacktestDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ChartBar className="w-4 h-4 mr-2" />
                Run Backtest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Strategy Backtesting</DialogTitle>
                <DialogDescription>
                  Test your strategies against historical market data
                </DialogDescription>
              </DialogHeader>
              <BacktestRunner
                strategies={safeStrategies}
                onBacktestStart={handleBacktestStart}
                onBacktestComplete={handleBacktestComplete}
                isBacktesting={isBacktesting || {}}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Strategy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Strategies</p>
                <p className="text-2xl font-bold">{safeStrategies.length}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Strategies</p>
                <p className="text-2xl font-bold text-green-600">{activeStrategies.length}</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Performance</p>
                <p className="text-2xl font-bold">
                  {Object.values(safeBacktestResults).length > 0
                    ? `${(Object.values(safeBacktestResults).reduce((acc, r) => acc + r.totalReturnPercent, 0) / Object.values(safeBacktestResults).length).toFixed(1)}%`
                    : 'N/A'
                  }
                </p>
              </div>
              <TrendUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy List */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Strategies</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Strategies</TabsTrigger>
          <TabsTrigger value="results">Backtest Results</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeStrategies.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Pause className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Strategies</h3>
                <p className="text-muted-foreground mb-4">
                  Activate some strategies to start automated trading
                </p>
                <Button 
                  onClick={() => setShowConfigDialog(true)}
                  variant="outline"
                >
                  Configure Strategies
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  backtestResult={safeBacktestResults[strategy.id]}
                  isBacktesting={isBacktesting[strategy.id]}
                  onToggle={handleToggleStrategy}
                  onConfigure={() => {
                    setSelectedStrategy(strategy.id)
                    setShowConfigDialog(true)
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {inactiveStrategies.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Strategies Active</h3>
                <p className="text-muted-foreground">
                  All your strategies are currently active and running
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {inactiveStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  backtestResult={safeBacktestResults[strategy.id]}
                  isBacktesting={isBacktesting[strategy.id]}
                  onToggle={handleToggleStrategy}
                  onConfigure={() => {
                    setSelectedStrategy(strategy.id)
                    setShowConfigDialog(true)
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <BacktestResults 
            results={safeBacktestResults}
            strategies={safeStrategies}
          />
        </TabsContent>
      </Tabs>

      {/* Strategy Configuration Dialog */}
      <StrategyConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        strategy={selectedStrategy ? safeStrategies.find(s => s.id === selectedStrategy) || null : null}
        onSave={handleStrategyUpdate}
      />
    </div>
  )
}

interface StrategyCardProps {
  strategy: StrategyConfig
  backtestResult?: BacktestResult
  isBacktesting?: boolean
  onToggle: (id: string, active: boolean) => void
  onConfigure: () => void
}

function StrategyCard({ strategy, backtestResult, isBacktesting, onToggle, onConfigure }: StrategyCardProps) {
  return (
    <Card className={strategy.active ? "border-green-200 bg-green-50/30" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{strategy.name}</CardTitle>
            <CardDescription className="text-sm">
              {strategy.description}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={strategy.active ? "default" : "secondary"}
              className={strategy.active ? "bg-green-100 text-green-800 border-green-200" : ""}
            >
              {strategy.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Performance Summary */}
        {backtestResult && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Total Return</p>
              <p className={`font-semibold ${backtestResult.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {backtestResult.totalReturnPercent >= 0 ? '+' : ''}{backtestResult.totalReturnPercent.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className="font-semibold">{backtestResult.winRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
              <p className="font-semibold">{backtestResult.sharpeRatio.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max Drawdown</p>
              <p className="font-semibold text-red-600">{backtestResult.maxDrawdownPercent.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {/* Risk Management */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stop Loss:</span>
            <span className="font-medium">{strategy.riskManagement.stopLoss}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Take Profit:</span>
            <span className="font-medium">{strategy.riskManagement.takeProfit}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Max Position:</span>
            <span className="font-medium">{strategy.riskManagement.maxPositionSize}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              checked={strategy.active}
              onCheckedChange={(checked) => onToggle(strategy.id, checked)}
              disabled={isBacktesting}
            />
            <span className="text-sm text-muted-foreground">
              {strategy.active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onConfigure}
            disabled={isBacktesting}
          >
            <Gear className="w-4 h-4 mr-1" />
            Configure
          </Button>
        </div>

        {/* Backtesting Progress */}
        {isBacktesting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Running backtest...</span>
              <span className="animate-pulse">🔄</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}