import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Brain, TrendUp, TrendDown, Activity, Warning, CheckCircle, XCircle, Lightning } from '@phosphor-icons/react'
import { useRealTimeAnalysis, useMarketData } from '@/hooks/useRealTimeAnalysis'
import type { TradingSignal } from '@/lib/realtimeAnalysis'

interface NeuralNetworkAnalysisProps {
  symbol: string
  className?: string
}

export function NeuralNetworkAnalysis({ symbol, className }: NeuralNetworkAnalysisProps) {
  const [autoTrading, setAutoTrading] = useState(false)
  const [selectedModels, setSelectedModels] = useState(['lstm-1', 'cnn-1', 'transformer-1'])
  
  const [analysisState, analysisActions] = useRealTimeAnalysis({
    symbol,
    autoStart: true,
    models: selectedModels,
    enablePatternDetection: true,
    enableSentimentAnalysis: true,
    minConfidence: 0.6
  })

  const { marketData } = useMarketData(symbol)
  const { analysis, isActive, isConnected, error, loading } = analysisState

  const formatPrice = (price: number) => `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600'
      case 'bearish': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getSignalIcon = (signal: TradingSignal) => {
    switch (signal.action) {
      case 'buy': return <TrendUp className="w-4 h-4 text-green-600" />
      case 'sell': return <TrendDown className="w-4 h-4 text-red-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Neural Network Analysis</h2>
            <p className="text-sm text-muted-foreground">{symbol} • Real-time AI predictions</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <Button
            variant={isActive ? 'destructive' : 'default'}
            onClick={isActive ? analysisActions.stopAnalysis : analysisActions.startAnalysis}
            disabled={loading}
          >
            {loading ? 'Loading...' : isActive ? 'Stop Analysis' : 'Start Analysis'}
          </Button>
        </div>
      </div>

      {/* Connection Error */}
      {error && (
        <Alert variant="destructive">
          <Warning className="w-4 h-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={analysisActions.reconnect}
            >
              Reconnect
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Analysis Content */}
      {isActive && analysis && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Market Price */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Price</p>
                      <p className="text-2xl font-bold">{formatPrice(marketData?.price || 0)}</p>
                      {marketData && (
                        <p className={`text-sm ${marketData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {marketData.change >= 0 ? '+' : ''}{marketData.change.toFixed(2)} ({formatPercentage(marketData.changePercent / 100)})
                        </p>
                      )}
                    </div>
                    <Activity className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              {/* AI Confidence */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">AI Confidence</p>
                      <p className="text-2xl font-bold">{(analysis.confidence * 100).toFixed(1)}%</p>
                      <Progress value={analysis.confidence * 100} className="mt-2" />
                    </div>
                    <Brain className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              {/* Market Sentiment */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sentiment</p>
                      <p className={`text-2xl font-bold capitalize ${getSentimentColor(analysis.sentiment)}`}>
                        {analysis.sentiment}
                      </p>
                      <p className="text-sm text-muted-foreground">Trend: {analysis.trendStrength.toFixed(2)}</p>
                    </div>
                    {analysis.sentiment === 'bullish' ? 
                      <TrendUp className="w-8 h-8 text-green-600" /> : 
                      analysis.sentiment === 'bearish' ? 
                        <TrendDown className="w-8 h-8 text-red-600" /> : 
                        <Activity className="w-8 h-8 text-yellow-600" />
                    }
                  </div>
                </CardContent>
              </Card>

              {/* Risk Level */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Risk Level</p>
                      <p className={`text-2xl font-bold capitalize ${getRiskColor(analysis.riskLevel)}`}>
                        {analysis.riskLevel}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Volatility: {analysis.volatilityIndex.toFixed(1)}%
                      </p>
                    </div>
                    <Warning className={`w-8 h-8 ${getRiskColor(analysis.riskLevel)}`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Model Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
                <CardDescription>Real-time neural network metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {(analysis.modelPerformance.accuracy * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {(analysis.modelPerformance.precision * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Precision</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {(analysis.modelPerformance.recall * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Recall</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {analysis.modelPerformance.predictionLatency.toFixed(0)}ms
                    </p>
                    <p className="text-sm text-muted-foreground">Latency</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Predictions</CardTitle>
                <CardDescription>
                  {analysis.predictions.length} active predictions from neural network models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.predictions.map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={prediction.signal === 'buy' ? 'default' : prediction.signal === 'sell' ? 'destructive' : 'secondary'}>
                            {prediction.signal.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {prediction.timeHorizon}min horizon
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">
                            Target: {formatPrice(prediction.priceTarget)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Current: {formatPrice(prediction.prediction)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-lg font-semibold">
                          {(prediction.confidence * 100).toFixed(1)}%
                        </p>
                        <Progress value={prediction.confidence * 100} className="w-16 mt-1" />
                      </div>
                    </div>
                  ))}
                  {analysis.predictions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No predictions available. Models are analyzing market data...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detected Patterns</CardTitle>
                <CardDescription>
                  Technical patterns identified by CNN models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.patterns.map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {pattern.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatPrice(pattern.priceLevel)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">
                            Significance: {(pattern.significance * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(pattern.startTime).toLocaleDateString()} - {new Date(pattern.endTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-lg font-semibold">
                          {(pattern.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                  {analysis.patterns.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No patterns detected. CNN models are scanning for technical formations...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trading Signals Tab */}
          <TabsContent value="signals" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Trading Signals</CardTitle>
                    <CardDescription>
                      AI-generated trading recommendations
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="auto-trading" className="text-sm">
                      Auto Trading
                    </Label>
                    <Switch
                      id="auto-trading"
                      checked={autoTrading}
                      onCheckedChange={setAutoTrading}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.tradingSignals.slice(0, 8).map((signal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        {getSignalIcon(signal)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge 
                              variant={signal.type === 'entry' ? 'default' : 
                                      signal.type === 'stop_loss' ? 'destructive' : 
                                      signal.type === 'take_profit' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {signal.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm font-medium capitalize">{signal.action}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{signal.reasoning}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-medium">{formatPrice(signal.price)}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {(signal.confidence * 100).toFixed(0)}%
                          </span>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`w-1 h-3 mx-px ${
                                  i < Math.round(signal.strength * 5) ? 'bg-primary' : 'bg-muted'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {analysis.tradingSignals.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightning className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      No trading signals generated yet. AI is analyzing market conditions...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {autoTrading && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  Auto-trading is enabled. The system will execute trades automatically based on AI signals above 80% confidence.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Not Active State */}
      {!isActive && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Neural Network Analysis Inactive</h3>
            <p className="text-muted-foreground mb-6">
              Start real-time AI analysis to receive predictions, pattern detection, and trading signals.
            </p>
            <Button onClick={analysisActions.startAnalysis}>
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}