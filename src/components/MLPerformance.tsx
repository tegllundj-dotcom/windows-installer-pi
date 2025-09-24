import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Brain, Robot, TrendUp, Target } from '@phosphor-icons/react'
import { Trade, Position } from '@/lib/mockData'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface MLStrategy {
  id: string
  name: string
  type: 'momentum' | 'mean_reversion'
  enabled: boolean
  confidence: number
  performance: {
    totalTrades: number
    winRate: number
    avgReturn: number
  }
}

interface MLPerformanceProps {
  trades: Trade[]
  positions: Position[]
}

export function MLPerformance({ trades, positions }: MLPerformanceProps) {
  const [strategies, setStrategies] = useKV<MLStrategy[]>('ml-strategies', [
    {
      id: 'momentum-ml',
      name: 'ML Momentum Strategy',
      type: 'momentum',
      enabled: true,
      confidence: 0.72,
      performance: {
        totalTrades: 147,
        winRate: 68.5,
        avgReturn: 2.3
      }
    },
    {
      id: 'mean-reversion-ml',
      name: 'ML Mean Reversion',
      type: 'mean_reversion',
      enabled: false,
      confidence: 0.58,
      performance: {
        totalTrades: 89,
        winRate: 61.2,
        avgReturn: 1.8
      }
    }
  ])

  const [autoTradingEnabled, setAutoTradingEnabled] = useKV<boolean>('auto-trading-enabled', false)
  const [isOptimizing, setIsOptimizing] = useState<string | null>(null)

  const optimizeStrategy = async (strategyId: string) => {
    setIsOptimizing(strategyId)
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setStrategies(current => (current || []).map(strategy => {
      if (strategy.id === strategyId) {
        const improvement = Math.random() * 0.2 - 0.1
        return {
          ...strategy,
          confidence: Math.min(0.95, Math.max(0.3, strategy.confidence + improvement)),
          performance: {
            ...strategy.performance,
            winRate: Math.min(90, Math.max(30, strategy.performance.winRate + improvement * 50)),
            avgReturn: Math.max(0.1, strategy.performance.avgReturn + improvement * 2)
          }
        }
      }
      return strategy
    }))
    
    setIsOptimizing(null)
    toast.success('Strategy optimized successfully')
  }

  const toggleStrategy = (strategyId: string) => {
    setStrategies(current => (current || []).map(strategy => {
      if (strategy.id === strategyId) {
        return { ...strategy, enabled: !strategy.enabled }
      }
      return strategy
    }))
  }

  const generateSignals = () => {
    if (!autoTradingEnabled) return []
    
    return [
      {
        symbol: 'AAPL',
        direction: 'BUY',
        confidence: 0.75,
        strategy: 'ML Momentum Strategy',
        expectedReturn: 2.1
      },
      {
        symbol: 'GOOGL',
        direction: 'SELL',
        confidence: 0.68,
        strategy: 'ML Mean Reversion',
        expectedReturn: 1.8
      }
    ]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">ML Trading Engine</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={autoTradingEnabled}
            onCheckedChange={setAutoTradingEnabled}
          />
          <Label>Auto Trading</Label>
        </div>
      </div>

      <Tabs defaultValue="strategies" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="strategies">ML Strategies</TabsTrigger>
          <TabsTrigger value="signals">Live Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-4">
          <div className="grid gap-4">
            {(strategies || []).map((strategy) => (
              <Card key={strategy.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Robot className="w-5 h-5" />
                        {strategy.name}
                        <Badge variant={strategy.type === 'momentum' ? 'default' : 'secondary'}>
                          {strategy.type.replace('_', ' ')}
                        </Badge>
                      </CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={strategy.enabled}
                        onCheckedChange={() => toggleStrategy(strategy.id)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => optimizeStrategy(strategy.id)}
                        disabled={isOptimizing === strategy.id}
                      >
                        {isOptimizing === strategy.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            Optimizing
                          </>
                        ) : (
                          'Optimize'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Confidence Level</span>
                    <div className="flex items-center gap-2">
                      <Progress value={strategy.confidence * 100} className="w-24" />
                      <span className="text-sm font-mono">{(strategy.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-lg">{strategy.performance.totalTrades}</div>
                      <div className="text-muted-foreground">Total Trades</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg text-green-600">
                        {strategy.performance.winRate.toFixed(1)}%
                      </div>
                      <div className="text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg text-green-600">
                        {strategy.performance.avgReturn.toFixed(1)}%
                      </div>
                      <div className="text-muted-foreground">Avg Return</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Live Trading Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generateSignals().map((signal, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={signal.direction === 'BUY' ? 'default' : 'destructive'}>
                          {signal.direction}
                        </Badge>
                        <span className="font-semibold">{signal.symbol}</span>
                        <span className="text-sm text-muted-foreground">via {signal.strategy}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Confidence: {(signal.confidence * 100).toFixed(1)}% | Expected: +{signal.expectedReturn.toFixed(1)}%
                      </div>
                    </div>
                    <Button size="sm" disabled={!autoTradingEnabled}>
                      Execute
                    </Button>
                  </div>
                ))}
                {generateSignals().length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No signals generated</p>
                    <p className="text-sm">Enable auto trading to see signals</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}