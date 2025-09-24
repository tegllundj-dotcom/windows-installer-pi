import { useState, useEffect, useCallback } from 'react'
import { realTimeAnalysisService, type RealTimeAnalysis, type AnalysisConfig, type TradingSignal } from '@/lib/realtimeAnalysis'
import { marketDataService, type MarketData } from '@/lib/marketDataService'

export interface UseRealTimeAnalysisOptions {
  symbol: string
  autoStart?: boolean
  updateInterval?: number
  lookbackPeriod?: number
  enablePatternDetection?: boolean
  enableSentimentAnalysis?: boolean
  enableVolatilityPrediction?: boolean
  models?: string[]
  minConfidence?: number
}

export interface RealTimeAnalysisState {
  analysis: RealTimeAnalysis | null
  marketData: MarketData | null
  isActive: boolean
  isConnected: boolean
  error: string | null
  loading: boolean
}

export interface RealTimeAnalysisActions {
  startAnalysis: () => Promise<void>
  stopAnalysis: () => void
  updateConfig: (config: Partial<AnalysisConfig>) => void
  reconnect: () => Promise<void>
  getSignals: (type?: TradingSignal['type']) => TradingSignal[]
  getHighConfidenceSignals: (minConfidence?: number) => TradingSignal[]
}

export function useRealTimeAnalysis(
  options: UseRealTimeAnalysisOptions
): [RealTimeAnalysisState, RealTimeAnalysisActions] {
  const {
    symbol,
    autoStart = false,
    updateInterval = 1000,
    lookbackPeriod = 60,
    enablePatternDetection = true,
    enableSentimentAnalysis = true,
    enableVolatilityPrediction = true,
    models = ['lstm-1', 'cnn-1', 'transformer-1'],
    minConfidence = 0.6
  } = options

  const [state, setState] = useState<RealTimeAnalysisState>({
    analysis: null,
    marketData: null,
    isActive: false,
    isConnected: false,
    error: null,
    loading: false
  })

  // Subscribe to analysis updates
  useEffect(() => {
    let analysisInterval: NodeJS.Timeout | null = null
    let marketDataSubscriptionId: string | null = null

    const updateAnalysis = () => {
      const analysis = realTimeAnalysisService.getLatestAnalysis(symbol)
      const marketData = marketDataService.getLatestPrice(symbol)
      const isActive = realTimeAnalysisService.isAnalysisActive(symbol)
      const isConnected = marketDataService.getConnectionStatus()

      setState(prev => ({
        ...prev,
        analysis: analysis || null,
        marketData: marketData || null,
        isActive,
        isConnected,
        loading: false,
        error: null
      }))
    }

    if (state.isActive) {
      // Subscribe to market data updates
      marketDataSubscriptionId = marketDataService.subscribe(
        symbol,
        'price',
        updateAnalysis
      )

      // Set up polling for analysis updates
      analysisInterval = setInterval(updateAnalysis, updateInterval)
      
      // Initial update
      updateAnalysis()
    }

    return () => {
      if (analysisInterval) {
        clearInterval(analysisInterval)
      }
      if (marketDataSubscriptionId) {
        marketDataService.unsubscribe(marketDataSubscriptionId)
      }
    }
  }, [symbol, state.isActive, updateInterval])

  const startAnalysis = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const config: AnalysisConfig = {
        symbol,
        updateInterval,
        lookbackPeriod,
        enablePatternDetection,
        enableSentimentAnalysis,
        enableVolatilityPrediction,
        models,
        minConfidence
      }

      await realTimeAnalysisService.startAnalysis(config)
      
      setState(prev => ({
        ...prev,
        isActive: true,
        loading: false,
        error: null
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to start analysis'
      }))
    }
  }, [
    symbol,
    updateInterval,
    lookbackPeriod,
    enablePatternDetection,
    enableSentimentAnalysis,
    enableVolatilityPrediction,
    models,
    minConfidence
  ])

  const stopAnalysis = useCallback(() => {
    realTimeAnalysisService.stopAnalysis(symbol)
    setState(prev => ({
      ...prev,
      isActive: false,
      analysis: null,
      loading: false
    }))
  }, [symbol])

  const updateConfig = useCallback((configUpdate: Partial<AnalysisConfig>) => {
    realTimeAnalysisService.updateAnalysisConfig(symbol, configUpdate)
  }, [symbol])

  const reconnect = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      await marketDataService.connect()
      setState(prev => ({ ...prev, isConnected: true, loading: false }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to reconnect'
      }))
    }
  }, [])

  const getSignals = useCallback((type?: TradingSignal['type']): TradingSignal[] => {
    if (!state.analysis) return []
    
    const signals = state.analysis.tradingSignals
    return type ? signals.filter(signal => signal.type === type) : signals
  }, [state.analysis])

  const getHighConfidenceSignals = useCallback((minConf = 0.8): TradingSignal[] => {
    if (!state.analysis) return []
    
    return state.analysis.tradingSignals.filter(signal => signal.confidence >= minConf)
  }, [state.analysis])

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !state.isActive && !state.loading) {
      startAnalysis()
    }
  }, [autoStart, state.isActive, state.loading, startAnalysis])

  const actions: RealTimeAnalysisActions = {
    startAnalysis,
    stopAnalysis,
    updateConfig,
    reconnect,
    getSignals,
    getHighConfidenceSignals
  }

  return [state, actions]
}

// Hook for managing multiple symbol analyses
export function useMultiSymbolAnalysis(symbols: string[], options?: Omit<UseRealTimeAnalysisOptions, 'symbol'>) {
  const [analyses, setAnalyses] = useState<Map<string, RealTimeAnalysis>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Map<string, string>>(new Map())

  const startAllAnalyses = useCallback(async () => {
    setIsLoading(true)
    setErrors(new Map())

    const promises = symbols.map(async symbol => {
      try {
        const config: AnalysisConfig = {
          symbol,
          updateInterval: options?.updateInterval || 1000,
          lookbackPeriod: options?.lookbackPeriod || 60,
          enablePatternDetection: options?.enablePatternDetection ?? true,
          enableSentimentAnalysis: options?.enableSentimentAnalysis ?? true,
          enableVolatilityPrediction: options?.enableVolatilityPrediction ?? true,
          models: options?.models || ['lstm-1', 'cnn-1', 'transformer-1'],
          minConfidence: options?.minConfidence || 0.6
        }

        await realTimeAnalysisService.startAnalysis(config)
      } catch (error) {
        setErrors(prev => new Map(prev.set(symbol, 
          error instanceof Error ? error.message : 'Analysis failed'
        )))
      }
    })

    await Promise.allSettled(promises)
    setIsLoading(false)
  }, [symbols, options])

  const stopAllAnalyses = useCallback(() => {
    symbols.forEach(symbol => {
      realTimeAnalysisService.stopAnalysis(symbol)
    })
    setAnalyses(new Map())
  }, [symbols])

  const updateAnalyses = useCallback(() => {
    const newAnalyses = new Map<string, RealTimeAnalysis>()
    
    symbols.forEach(symbol => {
      const analysis = realTimeAnalysisService.getLatestAnalysis(symbol)
      if (analysis) {
        newAnalyses.set(symbol, analysis)
      }
    })

    setAnalyses(newAnalyses)
  }, [symbols])

  // Update analyses periodically
  useEffect(() => {
    const interval = setInterval(updateAnalyses, 2000)
    return () => clearInterval(interval)
  }, [updateAnalyses])

  return {
    analyses,
    isLoading,
    errors,
    startAllAnalyses,
    stopAllAnalyses,
    updateAnalyses
  }
}

// Hook for market data only (without analysis)
export function useMarketData(symbol: string) {
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let subscriptionId: string | null = null

    const connect = async () => {
      try {
        if (!marketDataService.getConnectionStatus()) {
          await marketDataService.connect()
        }

        subscriptionId = marketDataService.subscribe(
          symbol,
          'price',
          (data: MarketData) => {
            setMarketData(data)
            setError(null)
          }
        )

        setIsConnected(true)

        // Get initial data
        const initialData = marketDataService.getLatestPrice(symbol)
        if (initialData) {
          setMarketData(initialData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection failed')
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      if (subscriptionId) {
        marketDataService.unsubscribe(subscriptionId)
      }
    }
  }, [symbol])

  const reconnect = useCallback(async () => {
    setError(null)
    try {
      await marketDataService.connect()
      setIsConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reconnection failed')
      setIsConnected(false)
    }
  }, [])

  return {
    marketData,
    isConnected,
    error,
    reconnect,
    priceHistory: marketDataService.getPriceHistory(symbol),
    connectionStatus: marketDataService.getConnectionStatus()
  }
}

// Hook for neural network model management
export function useNeuralNetworkModels() {
  const [models, setModels] = useState(realTimeAnalysisService.getAvailableModels())
  const [isLoading, setIsLoading] = useState(false)

  const refreshModels = useCallback(() => {
    setModels(realTimeAnalysisService.getAvailableModels())
  }, [])

  const getModelPerformance = useCallback((modelId: string) => {
    const model = models.find(m => m.id === modelId)
    return model?.performance || null
  }, [models])

  const getBestPerformingModel = useCallback(() => {
    if (models.length === 0) return null
    
    return models.reduce((best, current) => 
      current.performance.f1Score > best.performance.f1Score ? current : best
    )
  }, [models])

  return {
    models,
    isLoading,
    refreshModels,
    getModelPerformance,
    getBestPerformingModel,
    modelCount: models.length,
    averageAccuracy: models.reduce((sum, m) => sum + m.accuracy, 0) / models.length
  }
}