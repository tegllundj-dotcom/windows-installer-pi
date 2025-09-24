import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, TrendUp, TrendDown, Target } from '@phosphor-icons/react'
import { MarketPrediction, DetectedPattern } from '@/lib/neuralNetwork'

interface PatternVisualizationProps {
  patterns: DetectedPattern[]
  predictions: MarketPrediction[]
}

export function PatternVisualization({ patterns, predictions }: PatternVisualizationProps) {
  const getPatternColor = (type: DetectedPattern['type']) => {
    const colors = {
      support: 'bg-green-500',
      resistance: 'bg-red-500',
      triangle: 'bg-blue-500',
      head_shoulders: 'bg-purple-500',
      double_top: 'bg-orange-500',
      double_bottom: 'bg-cyan-500',
      flag: 'bg-yellow-500',
      wedge: 'bg-pink-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  const getSignalColor = (signal: MarketPrediction['signal']) => {
    switch (signal) {
      case 'buy': return 'text-green-600 bg-green-50'
      case 'sell': return 'text-red-600 bg-red-50'
      case 'hold': return 'text-yellow-600 bg-yellow-50'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Detected Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Chart Patterns
          </CardTitle>
          <CardDescription>
            AI-detected patterns in market data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patterns.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No patterns detected. Run neural network analysis to identify patterns.
            </div>
          ) : (
            <div className="space-y-4">
              {patterns.map((pattern, index) => (
                <div key={index} className="relative border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPatternColor(pattern.type)}`} />
                      <h3 className="font-semibold capitalize">
                        {pattern.type.replace('_', ' ')}
                      </h3>
                    </div>
                    <Badge variant="outline">
                      {(pattern.confidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price Level:</span>
                      <span className="font-mono font-medium">
                        ${pattern.priceLevel.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Significance:</span>
                      <span className="font-medium">
                        {(pattern.significance * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {Math.round((pattern.endTime.getTime() - pattern.startTime.getTime()) / (1000 * 60 * 60))}h
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-muted-foreground">Confidence Level</div>
                    <Progress value={pattern.confidence * 100} className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI Predictions
          </CardTitle>
          <CardDescription>
            Neural network price predictions and signals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {predictions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No predictions available. Run analysis to generate predictions.
            </div>
          ) : (
            <div className="space-y-4">
              {predictions.map((prediction, index) => (
                <div key={index} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{prediction.symbol}</h3>
                      <p className="text-sm text-muted-foreground">
                        {prediction.timeHorizon} minute horizon
                      </p>
                    </div>
                    <Badge className={getSignalColor(prediction.signal)}>
                      {prediction.signal.toUpperCase()}
                      {prediction.signal === 'buy' && <TrendUp className="ml-1 h-3 w-3" />}
                      {prediction.signal === 'sell' && <TrendDown className="ml-1 h-3 w-3" />}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Target Price:</span>
                      <div className="font-mono font-semibold text-lg">
                        ${prediction.priceTarget.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prediction:</span>
                      <div className="font-mono font-semibold text-lg">
                        ${prediction.prediction.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-medium">
                        {(prediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Generated:</span>
                      <span className="font-medium">
                        {prediction.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-1">
                      Model Confidence
                    </div>
                    <Progress value={prediction.confidence * 100} />
                  </div>
                  
                  {prediction.patterns.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-2">
                        Supporting Patterns
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {prediction.patterns.map((pattern, patternIndex) => (
                          <Badge key={patternIndex} variant="secondary" className="text-xs">
                            {pattern.type.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}