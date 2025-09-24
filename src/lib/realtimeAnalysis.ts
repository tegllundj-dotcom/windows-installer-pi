import { marketDataService, type MarketData, type TechnicalIndicators } from './marketDataService'
import { 
  LSTMModel, 
  CNNPatternModel, 
  TransformerModel, 
  type MarketPrediction, 
  type DetectedPattern,
  type NeuralNetworkModel,
  type PatternRecognitionResult 
} from './neuralNetwork'

export interface RealTimeAnalysis {
  id: string
  symbol: string
  timestamp: Date
  predictions: MarketPrediction[]
  patterns: DetectedPattern[]
  confidence: number
  sentiment: 'bullish' | 'bearish' | 'neutral'
  volatilityIndex: number
  trendStrength: number
  riskLevel: 'low' | 'medium' | 'high'
  tradingSignals: TradingSignal[]
  modelPerformance: ModelMetrics
}

export interface TradingSignal {
  type: 'entry' | 'exit' | 'stop_loss' | 'take_profit'
  action: 'buy' | 'sell' | 'hold'
  strength: number // 0-1
  price: number
  timestamp: Date
  reasoning: string
  confidence: number
  timeframe: string
}

export interface ModelMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  recentPerformance: number // Performance over last 24h
  predictionLatency: number // ms
  dataQuality: number // 0-1
}

export interface AnalysisConfig {
  symbol: string
  updateInterval: number // milliseconds
  lookbackPeriod: number // number of data points
  enablePatternDetection: boolean
  enableSentimentAnalysis: boolean
  enableVolatilityPrediction: boolean
  models: string[] // model IDs to use
  minConfidence: number
}

class RealTimeAnalysisService {
  private analyses: Map<string, RealTimeAnalysis> = new Map()
  private subscriptions: Map<string, string[]> = new Map() // symbol -> subscription IDs
  private models: Map<string, any> = new Map()
  private analysisConfig: Map<string, AnalysisConfig> = new Map()
  private isRunning: boolean = false
  private analysisQueue: Array<{ symbol: string; data: MarketData }> = []
  private performanceHistory: Map<string, number[]> = new Map()

  constructor() {
    this.initializeModels()
  }

  private initializeModels() {
    // Initialize neural network models
    this.models.set('lstm-1', new LSTMModel({
      name: 'LSTM Primary Predictor',
      accuracy: 0.78
    }))
    
    this.models.set('cnn-1', new CNNPatternModel({
      name: 'CNN Pattern Recognition',
      accuracy: 0.84
    }))
    
    this.models.set('transformer-1', new TransformerModel({
      name: 'Transformer Market Analysis',
      accuracy: 0.81
    }))

    console.log('Neural network models initialized')
  }

  async startAnalysis(config: AnalysisConfig): Promise<string> {
    const analysisId = crypto.randomUUID()
    this.analysisConfig.set(config.symbol, config)

    // Subscribe to market data
    const priceSubscriptionId = marketDataService.subscribe(
      config.symbol,
      'price',
      (data: MarketData) => this.handleMarketData(config.symbol, data)
    )

    const indicatorSubscriptionId = marketDataService.subscribe(
      config.symbol,
      'indicators',
      (data: TechnicalIndicators) => this.handleIndicatorData(config.symbol, data)
    )

    // Store subscription IDs
    this.subscriptions.set(config.symbol, [priceSubscriptionId, indicatorSubscriptionId])

    // Connect to market data service if not already connected
    if (!marketDataService.getConnectionStatus()) {
      await marketDataService.connect()
    }

    this.isRunning = true
    this.startAnalysisLoop()

    console.log(`Started real-time analysis for ${config.symbol}`)
    return analysisId
  }

  stopAnalysis(symbol: string) {
    // Unsubscribe from market data
    const subscriptionIds = this.subscriptions.get(symbol)
    if (subscriptionIds) {
      subscriptionIds.forEach(id => marketDataService.unsubscribe(id))
      this.subscriptions.delete(symbol)
    }

    // Remove configuration
    this.analysisConfig.delete(symbol)
    this.analyses.delete(symbol)

    console.log(`Stopped real-time analysis for ${symbol}`)
  }

  private handleMarketData(symbol: string, data: MarketData) {
    // Add to analysis queue for processing
    this.analysisQueue.push({ symbol, data })
  }

  private handleIndicatorData(symbol: string, data: TechnicalIndicators) {
    // Update technical indicator data
    const currentAnalysis = this.analyses.get(symbol)
    if (currentAnalysis) {
      // Trigger re-analysis with updated indicators
      this.queueAnalysis(symbol)
    }
  }

  private startAnalysisLoop() {
    if (!this.isRunning) return

    setInterval(async () => {
      await this.processAnalysisQueue()
    }, 1000) // Process every second

    setInterval(() => {
      this.updatePerformanceMetrics()
    }, 60000) // Update performance every minute
  }

  private async processAnalysisQueue() {
    if (this.analysisQueue.length === 0) return

    // Group by symbol and take latest data point for each
    const latestData = new Map<string, MarketData>()
    
    while (this.analysisQueue.length > 0) {
      const { symbol, data } = this.analysisQueue.shift()!
      latestData.set(symbol, data)
    }

    // Process each symbol
    for (const [symbol, marketData] of latestData) {
      try {
        await this.performAnalysis(symbol, marketData)
      } catch (error) {
        console.error(`Analysis error for ${symbol}:`, error)
      }
    }
  }

  private async performAnalysis(symbol: string, marketData: MarketData): Promise<void> {
    const config = this.analysisConfig.get(symbol)
    if (!config) return

    const startTime = performance.now()

    // Prepare feature data for neural networks
    const featureData = marketDataService.prepareFeatureData(symbol, config.lookbackPeriod)
    if (featureData.length === 0) return

    // Run predictions using configured models
    const predictions: MarketPrediction[] = []
    const patterns: DetectedPattern[] = []
    
    for (const modelId of config.models) {
      const model = this.models.get(modelId)
      if (!model) continue

      try {
        if (model instanceof LSTMModel) {
          const modelPredictions = await model.predict(featureData)
          predictions.push(...modelPredictions)
        } else if (model instanceof CNNPatternModel && config.enablePatternDetection) {
          const detectedPatterns = await model.detectPatterns(featureData)
          patterns.push(...detectedPatterns)
        } else if (model instanceof TransformerModel) {
          const transformerPredictions = await model.analyzeMarket(featureData)
          predictions.push(...transformerPredictions)
        }
      } catch (error) {
        console.error(`Model ${modelId} analysis failed:`, error)
      }
    }

    // Calculate analysis metrics
    const confidence = this.calculateOverallConfidence(predictions)
    const sentiment = this.determineSentiment(predictions, marketData)
    const volatilityIndex = this.calculateVolatilityIndex(symbol)
    const trendStrength = this.calculateTrendStrength(symbol)
    const riskLevel = this.assessRiskLevel(volatilityIndex, confidence)
    const tradingSignals = await this.generateTradingSignals(symbol, predictions, patterns, marketData)

    const analysisLatency = performance.now() - startTime

    // Create analysis result
    const analysis: RealTimeAnalysis = {
      id: crypto.randomUUID(),
      symbol,
      timestamp: new Date(),
      predictions: predictions.filter(p => p.confidence >= config.minConfidence),
      patterns,
      confidence,
      sentiment,
      volatilityIndex,
      trendStrength,
      riskLevel,
      tradingSignals,
      modelPerformance: {
        accuracy: this.getAverageModelAccuracy(config.models),
        precision: this.getAverageModelPrecision(config.models),
        recall: this.getAverageModelRecall(config.models),
        f1Score: this.getAverageModelF1Score(config.models),
        recentPerformance: this.getRecentPerformance(symbol),
        predictionLatency: analysisLatency,
        dataQuality: this.assessDataQuality(featureData)
      }
    }

    // Store analysis
    this.analyses.set(symbol, analysis)

    // Update performance tracking
    this.trackPredictionPerformance(symbol, predictions, marketData)

    // Emit analysis update event (could be used by UI components)
    this.emitAnalysisUpdate(symbol, analysis)
  }

  private calculateOverallConfidence(predictions: MarketPrediction[]): number {
    if (predictions.length === 0) return 0
    
    const totalConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0)
    return totalConfidence / predictions.length
  }

  private determineSentiment(predictions: MarketPrediction[], marketData: MarketData): 'bullish' | 'bearish' | 'neutral' {
    if (predictions.length === 0) return 'neutral'

    let bullishScore = 0
    let bearishScore = 0

    predictions.forEach(p => {
      if (p.signal === 'buy') {
        bullishScore += p.confidence
      } else if (p.signal === 'sell') {
        bearishScore += p.confidence
      }
    })

    const sentimentScore = (bullishScore - bearishScore) / predictions.length
    
    if (sentimentScore > 0.1) return 'bullish'
    if (sentimentScore < -0.1) return 'bearish'
    return 'neutral'
  }

  private calculateVolatilityIndex(symbol: string): number {
    const priceHistory = marketDataService.getPriceHistory(symbol, 20)
    if (priceHistory.length < 2) return 0

    // Calculate standard deviation of returns
    const returns: number[] = []
    for (let i = 1; i < priceHistory.length; i++) {
      returns.push((priceHistory[i] - priceHistory[i - 1]) / priceHistory[i - 1])
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
    const stdDev = Math.sqrt(variance)

    // Normalize to 0-100 scale
    return Math.min(stdDev * 100, 100)
  }

  private calculateTrendStrength(symbol: string): number {
    const priceHistory = marketDataService.getPriceHistory(symbol, 20)
    if (priceHistory.length < 2) return 0

    const firstPrice = priceHistory[0]
    const lastPrice = priceHistory[priceHistory.length - 1]
    
    // Calculate linear regression slope
    const n = priceHistory.length
    const sumX = (n * (n - 1)) / 2
    const sumY = priceHistory.reduce((a, b) => a + b)
    const sumXY = priceHistory.reduce((sum, price, i) => sum + (i * price), 0)
    const sumX2 = priceHistory.reduce((sum, _, i) => sum + (i * i), 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    
    // Normalize slope to trend strength (0-1)
    return Math.min(Math.abs(slope) * 1000, 1)
  }

  private assessRiskLevel(volatilityIndex: number, confidence: number): 'low' | 'medium' | 'high' {
    const riskScore = volatilityIndex * (1 - confidence)
    
    if (riskScore < 20) return 'low'
    if (riskScore < 50) return 'medium'
    return 'high'
  }

  private async generateTradingSignals(
    symbol: string,
    predictions: MarketPrediction[],
    patterns: DetectedPattern[],
    marketData: MarketData
  ): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = []

    // Generate signals from predictions
    for (const prediction of predictions) {
      if (prediction.confidence < 0.7) continue

      const signal: TradingSignal = {
        type: 'entry',
        action: prediction.signal === 'buy' ? 'buy' : prediction.signal === 'sell' ? 'sell' : 'hold',
        strength: prediction.confidence,
        price: prediction.priceTarget,
        timestamp: new Date(),
        reasoning: `Neural network prediction with ${(prediction.confidence * 100).toFixed(1)}% confidence`,
        confidence: prediction.confidence,
        timeframe: `${prediction.timeHorizon}min`
      }

      signals.push(signal)

      // Generate stop-loss and take-profit signals
      if (signal.action !== 'hold') {
        const stopLossPrice = signal.action === 'buy' 
          ? marketData.price * 0.98 // 2% stop loss
          : marketData.price * 1.02

        const takeProfitPrice = signal.action === 'buy'
          ? marketData.price * 1.04 // 4% take profit
          : marketData.price * 0.96

        signals.push({
          type: 'stop_loss',
          action: signal.action === 'buy' ? 'sell' : 'buy',
          strength: 0.9,
          price: stopLossPrice,
          timestamp: new Date(),
          reasoning: 'Risk management stop-loss',
          confidence: 0.9,
          timeframe: signal.timeframe
        })

        signals.push({
          type: 'take_profit',
          action: signal.action === 'buy' ? 'sell' : 'buy',
          strength: 0.8,
          price: takeProfitPrice,
          timestamp: new Date(),
          reasoning: 'Profit-taking target',
          confidence: 0.8,
          timeframe: signal.timeframe
        })
      }
    }

    // Generate signals from pattern detection
    for (const pattern of patterns) {
      if (pattern.confidence < 0.75) continue

      let action: 'buy' | 'sell' | 'hold' = 'hold'
      let reasoning = ''

      switch (pattern.type) {
        case 'support':
          action = marketData.price <= pattern.priceLevel * 1.01 ? 'buy' : 'hold'
          reasoning = `Price approaching support level at ${pattern.priceLevel.toFixed(2)}`
          break
        case 'resistance':
          action = marketData.price >= pattern.priceLevel * 0.99 ? 'sell' : 'hold'
          reasoning = `Price approaching resistance level at ${pattern.priceLevel.toFixed(2)}`
          break
        case 'double_bottom':
          action = 'buy'
          reasoning = 'Double bottom pattern detected - bullish reversal signal'
          break
        case 'double_top':
          action = 'sell'
          reasoning = 'Double top pattern detected - bearish reversal signal'
          break
        case 'head_shoulders':
          action = 'sell'
          reasoning = 'Head and shoulders pattern - bearish reversal'
          break
      }

      if (action !== 'hold') {
        signals.push({
          type: 'entry',
          action,
          strength: pattern.confidence,
          price: marketData.price,
          timestamp: new Date(),
          reasoning,
          confidence: pattern.confidence,
          timeframe: '1h'
        })
      }
    }

    return signals.slice(0, 10) // Limit to top 10 signals
  }

  private getAverageModelAccuracy(modelIds: string[]): number {
    const accuracies = modelIds.map(id => {
      const model = this.models.get(id)
      return model ? model.getModel().accuracy : 0
    })
    return accuracies.reduce((a, b) => a + b, 0) / accuracies.length
  }

  private getAverageModelPrecision(modelIds: string[]): number {
    const precisions = modelIds.map(id => {
      const model = this.models.get(id)
      return model ? model.getModel().performance.precision : 0
    })
    return precisions.reduce((a, b) => a + b, 0) / precisions.length
  }

  private getAverageModelRecall(modelIds: string[]): number {
    const recalls = modelIds.map(id => {
      const model = this.models.get(id)
      return model ? model.getModel().performance.recall : 0
    })
    return recalls.reduce((a, b) => a + b, 0) / recalls.length
  }

  private getAverageModelF1Score(modelIds: string[]): number {
    const f1Scores = modelIds.map(id => {
      const model = this.models.get(id)
      return model ? model.getModel().performance.f1Score : 0
    })
    return f1Scores.reduce((a, b) => a + b, 0) / f1Scores.length
  }

  private getRecentPerformance(symbol: string): number {
    const history = this.performanceHistory.get(symbol) || []
    if (history.length === 0) return 0.5

    // Return average performance over last 24 data points
    const recentHistory = history.slice(-24)
    return recentHistory.reduce((a, b) => a + b, 0) / recentHistory.length
  }

  private assessDataQuality(featureData: number[][]): number {
    if (featureData.length === 0) return 0

    let quality = 1.0

    // Check for missing or invalid data
    const flatData: number[] = featureData.flat()
    const invalidCount = flatData.filter((val: number) => 
      isNaN(val) || !isFinite(val)
    ).length

    const totalDataPoints = flatData.length
    if (totalDataPoints > 0) {
      quality -= (invalidCount / totalDataPoints) * 0.5
    }

    // Check data freshness (simulated)
    const dataAge = Date.now() - Date.now() // Always fresh in simulation
    if (dataAge > 60000) { // Older than 1 minute
      quality *= 0.9
    }

    return Math.max(quality, 0)
  }

  private trackPredictionPerformance(symbol: string, predictions: MarketPrediction[], marketData: MarketData) {
    // This is a simplified performance tracking
    // In a real system, you would compare predictions with actual outcomes
    
    let performance = 0.5 // Neutral starting point
    
    predictions.forEach(prediction => {
      // Simulate performance based on prediction confidence and market movement
      const priceDirection = prediction.priceTarget > marketData.price ? 1 : -1
      const marketDirection = Math.random() > 0.5 ? 1 : -1 // Simulated market movement
      
      if (priceDirection === marketDirection) {
        performance += prediction.confidence * 0.1
      } else {
        performance -= prediction.confidence * 0.05
      }
    })

    performance = Math.max(0, Math.min(1, performance))

    // Update performance history
    const history = this.performanceHistory.get(symbol) || []
    history.push(performance)
    if (history.length > 100) history.shift() // Keep last 100 records
    this.performanceHistory.set(symbol, history)
  }

  private updatePerformanceMetrics() {
    // Update model performance metrics based on recent predictions
    // This would be more sophisticated in a real system
    console.log('Updating performance metrics...')
  }

  private emitAnalysisUpdate(symbol: string, analysis: RealTimeAnalysis) {
    // This could emit events for UI components to listen to
    // For now, we'll just log significant changes
    if (analysis.confidence > 0.8 || analysis.riskLevel === 'high') {
      console.log(`High confidence analysis for ${symbol}:`, {
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        riskLevel: analysis.riskLevel,
        signalCount: analysis.tradingSignals.length
      })
    }
  }

  private queueAnalysis(symbol: string) {
    const latestData = marketDataService.getLatestPrice(symbol)
    if (latestData) {
      this.analysisQueue.push({ symbol, data: latestData })
    }
  }

  // Public API methods
  getLatestAnalysis(symbol: string): RealTimeAnalysis | undefined {
    return this.analyses.get(symbol)
  }

  getAllAnalyses(): Map<string, RealTimeAnalysis> {
    return new Map(this.analyses)
  }

  getAvailableModels(): NeuralNetworkModel[] {
    return Array.from(this.models.values()).map(model => model.getModel())
  }

  updateAnalysisConfig(symbol: string, config: Partial<AnalysisConfig>) {
    const currentConfig = this.analysisConfig.get(symbol)
    if (currentConfig) {
      this.analysisConfig.set(symbol, { ...currentConfig, ...config })
    }
  }

  getPerformanceHistory(symbol: string): number[] {
    return this.performanceHistory.get(symbol) || []
  }

  isAnalysisActive(symbol: string): boolean {
    return this.analysisConfig.has(symbol) && this.subscriptions.has(symbol)
  }

  getAnalysisStatus(): { active: number; symbols: string[]; totalPredictions: number } {
    const activeSymbols = Array.from(this.analysisConfig.keys())
    const totalPredictions = Array.from(this.analyses.values())
      .reduce((sum, analysis) => sum + analysis.predictions.length, 0)

    return {
      active: activeSymbols.length,
      symbols: activeSymbols,
      totalPredictions
    }
  }

  shutdown() {
    // Clean shutdown
    this.isRunning = false
    
    // Stop all analyses
    Array.from(this.analysisConfig.keys()).forEach(symbol => {
      this.stopAnalysis(symbol)
    })

    console.log('Real-time analysis service shut down')
  }
}

// Export singleton instance
export const realTimeAnalysisService = new RealTimeAnalysisService()
export default realTimeAnalysisService