import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, TrendUp, TrendDown, ChartBar, Warning, Lightning } from '@phosphor-icons/react'
import { mlEngine, type PredictionResult, type StrategyOptimization, type MarketRegime, type MLAnalysis } from '@/lib/mlEngine'
import { Trade, Position } from '@/lib/mockData'

interface MLPredictionsProps {
  trades: Trade[]
  positions: Position[]
  onOptimizeStrategy?: (optimization: StrategyOptimization) => void
}

export function MLPredictions({ trades, positions, onOptimizeStrategy }: MLPredictionsProps) {
  const [analysis, setAnalysis] = useState<MLAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedSymbols] = useState(['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'])

  const runMLAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const predictions = await mlEngine.predictPrices(selectedSymbols, trades)
      const marketRegime = await mlEngine.detectMarketRegime(trades)
      const riskFactors = mlEngine.analyzeRiskFactors(trades, positions)
      
      // Generate sample optimizations for demo
      const optimizations: StrategyOptimization[] = []
      if (trades.length > 10) {
        const momentum = await mlEngine.optimizeStrategy('momentum', trades, {
          lookbackPeriod: 10,
          threshold: 0.02,
          stopLoss: 0.05
        })
        const meanReversion = await mlEngine.optimizeStrategy('mean_reversion', trades, {
          lookbackPeriod: 20,
          deviationThreshold: 2,
          holdingPeriod: 5
        })
        optimizations.push(momentum, meanReversion)
      }

      setAnalysis({
        predictions,
        optimizations,
        marketRegime,
        riskFactors,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('ML Analysis failed:', error)
    }
    setIsAnalyzing(false)
  }

  useEffect(() => {
    if (trades.length > 5) {
      runMLAnalysis()
    }
  }, [trades])

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'bullish': return <TrendUp className="w-4 h-4 text-green-600" />
      case 'bearish': return <TrendDown className="w-4 h-4 text-red-600" />
      default: return <ChartBar className="w-4 h-4 text-gray-600" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.7) return 'text-green-600'
    if (confidence > 0.4) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case 'trending': return 'bg-blue-100 text-blue-800'
      case 'volatile': return 'bg-red-100 text-red-800'
      case 'stable': return 'bg-green-100 text-green-800'
      case 'ranging': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!analysis && trades.length <= 5) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Need more trading data for ML analysis</p>
            <p className="text-sm">At least 6 trades required</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">AI Market Analysis</h2>
        </div>
        <Button
          onClick={runMLAnalysis}
          disabled={isAnalyzing}
          variant="outline"
          size="sm"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Lightning className="w-4 h-4 mr-2" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <Tabs defaultValue="predictions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="predictions">Price Predictions</TabsTrigger>
            <TabsTrigger value="regime">Market Regime</TabsTrigger>
            <TabsTrigger value="optimization">Strategy Optimization</TabsTrigger>
            <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            <div className="grid gap-4">
              {analysis.predictions.map((prediction) => (
                <Card key={prediction.symbol}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{prediction.symbol}</h3>
                          {getDirectionIcon(prediction.direction)}
                          <Badge variant={prediction.direction === 'bullish' ? 'default' : prediction.direction === 'bearish' ? 'destructive' : 'secondary'}>
                            {prediction.direction}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Price Target:</span>
                            <span className="font-mono">${prediction.priceTarget.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Time Horizon:</span>
                            <span>{prediction.timeHorizon}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                          {(prediction.confidence * 100).toFixed(0)}% confidence
                        </div>
                        <Progress value={prediction.confidence * 100} className="w-20 mt-1" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground mb-1">Analysis Factors:</div>
                      <div className="flex flex-wrap gap-1">
                        {prediction.factors.map((factor, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {factor.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="regime" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Market Regime</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Badge className={getRegimeColor(analysis.marketRegime.regime)} variant="secondary">
                      {analysis.marketRegime.regime.toUpperCase()}
                    </Badge>
                    <div className={`text-sm font-medium ${getConfidenceColor(analysis.marketRegime.confidence)}`}>
                      {(analysis.marketRegime.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                  <Progress value={analysis.marketRegime.confidence * 100} className="w-32" />
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Market Characteristics</h4>
                    <ul className="space-y-1">
                      {analysis.marketRegime.characteristics.map((char, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full" />
                          {char}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recommended Strategies</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.marketRegime.recommendedStrategies.map((strategy, idx) => (
                        <Badge key={idx} variant="outline">
                          {strategy.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <div className="grid gap-4">
              {analysis.optimizations.map((opt) => (
                <Card key={opt.strategyId}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="capitalize">{opt.strategyId.replace('_', ' ')} Strategy</CardTitle>
                      <Button
                        size="sm"
                        onClick={() => onOptimizeStrategy?.(opt)}
                        variant="outline"
                      >
                        Apply Optimization
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Expected Return:</span>
                          <span className={opt.expectedReturn >= 0 ? 'profit' : 'loss'}>
                            {opt.expectedReturn >= 0 ? '+' : ''}{opt.expectedReturn.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Win Rate:</span>
                          <span>{opt.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sharpe Ratio:</span>
                          <span>{opt.sharpeRatio.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Risk Score:</span>
                          <span className={opt.riskScore > 7 ? 'text-red-600' : opt.riskScore > 4 ? 'text-yellow-600' : 'text-green-600'}>
                            {opt.riskScore.toFixed(1)}/10
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Max Drawdown:</span>
                          <span className="loss">-{opt.maxDrawdown.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-sm">Optimized Parameters</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(opt.optimizedParams).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                            <span className="font-mono">{typeof value === 'number' ? value.toFixed(3) : value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="risks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warning className="w-5 h-5 text-yellow-600" />
                  Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.riskFactors.length > 0 ? (
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {analysis.riskFactors.map((risk, idx) => (
                        <Alert key={idx} variant="default">
                          <Warning className="w-4 h-4" />
                          <AlertDescription>{risk}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Warning className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No significant risk factors detected</p>
                    <p className="text-sm">Your portfolio appears well-balanced</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {analysis && (
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {analysis.timestamp.toLocaleString()}
        </div>
      )}
    </div>
  )
}