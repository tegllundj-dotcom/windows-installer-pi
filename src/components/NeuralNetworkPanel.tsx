import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Brain, Lightning, TrendUp, Activity, Play, Pause, ArrowClockwise, Gear } from '@phosphor-icons/react'
import { 
  NeuralNetworkModel, 
  MarketPrediction, 
  DetectedPattern,
  LSTMModel,
  CNNPatternModel,
  TransformerModel,
  PatternRecognitionResult,
  generateTrainingData
} from '@/lib/neuralNetwork'
import { NetworkArchitecture } from '@/components/NetworkArchitecture'
import { toast } from 'sonner'

interface NeuralNetworkPanelProps {
  isActive: boolean
  onPredictionsUpdate: (predictions: MarketPrediction[]) => void
  onPatternsUpdate: (patterns: DetectedPattern[]) => void
}

export function NeuralNetworkPanel({ isActive, onPredictionsUpdate, onPatternsUpdate }: NeuralNetworkPanelProps) {
  const [models, setModels] = useState<NeuralNetworkModel[]>([])
  const [activeModelId, setActiveModelId] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [predictions, setPredictions] = useState<MarketPrediction[]>([])
  const [patterns, setPatterns] = useState<DetectedPattern[]>([])
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [modelInstances] = useState(() => ({
    lstm: new LSTMModel(),
    cnn: new CNNPatternModel(),
    transformer: new TransformerModel()
  }))

  useEffect(() => {
    // Initialize models
    const initialModels = [
      modelInstances.lstm.getModel(),
      modelInstances.cnn.getModel(),
      modelInstances.transformer.getModel()
    ]
    setModels(initialModels)
    setActiveModelId(initialModels[0].id)
  }, [])

  const activeModel = models.find(m => m.id === activeModelId)

  const handleAnalyzeMarket = async () => {
    if (!activeModel) return
    
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 200)

      // Generate mock market data
      const marketData = Array.from({ length: 100 }, (_, i) => [
        50000 + Math.sin(i * 0.1) * 1000 + Math.random() * 500, // Open
        50200 + Math.sin(i * 0.1) * 1000 + Math.random() * 500, // High
        49800 + Math.sin(i * 0.1) * 1000 + Math.random() * 500, // Low
        50000 + Math.sin(i * 0.1) * 1000 + Math.random() * 500, // Close
        Math.random() * 1000000 // Volume
      ])

      let newPredictions: MarketPrediction[] = []
      let newPatterns: DetectedPattern[] = []

      // Run analysis based on model type
      if (activeModel.type === 'LSTM') {
        newPredictions = await modelInstances.lstm.predict(marketData)
      } else if (activeModel.type === 'CNN') {
        newPatterns = await modelInstances.cnn.detectPatterns(marketData)
      } else if (activeModel.type === 'Transformer') {
        newPredictions = await modelInstances.transformer.analyzeMarket(marketData)
      }

      clearInterval(progressInterval)
      setAnalysisProgress(100)
      
      setPredictions(newPredictions)
      setPatterns(newPatterns)
      onPredictionsUpdate(newPredictions)
      onPatternsUpdate(newPatterns)
      
      toast.success(`${activeModel.name} analysis completed`)
    } catch (error) {
      toast.error('Analysis failed')
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false)
        setAnalysisProgress(0)
      }, 1000)
    }
  }

  const handleTrainModel = async () => {
    if (!activeModel) return
    
    const trainingData = generateTrainingData(1000)
    
    // Update model status to training
    setModels(prev => prev.map(m => 
      m.id === activeModelId 
        ? { ...m, status: 'training' as const }
        : m
    ))
    
    toast.loading('Training neural network...')
    
    // Simulate training
    setTimeout(() => {
      setModels(prev => prev.map(m => 
        m.id === activeModelId 
          ? { 
              ...m, 
              status: 'ready' as const,
              accuracy: Math.max(0.6, Math.min(0.95, m.accuracy + (Math.random() - 0.5) * 0.1)),
              lastTrained: new Date()
            }
          : m
      ))
      toast.success('Model training completed')
    }, 3000)
  }

  const getModelIcon = (type: NeuralNetworkModel['type']) => {
    switch (type) {
      case 'LSTM': return <Activity className="h-5 w-5" />
      case 'CNN': return <Brain className="h-5 w-5" />
      case 'Transformer': return <Lightning className="h-5 w-5" />
      default: return <Brain className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: NeuralNetworkModel['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-500'
      case 'training': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Neural Network Models
          </CardTitle>
          <CardDescription>
            Advanced pattern recognition and market prediction models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={activeModelId} onValueChange={setActiveModelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      {getModelIcon(model.type)}
                      {model.name}
                      <Badge variant={model.status === 'ready' ? 'default' : 'secondary'}>
                        {model.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeModel && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{(activeModel.accuracy * 100).toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{activeModel.architecture.parameters.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Parameters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{(activeModel.performance.sharpeRatio).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{(activeModel.performance.winRate * 100).toFixed(0)}%</div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyzeMarket} 
                disabled={isAnalyzing || !activeModel}
                className="flex-1"
              >
                {isAnalyzing ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Market'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleTrainModel}
                disabled={!activeModel || activeModel.status === 'training'}
              >
                <ArrowClockwise className="h-4 w-4 mr-2" />
                Retrain
              </Button>
              <Button variant="outline" size="icon">
                <Gear className="h-4 w-4" />
              </Button>
            </div>

            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analysis Progress</span>
                  <span>{analysisProgress.toFixed(0)}%</span>
                </div>
                <Progress value={analysisProgress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Market Predictions</CardTitle>
              <CardDescription>Neural network price predictions and trading signals</CardDescription>
            </CardHeader>
            <CardContent>
              {predictions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Run analysis to generate predictions
                </div>
              ) : (
                <div className="space-y-4">
                  {predictions.map((prediction, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{prediction.symbol}</h3>
                          <p className="text-sm text-muted-foreground">
                            {prediction.timeHorizon}min horizon
                          </p>
                        </div>
                        <Badge variant={prediction.signal === 'buy' ? 'default' : prediction.signal === 'sell' ? 'destructive' : 'secondary'}>
                          {prediction.signal.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Target:</span>
                          <div className="font-mono font-medium">${prediction.priceTarget.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Confidence:</span>
                          <div className="font-medium">{(prediction.confidence * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time:</span>
                          <div className="font-medium">{prediction.timestamp.toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Detected Patterns</CardTitle>
              <CardDescription>Chart patterns identified by neural networks</CardDescription>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Run pattern analysis to detect chart patterns
                </div>
              ) : (
                <div className="space-y-4">
                  {patterns.map((pattern, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold capitalize">{pattern.type.replace('_', ' ')}</h3>
                          <p className="text-sm text-muted-foreground">
                            Price Level: ${pattern.priceLevel.toFixed(2)}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {(pattern.confidence * 100).toFixed(1)}% confidence
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Significance:</span>
                          <div className="font-medium">{(pattern.significance * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <div className="font-medium">
                            {Math.round((pattern.endTime.getTime() - pattern.startTime.getTime()) / (1000 * 60 * 60))}h
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architecture">
          {activeModel && <NetworkArchitecture model={activeModel} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}