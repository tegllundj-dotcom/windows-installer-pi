import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Brain, Play, Pause, Download, Upload } from '@phosphor-icons/react'
import { NeuralNetworkModel, TrainingData, generateTrainingData } from '@/lib/neuralNetwork'
import { toast } from 'sonner'

interface ModelTrainingPanelProps {
  models: NeuralNetworkModel[]
  onModelUpdate: (modelId: string, updates: Partial<NeuralNetworkModel>) => void
}

export function ModelTrainingPanel({ models, onModelUpdate }: ModelTrainingPanelProps) {
  const [selectedModelId, setSelectedModelId] = useState('')
  const [trainingConfig, setTrainingConfig] = useState({
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2,
    patience: 10
  })
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [trainingMetrics, setTrainingMetrics] = useState({
    loss: 0,
    accuracy: 0,
    valLoss: 0,
    valAccuracy: 0
  })

  const selectedModel = models.find(m => m.id === selectedModelId)

  const handleStartTraining = async () => {
    if (!selectedModel) return

    setIsTraining(true)
    setTrainingProgress(0)
    
    // Update model status
    onModelUpdate(selectedModelId, { status: 'training' })
    
    toast.loading('Starting neural network training...')

    try {
      // Generate training data
      const trainingData = generateTrainingData(5000)
      
      // Simulate training progress
      const trainingInterval = setInterval(() => {
        setTrainingProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 5, 100)
          
          // Update training metrics
          setTrainingMetrics({
            loss: Math.max(0.01, 2 * Math.exp(-newProgress / 30) + Math.random() * 0.1),
            accuracy: Math.min(0.95, 0.5 + (newProgress / 100) * 0.4 + Math.random() * 0.05),
            valLoss: Math.max(0.015, 2.2 * Math.exp(-newProgress / 35) + Math.random() * 0.12),
            valAccuracy: Math.min(0.92, 0.45 + (newProgress / 100) * 0.42 + Math.random() * 0.06)
          })
          
          if (newProgress >= 100) {
            clearInterval(trainingInterval)
            
            // Update model with new performance
            const newAccuracy = 0.75 + Math.random() * 0.15
            onModelUpdate(selectedModelId, {
              status: 'ready',
              accuracy: newAccuracy,
              lastTrained: new Date(),
              performance: {
                ...selectedModel.performance,
                accuracy: newAccuracy,
                precision: newAccuracy + Math.random() * 0.05,
                recall: newAccuracy - Math.random() * 0.03,
                f1Score: newAccuracy + (Math.random() - 0.5) * 0.02,
                mse: Math.random() * 0.001 + 0.001,
                mae: Math.random() * 0.01 + 0.02,
                sharpeRatio: 1 + Math.random() * 0.8,
                maxDrawdown: Math.random() * 0.05 + 0.03,
                winRate: 0.5 + Math.random() * 0.3
              }
            })
            
            setIsTraining(false)
            toast.success('Model training completed successfully!')
          }
          
          return newProgress
        })
      }, 200)
      
    } catch (error) {
      toast.error('Training failed')
      onModelUpdate(selectedModelId, { status: 'error' })
      setIsTraining(false)
    }
  }

  const handleStopTraining = () => {
    setIsTraining(false)
    onModelUpdate(selectedModelId, { status: 'ready' })
    toast.info('Training stopped')
  }

  const handleExportModel = () => {
    if (!selectedModel) return
    
    const modelConfig = {
      model: selectedModel,
      trainingConfig,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(modelConfig, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedModel.name}-${Date.now()}.json`
    a.click()
    
    URL.revokeObjectURL(url)
    toast.success('Model exported successfully')
  }

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Model Training Center
          </CardTitle>
          <CardDescription>
            Train and optimize neural network models for trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Model</Label>
              <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a model to train" />
                </SelectTrigger>
                <SelectContent>
                  {models.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        {model.name}
                        <Badge variant={model.status === 'ready' ? 'default' : 'secondary'}>
                          {model.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedModel && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">
                    {(selectedModel.accuracy * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Current Accuracy</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">
                    {selectedModel.architecture.parameters.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Parameters</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">
                    {selectedModel.lastTrained.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Last Trained</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">
                    {(selectedModel.performance.sharpeRatio).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Training Configuration */}
      {selectedModel && (
        <Tabs defaultValue="hyperparameters" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hyperparameters">Hyperparameters</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="export">Export/Import</TabsTrigger>
          </TabsList>

          <TabsContent value="hyperparameters">
            <Card>
              <CardHeader>
                <CardTitle>Training Configuration</CardTitle>
                <CardDescription>
                  Adjust hyperparameters for optimal model performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Epochs: {trainingConfig.epochs}</Label>
                    <Slider
                      value={[trainingConfig.epochs]}
                      onValueChange={([value]) => 
                        setTrainingConfig(prev => ({ ...prev, epochs: value }))
                      }
                      min={10}
                      max={500}
                      step={10}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Batch Size: {trainingConfig.batchSize}</Label>
                    <Slider
                      value={[trainingConfig.batchSize]}
                      onValueChange={([value]) =>
                        setTrainingConfig(prev => ({ ...prev, batchSize: value }))
                      }
                      min={8}
                      max={128}
                      step={8}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Learning Rate</Label>
                    <Input
                      type="number"
                      value={trainingConfig.learningRate}
                      onChange={(e) =>
                        setTrainingConfig(prev => ({
                          ...prev,
                          learningRate: parseFloat(e.target.value) || 0.001
                        }))
                      }
                      step="0.0001"
                      min="0.0001"
                      max="0.1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Validation Split: {(trainingConfig.validationSplit * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[trainingConfig.validationSplit * 100]}
                      onValueChange={([value]) =>
                        setTrainingConfig(prev => ({ ...prev, validationSplit: value / 100 }))
                      }
                      min={10}
                      max={30}
                      step={5}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle>Training Progress</CardTitle>
                <CardDescription>
                  Monitor real-time training metrics and progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  {!isTraining ? (
                    <Button onClick={handleStartTraining} className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Start Training
                    </Button>
                  ) : (
                    <Button onClick={handleStopTraining} variant="destructive" className="flex-1">
                      <Pause className="h-4 w-4 mr-2" />
                      Stop Training
                    </Button>
                  )}
                </div>

                {isTraining && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Training Progress</span>
                        <span>{trainingProgress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${trainingProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-mono">
                          {trainingMetrics.loss.toFixed(4)}
                        </div>
                        <div className="text-sm text-muted-foreground">Training Loss</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-mono">
                          {(trainingMetrics.accuracy * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Training Acc</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-mono">
                          {trainingMetrics.valLoss.toFixed(4)}
                        </div>
                        <div className="text-sm text-muted-foreground">Val Loss</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-mono">
                          {(trainingMetrics.valAccuracy * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Val Acc</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>Model Management</CardTitle>
                <CardDescription>
                  Export trained models or import existing configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleExportModel} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Model
                  </Button>
                  <Button variant="outline" className="flex-1" disabled>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Model
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Export includes model architecture, trained weights (simulated), 
                  and training configuration for backup or deployment.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}