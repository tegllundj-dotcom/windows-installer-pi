import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendUp, TrendDown, Target, Clock } from '@phosphor-icons/react'
import { AISignal } from '@/components/AISignalCenter'

interface SignalPerformanceProps {
  signals: AISignal[]
}

export function SignalPerformance({ signals }: SignalPerformanceProps) {
  // Calculate performance metrics
  const executedSignals = signals.filter(s => s.status === 'EXECUTED')
  const activeSignals = signals.filter(s => s.status === 'ACTIVE')
  
  const totalSignals = signals.length
  const executionRate = totalSignals > 0 ? (executedSignals.length / totalSignals) * 100 : 0
  
  // Average confidence of active signals
  const avgConfidence = activeSignals.length > 0 
    ? activeSignals.reduce((sum, signal) => sum + signal.confidence, 0) / activeSignals.length
    : 0
  
  // Signal strength distribution
  const strengthCounts = signals.reduce((acc, signal) => {
    acc[signal.strength] = (acc[signal.strength] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Signal type distribution
  const typeCounts = signals.reduce((acc, signal) => {
    acc[signal.type] = (acc[signal.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const buySignalPercent = totalSignals > 0 ? ((typeCounts.BUY || 0) / totalSignals) * 100 : 0
  const sellSignalPercent = totalSignals > 0 ? ((typeCounts.SELL || 0) / totalSignals) * 100 : 0
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Signal Execution Rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Execution Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono mb-2">
            {executionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {executedSignals.length} of {totalSignals} signals executed
          </div>
          <Progress value={executionRate} className="h-1 mt-2" />
        </CardContent>
      </Card>

      {/* Average Confidence */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendUp className="w-4 h-4 text-green-600" />
            Avg Confidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono mb-2">
            {avgConfidence.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">
            Active signals confidence
          </div>
          <Progress value={avgConfidence} className="h-1 mt-2" />
        </CardContent>
      </Card>

      {/* Signal Bias */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Signal Bias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendUp className="w-3 h-3 text-green-600" />
                <span>Buy</span>
              </div>
              <span className="font-mono">{buySignalPercent.toFixed(0)}%</span>
            </div>
            <Progress value={buySignalPercent} className="h-1" />
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendDown className="w-3 h-3 text-red-600" />
                <span>Sell</span>
              </div>
              <span className="font-mono">{sellSignalPercent.toFixed(0)}%</span>
            </div>
            <Progress value={sellSignalPercent} className="h-1" />
          </div>
        </CardContent>
      </Card>

      {/* Signal Strength */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Signal Strength
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(strengthCounts).map(([strength, count]) => (
              <div key={strength} className="flex items-center justify-between text-sm">
                <Badge 
                  variant="outline"
                  className={`text-xs ${
                    strength === 'STRONG' ? 'border-green-200 text-green-800' :
                    strength === 'MODERATE' ? 'border-yellow-200 text-yellow-800' :
                    'border-gray-200 text-gray-800'
                  }`}
                >
                  {strength}
                </Badge>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}