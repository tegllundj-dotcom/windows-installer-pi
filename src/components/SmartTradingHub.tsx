import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, Lightning, Target, TrendUp, TrendDown } from '@phosphor-icons/react'
import { AISignal } from '@/components/AISignalCenter'
import { marketDataService } from '@/lib/realTimeMarketData'

interface SmartTradingHubProps {
  signals: AISignal[]
  onExecuteSignal: (signal: AISignal) => void
}

export function SmartTradingHub({ signals, onExecuteSignal }: SmartTradingHubProps) {
  const [marketPulse, setMarketPulse] = useState(0) // -1 to 1
  const [opportunityScore, setOpportunityScore] = useState(0)
  
  useEffect(() => {
    // Subscribe to market sentiment for overall pulse
    const unsubscribe = marketDataService.subscribeToMarketSentiment((sentiment) => {
      setMarketPulse(sentiment.score)
    })
    
    return unsubscribe
  }, [])
  
  useEffect(() => {
    // Calculate opportunity score based on active high-confidence signals
    const activeHighConfidenceSignals = signals.filter(
      s => s.status === 'ACTIVE' && s.confidence >= 80
    )
    
    const score = activeHighConfidenceSignals.length > 0 
      ? Math.min(100, activeHighConfidenceSignals.reduce((sum, s) => sum + s.confidence, 0) / 10)
      : 0
    
    setOpportunityScore(score)
  }, [signals])
  
  const topSignals = signals
    .filter(s => s.status === 'ACTIVE')
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
  
  const getMarketPulseColor = () => {
    if (marketPulse > 0.3) return 'text-green-600'
    if (marketPulse < -0.3) return 'text-red-600'
    return 'text-yellow-600'
  }
  
  const getMarketPulseLabel = () => {
    if (marketPulse > 0.3) return 'Strong Bullish'
    if (marketPulse > 0.1) return 'Bullish'
    if (marketPulse < -0.3) return 'Strong Bearish'
    if (marketPulse < -0.1) return 'Bearish'
    return 'Neutral'
  }
  
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            Smart Trading Hub
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              AI Powered
            </Badge>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              opportunityScore > 70 ? 'bg-green-500' :
              opportunityScore > 40 ? 'bg-yellow-500' : 
              'bg-gray-400'
            }`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Pulse & Opportunity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Market Pulse</div>
            <div className={`text-lg font-bold ${getMarketPulseColor()}`}>
              {getMarketPulseLabel()}
            </div>
            <div className="text-xs text-muted-foreground">
              {(marketPulse * 100).toFixed(0)}% sentiment
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Opportunity Score</div>
            <div className={`text-lg font-bold ${
              opportunityScore > 70 ? 'text-green-600' :
              opportunityScore > 40 ? 'text-yellow-600' :
              'text-gray-600'
            }`}>
              {opportunityScore.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {topSignals.length} high-conf signals
            </div>
          </div>
        </div>
        
        {/* Top Opportunities */}
        {topSignals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Top Opportunities</h3>
              <Badge variant="secondary" className="text-xs">
                {topSignals.length} signals
              </Badge>
            </div>
            
            <div className="space-y-2">
              {topSignals.map((signal) => (
                <div 
                  key={signal.id}
                  className="flex items-center justify-between p-3 bg-card rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {signal.type === 'BUY' ? (
                      <TrendUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendDown className="w-4 h-4 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">{signal.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {signal.type} • ${signal.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={
                        signal.strength === 'STRONG' ? 'border-green-200 text-green-800' :
                        signal.strength === 'MODERATE' ? 'border-yellow-200 text-yellow-800' :
                        'border-gray-200 text-gray-800'
                      }
                    >
                      {signal.confidence}%
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onExecuteSignal(signal)}
                      className="text-xs"
                    >
                      <Lightning className="w-3 h-3 mr-1" />
                      Execute
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {topSignals.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No high-confidence signals available</p>
            <p className="text-xs">AI is monitoring market conditions...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}