import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Warning, TrendUp, TrendDown, Brain, Lightning, Target, Activity, Pulse } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { marketDataService, MarketDataPoint, MarketSentiment } from '@/lib/realTimeMarketData'
import { SmartTradingHub } from "@/components/SmartTradingHub"
import { SignalPerformance } from '@/components/SignalPerformance'

export interface AISignal {
  id: string
  symbol: string
  type: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  strength: 'WEAK' | 'MODERATE' | 'STRONG'
  price: number
  targetPrice?: number
  stopLoss?: number
  timeframe: string
  indicators: string[]
  reasoning: string
  timestamp: Date
  status: 'ACTIVE' | 'EXECUTED' | 'EXPIRED'
}

export interface MarketAnalysis {
  overall_sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  market_conditions: string
  volatility_index: number
  trend_strength: number
  support_levels: number[]
  resistance_levels: number[]
  key_factors: string[]
  risk_assessment: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface AISignalCenterProps {
  onSignalAction?: (signal: AISignal, action: 'execute' | 'dismiss') => void
}

export function AISignalCenter({ onSignalAction }: AISignalCenterProps) {
  const [signals, setSignals] = useKV<AISignal[]>('ai-signals', [])
  const [marketAnalysis, setMarketAnalysis] = useKV<MarketAnalysis | null>('market-analysis', null)
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment | null>(null)
  const [realtimeData, setRealtimeData] = useState<Record<string, MarketDataPoint>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [autoSignalsEnabled, setAutoSignalsEnabled] = useKV<boolean>('auto-signals-enabled', true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h')

  // Subscribe to real-time market data and sentiment
  useEffect(() => {
    const watchedSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'BTCUSD', 'ETHUSD']
    const unsubscribers: (() => void)[] = []
    
    // Subscribe to market data for key symbols
    watchedSymbols.forEach(symbol => {
      const unsubscribe = marketDataService.subscribe(symbol, (dataPoint) => {
        setRealtimeData(prev => ({
          ...prev,
          [symbol]: dataPoint
        }))
      })
      unsubscribers.push(unsubscribe)
    })
    
    // Subscribe to market sentiment
    const sentimentUnsubscribe = marketDataService.subscribeToMarketSentiment(setMarketSentiment)
    unsubscribers.push(sentimentUnsubscribe)
    
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [])

  // Enhanced signal generation with real-time data
  const generateSignals = async () => {
    setIsAnalyzing(true)
    try {
      const realtimeContext = Object.entries(realtimeData)
        .slice(0, 5)
        .map(([symbol, data]) => 
          `${symbol}: $${data.price.toFixed(2)} (${data.changePercent.toFixed(2)}%) RSI: ${data.indicators?.rsi?.toFixed(1)} Vol: ${(data.volume/1000000).toFixed(1)}M`
        ).join(', ')
      
      const sentimentContext = marketSentiment ? 
        `Market Sentiment: ${marketSentiment.label} (${(marketSentiment.score * 100).toFixed(0)}%)` : 
        'Market Sentiment: Analyzing...'

      const prompt = (window as any).spark.llmPrompt`
        As an expert AI trading analyst, generate 3-5 high-quality trading signals using current market data.
        
        REAL-TIME MARKET DATA:
        ${realtimeContext}
        
        MARKET SENTIMENT:
        ${sentimentContext}
        
        Analysis Requirements:
        - Use actual current prices and technical indicators provided
        - Consider market sentiment in signal strength
        - Factor in volume and volatility
        - Generate realistic target prices and stop losses
        - Provide clear technical reasoning
        
        Generate signals for symbols: AAPL, GOOGL, TSLA, MSFT, NVDA, BTCUSD, ETHUSD
        
        Return as JSON:
        {
          "signals": [
            {
              "symbol": "AAPL",
              "type": "BUY",
              "confidence": 85,
              "strength": "STRONG",
              "price": 185.25,
              "targetPrice": 195.00,
              "stopLoss": 178.00,
              "timeframe": "${selectedTimeframe}",
              "indicators": ["RSI_Oversold", "Volume_Breakout", "Support_Bounce"],
              "reasoning": "Stock bounced strongly off key support level at $180 with high volume. RSI shows oversold conditions reversing, indicating potential upward momentum."
            }
          ]
        }
      `
      
      const response = await (window as any).spark.llm(prompt, 'gpt-4o', true)
      const data = JSON.parse(response)
      
      const newSignals: AISignal[] = (data.signals || []).map((signal: any, index: number) => ({
        ...signal,
        id: `signal_${Date.now()}_${index}`,
        timestamp: new Date(),
        status: 'ACTIVE' as const
      }))
      
      setSignals((prev = []) => [...newSignals, ...prev].slice(0, 20))
      toast.success(`Generated ${newSignals.length} new AI signals`)
      
    } catch (error) {
      toast.error('Failed to generate signals')
      console.error('Signal generation error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Generate comprehensive market analysis
  const analyzeMarket = async () => {
    setIsAnalyzing(true)
    try {
      const prompt = (window as any).spark.llmPrompt`
        Provide a comprehensive real-time market analysis as an expert trading AI.
        
        Analyze:
        - Overall market sentiment (bullish/bearish/neutral)
        - Current market conditions and trends
        - Volatility assessment
        - Key support and resistance levels for major indices
        - Risk factors and market catalysts
        - Trading recommendations based on current environment
        
        Return analysis as JSON:
        {
          "overall_sentiment": "BULLISH|BEARISH|NEUTRAL",
          "market_conditions": "Detailed description of current market state",
          "volatility_index": 65,
          "trend_strength": 75,
          "support_levels": [4200, 4150, 4100],
          "resistance_levels": [4350, 4400, 4450],
          "key_factors": ["Federal Reserve policy", "Earnings season", "Geopolitical tensions"],
          "risk_assessment": "LOW|MEDIUM|HIGH"
        }
      `
      
      const response = await (window as any).spark.llm(prompt, 'gpt-4o', true)
      const analysis = JSON.parse(response)
      setMarketAnalysis(analysis)
      toast.success('Market analysis updated')
      
    } catch (error) {
      toast.error('Failed to analyze market')
      console.error('Market analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-generate signals periodically
  useEffect(() => {
    if (autoSignalsEnabled) {
      const interval = setInterval(() => {
        generateSignals()
        analyzeMarket()
      }, 5 * 60 * 1000) // Every 5 minutes
      
      return () => clearInterval(interval)
    }
  }, [autoSignalsEnabled, selectedTimeframe])

  // Initial load
  useEffect(() => {
    if ((signals || []).length === 0) {
      generateSignals()
    }
    if (!marketAnalysis) {
      analyzeMarket()
    }
  }, [])

  const handleSignalAction = (signal: AISignal, action: 'execute' | 'dismiss') => {
    setSignals((prev = []) => 
      prev.map(s => 
        s.id === signal.id 
          ? { ...s, status: action === 'execute' ? 'EXECUTED' : 'EXPIRED' }
          : s
      )
    )
    
    onSignalAction?.(signal, action)
    
    if (action === 'execute') {
      toast.success(`Executing ${signal.type} signal for ${signal.symbol}`)
    } else {
      toast.info(`Dismissed signal for ${signal.symbol}`)
    }
  }

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'BUY': return <TrendUp className="w-4 h-4 text-green-600" />
      case 'SELL': return <TrendDown className="w-4 h-4 text-red-600" />
      default: return <Target className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'STRONG': return 'bg-green-100 text-green-800 border-green-200'
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'WEAK': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const activeSignals = (signals || []).filter(s => s.status === 'ACTIVE')
  const executedSignals = (signals || []).filter(s => s.status === 'EXECUTED')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Signal Center</h2>
            <p className="text-sm text-muted-foreground">Real-time market analysis and trading signals</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch 
              checked={autoSignalsEnabled} 
              onCheckedChange={setAutoSignalsEnabled}
            />
            <span className="text-sm font-medium">Auto-Generate</span>
          </div>
          
          <Button 
            onClick={generateSignals} 
            disabled={isAnalyzing}
            variant="outline"
            size="sm"
          >
            {isAnalyzing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            ) : (
              <Lightning className="w-4 h-4" />
            )}
            Generate Signals
          </Button>
        </div>
      </div>

      {/* Real-Time Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Live Market Data */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Pulse className="w-4 h-4 text-green-500" />
                Live Market Data
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Real-time
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(realtimeData).slice(0, 4).map(([symbol, data]) => (
                <div key={symbol} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{symbol}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">${data.price.toFixed(2)}</span>
                    <span className={cn(
                      "text-xs font-mono",
                      data.changePercent >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {data.changePercent >= 0 ? "+" : ""}{data.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Sentiment */}
        {marketSentiment && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Market Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall</span>
                  <Badge variant={
                    marketSentiment.label === 'BULLISH' ? 'default' :
                    marketSentiment.label === 'BEARISH' ? 'destructive' : 'secondary'
                  }>
                    {marketSentiment.label}
                  </Badge>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Sentiment Score</span>
                    <span className="font-mono">{(marketSentiment.score * 100).toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={(marketSentiment.score + 1) * 50} 
                    className="h-2" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Technical:</span>
                    <span className="font-mono ml-1">{(marketSentiment.technical_sentiment * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">News:</span>
                    <span className="font-mono ml-1">{(marketSentiment.news_sentiment * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Smart Trading Hub */}
      <div className="mb-6">
        <SmartTradingHub 
          signals={signals || []}
          onExecuteSignal={(signal) => handleSignalAction(signal, 'execute')}
        />
      </div>

      {/* Signal Performance Metrics */}
      {(signals || []).length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">Performance Metrics</h3>
          <SignalPerformance signals={signals || []} />
        </div>
      )}

      {marketAnalysis && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Market Analysis</CardTitle>
              <Badge variant={
                marketAnalysis.overall_sentiment === 'BULLISH' ? 'default' :
                marketAnalysis.overall_sentiment === 'BEARISH' ? 'destructive' : 
                'secondary'
              }>
                {marketAnalysis.overall_sentiment}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{marketAnalysis.market_conditions}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Volatility Index</span>
                  <span className="font-mono">{marketAnalysis.volatility_index}%</span>
                </div>
                <Progress value={marketAnalysis.volatility_index} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Trend Strength</span>
                  <span className="font-mono">{marketAnalysis.trend_strength}%</span>
                </div>
                <Progress value={marketAnalysis.trend_strength} className="h-2" />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Warning className={cn(
                "w-4 h-4",
                marketAnalysis.risk_assessment === 'HIGH' ? 'text-red-600' :
                marketAnalysis.risk_assessment === 'MEDIUM' ? 'text-yellow-600' :
                'text-green-600'
              )} />
              <span className="text-sm font-medium">
                Risk Assessment: {marketAnalysis.risk_assessment}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signals Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Active Signals ({activeSignals.length})
          </TabsTrigger>
          <TabsTrigger value="executed">
            Executed ({executedSignals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeSignals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Brain className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No active signals</p>
                <Button onClick={generateSignals} variant="outline">
                  Generate New Signals
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {activeSignals.map((signal) => (
                  <Card key={signal.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getSignalIcon(signal.type)}
                        <div>
                          <h3 className="font-semibold">{signal.symbol}</h3>
                          <p className="text-sm text-muted-foreground">{signal.timeframe}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStrengthColor(signal.strength)}>
                          {signal.strength}
                        </Badge>
                        <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {signal.confidence}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Current:</span>
                        <span className="font-mono ml-1">${signal.price}</span>
                      </div>
                      {signal.targetPrice && (
                        <div>
                          <span className="text-muted-foreground">Target:</span>
                          <span className="font-mono ml-1">${signal.targetPrice}</span>
                        </div>
                      )}
                      {signal.stopLoss && (
                        <div>
                          <span className="text-muted-foreground">Stop Loss:</span>
                          <span className="font-mono ml-1">${signal.stopLoss}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{signal.reasoning}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {signal.indicators.slice(0, 3).map((indicator) => (
                          <Badge key={indicator} variant="outline" className="text-xs">
                            {indicator.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSignalAction(signal, 'dismiss')}
                        >
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSignalAction(signal, 'execute')}
                        >
                          Execute
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="executed">
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {executedSignals.map((signal) => (
                <Card key={signal.id} className="p-4 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSignalIcon(signal.type)}
                      <div>
                        <h3 className="font-semibold">{signal.symbol}</h3>
                        <p className="text-sm text-muted-foreground">
                          Executed {signal.type} at ${signal.price}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{signal.confidence}%</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}