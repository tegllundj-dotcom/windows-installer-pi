import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Warning, Robot, Gear, TrendUp, Activity, CurrencyDollar } from '@phosphor-icons/react'
import { AutoTradingConfig, RiskParameters, AISignal } from '@/lib/automatedTrading'
import { toast } from 'sonner'

interface AutoTradingConfigPanelProps {
  config: AutoTradingConfig
  onConfigChange: (config: AutoTradingConfig) => void
  recentSignals: AISignal[]
  dailyStats: { tradesExecuted: number; dailyPnL: number }
}

export function AutoTradingConfigPanel({
  config,
  onConfigChange,
  recentSignals,
  dailyStats
}: AutoTradingConfigPanelProps) {
  const [isAdvanced, setIsAdvanced] = useState(false)

  const updateRiskParameter = (key: keyof RiskParameters, value: any) => {
    const newConfig = {
      ...config,
      riskParameters: {
        ...config.riskParameters,
        [key]: value
      }
    }
    onConfigChange(newConfig)
  }

  const updateTradingHours = (field: string, value: string) => {
    const newConfig = {
      ...config,
      tradingHours: {
        ...config.tradingHours,
        [field]: value
      }
    }
    onConfigChange(newConfig)
  }

  const toggleAutoTrading = (enabled: boolean) => {
    onConfigChange({
      ...config,
      enabled
    })
    
    if (enabled) {
      toast.success('Automated trading enabled', {
        description: 'The system will now execute trades based on AI signals within your risk parameters.'
      })
    } else {
      toast.info('Automated trading disabled', {
        description: 'All automated trading has been stopped. Manual trades are still available.'
      })
    }
  }

  const getSignalBadgeColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500'
    if (confidence >= 0.8) return 'bg-blue-500'  
    if (confidence >= 0.7) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  const getSignalIcon = (action: string) => {
    return action === 'BUY' ? (
      <TrendUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendUp className="w-4 h-4 text-red-600 rotate-180" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Toggle and Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Robot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Automated Trading</CardTitle>
                <CardDescription>
                  AI-powered trading execution with risk management
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="auto-trading-toggle" className="text-sm font-medium">
                {config.enabled ? 'Active' : 'Inactive'}
              </Label>
              <Switch
                id="auto-trading-toggle"
                checked={config.enabled}
                onCheckedChange={toggleAutoTrading}
              />
            </div>
          </div>
        </CardHeader>
        
        {config.enabled && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {dailyStats.tradesExecuted}
                </div>
                <div className="text-sm text-muted-foreground">Trades Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  <span className={dailyStats.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {dailyStats.dailyPnL >= 0 ? '+' : ''}${dailyStats.dailyPnL.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">Daily P&L</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(config.riskParameters.confidenceThreshold * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Min Confidence</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Risk Parameters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warning className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-lg">Risk Parameters</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdvanced(!isAdvanced)}
            >
              <Gear className="w-4 h-4 mr-2" />
              {isAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Essential Risk Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Position Size (%)</Label>
              <div className="px-3">
                <Slider
                  value={[config.riskParameters.maxPositionSize]}
                  onValueChange={([value]) => updateRiskParameter('maxPositionSize', value)}
                  max={20}
                  min={1}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1%</span>
                  <span className="font-medium">{config.riskParameters.maxPositionSize}%</span>
                  <span>20%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confidence Threshold (%)</Label>
              <div className="px-3">
                <Slider
                  value={[config.riskParameters.confidenceThreshold * 100]}
                  onValueChange={([value]) => updateRiskParameter('confidenceThreshold', value / 100)}
                  max={95}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>50%</span>
                  <span className="font-medium">{(config.riskParameters.confidenceThreshold * 100).toFixed(0)}%</span>
                  <span>95%</span>
                </div>
              </div>
            </div>
          </div>

          {isAdvanced && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stop Loss (%)</Label>
                  <Input
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={config.riskParameters.stopLossPercent}
                    onChange={(e) => updateRiskParameter('stopLossPercent', parseFloat(e.target.value) || 2)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Take Profit (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    step="0.1"
                    value={config.riskParameters.takeProfitPercent}
                    onChange={(e) => updateRiskParameter('takeProfitPercent', parseFloat(e.target.value) || 4)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Daily Loss (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="25"
                    step="0.5"
                    value={config.riskParameters.maxDailyLoss}
                    onChange={(e) => updateRiskParameter('maxDailyLoss', parseFloat(e.target.value) || 10)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Open Positions</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={config.riskParameters.maxOpenPositions}
                    onChange={(e) => updateRiskParameter('maxOpenPositions', parseInt(e.target.value) || 5)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Trading Hours */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Trading Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={config.tradingHours.start}
                onChange={(e) => updateTradingHours('start', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={config.tradingHours.end}
                onChange={(e) => updateTradingHours('end', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input
                value={config.tradingHours.timezone}
                onChange={(e) => updateTradingHours('timezone', e.target.value)}
                placeholder="America/New_York"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent AI Signals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CurrencyDollar className="w-5 h-5 text-green-500" />
            Recent AI Signals
          </CardTitle>
          <CardDescription>
            Latest trading signals generated by the AI system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full">
            <div className="space-y-3">
              {recentSignals.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No recent signals available
                </div>
              ) : (
                recentSignals.map((signal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-3">
                      {getSignalIcon(signal.action)}
                      <div>
                        <div className="font-medium">{signal.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {signal.action} at ${signal.currentPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${getSignalBadgeColor(signal.confidence)} text-white`}>
                        {(signal.confidence * 100).toFixed(0)}%
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {signal.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}