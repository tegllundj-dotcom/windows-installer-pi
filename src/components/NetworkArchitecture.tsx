import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendUp, Activity, Lightning } from '@phosphor-icons/react'
import { NeuralNetworkModel } from '@/lib/neuralNetwork'

interface NetworkArchitectureProps {
  model: NeuralNetworkModel
}

export function NetworkArchitecture({ model }: NetworkArchitectureProps) {
  const getLayerIcon = (layerType: string) => {
    switch (layerType.toLowerCase()) {
      case 'lstm': return <Activity className="h-4 w-4" />
      case 'conv1d': return <Brain className="h-4 w-4" />
      case 'multiheadattention': return <Lightning className="h-4 w-4" />
      case 'dense': return <TrendUp className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const getLayerColor = (layerType: string) => {
    switch (layerType.toLowerCase()) {
      case 'lstm': return 'bg-blue-500'
      case 'conv1d': return 'bg-green-500'
      case 'multiheadattention': return 'bg-purple-500'
      case 'dense': return 'bg-orange-500'
      case 'dropout': return 'bg-red-500'
      case 'flatten': return 'bg-gray-500'
      case 'maxpooling1d': return 'bg-cyan-500'
      case 'layernormalization': return 'bg-pink-500'
      case 'feedforward': return 'bg-yellow-500'
      case 'globalaveragepooling1d': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  const getConnectionStrength = (index: number, total: number) => {
    // Simulate connection strength based on layer position
    const position = index / (total - 1)
    return Math.sin(position * Math.PI) * 0.8 + 0.2
  }

  return (
    <div className="space-y-6">
      {/* Model Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {model.name} Architecture
          </CardTitle>
          <CardDescription>
            {model.type} neural network with {model.architecture.parameters.toLocaleString()} parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{model.architecture.layers.length}</div>
              <div className="text-sm text-muted-foreground">Layers</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{model.architecture.parameters.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Parameters</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{model.architecture.optimizer}</div>
              <div className="text-sm text-muted-foreground">Optimizer</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{(model.accuracy * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Network Structure</CardTitle>
          <CardDescription>Visual representation of the neural network layers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Input Layer */}
            <div className="mb-8">
              <div className="text-center mb-2">
                <Badge variant="secondary">Input</Badge>
              </div>
              <div className="flex justify-center">
                <div className="bg-primary rounded-lg p-4 text-primary-foreground">
                  <div className="text-sm font-medium">Input Shape</div>
                  <div className="text-xs">
                    [{model.architecture.inputShape.join(' × ')}]
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden Layers */}
            <div className="space-y-6">
              {model.architecture.layers.map((layer, index) => (
                <div key={index} className="relative">
                  {/* Connection Line */}
                  {index > 0 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="w-px h-6 bg-border"></div>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <div className="relative bg-card border rounded-lg p-4 min-w-[200px]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getLayerColor(layer.type)}`} />
                        <div className="flex items-center gap-2">
                          {getLayerIcon(layer.type)}
                          <span className="font-medium">{layer.type}</span>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          Layer {index + 1}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {layer.units && (
                          <div>Units: <span className="font-medium">{layer.units}</span></div>
                        )}
                        {layer.activation && (
                          <div>Activation: <span className="font-medium">{layer.activation}</span></div>
                        )}
                        {layer.dropoutRate && (
                          <div>Dropout: <span className="font-medium">{layer.dropoutRate}</span></div>
                        )}
                        {layer.filters && (
                          <div>Filters: <span className="font-medium">{layer.filters}</span></div>
                        )}
                        {layer.kernelSize && (
                          <div>Kernel: <span className="font-medium">[{layer.kernelSize.join('×')}]</span></div>
                        )}
                      </div>
                      
                      {/* Connection Strength Indicator */}
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-1">Connection Strength</div>
                        <Progress value={getConnectionStrength(index, model.architecture.layers.length) * 100} className="h-1" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Output Layer */}
            <div className="mt-8">
              <div className="flex justify-center mb-2">
                <div className="w-px h-6 bg-border"></div>
              </div>
              <div className="text-center mb-2">
                <Badge variant="secondary">Output</Badge>
              </div>
              <div className="flex justify-center">
                <div className="bg-accent rounded-lg p-4 text-accent-foreground">
                  <div className="text-sm font-medium">Output Shape</div>
                  <div className="text-xs">
                    [{model.architecture.outputShape.join(' × ')}]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Analysis</CardTitle>
          <CardDescription>Detailed metrics showing model effectiveness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Classification Metrics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Classification Metrics</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Precision</span>
                    <span className="font-mono">{(model.performance.precision * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={model.performance.precision * 100} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Recall</span>
                    <span className="font-mono">{(model.performance.recall * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={model.performance.recall * 100} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>F1 Score</span>
                    <span className="font-mono">{model.performance.f1Score.toFixed(3)}</span>
                  </div>
                  <Progress value={model.performance.f1Score * 100} />
                </div>
              </div>
            </div>

            {/* Trading Metrics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Trading Performance</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Win Rate</span>
                    <span className="font-mono">{(model.performance.winRate * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={model.performance.winRate * 100} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sharpe Ratio</span>
                    <span className="font-mono">{model.performance.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <Progress value={Math.min(model.performance.sharpeRatio * 33.33, 100)} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Max Drawdown</span>
                    <span className="font-mono text-red-600">
                      -{(model.performance.maxDrawdown * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={100 - (model.performance.maxDrawdown * 100)} 
                    className="[&>div]:bg-red-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}