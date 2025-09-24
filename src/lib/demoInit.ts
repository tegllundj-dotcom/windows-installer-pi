import { marketDataService } from '@/lib/marketDataService'
import { realTimeAnalysisService } from '@/lib/realtimeAnalysis'

// Demo initialization function
export async function initializeRealTimeDemo() {
  try {
    console.log('🚀 Initializing Real-Time AI Trading Demo...')
    
    // Connect to market data service
    console.log('📡 Connecting to market data service...')
    await marketDataService.connect()
    
    // Start analysis for demo symbols
    const demoSymbols = ['BTCUSD', 'ETHUSD']
    
    for (const symbol of demoSymbols) {
      console.log(`🧠 Starting neural network analysis for ${symbol}...`)
      await realTimeAnalysisService.startAnalysis({
        symbol,
        updateInterval: 1000,
        lookbackPeriod: 60,
        enablePatternDetection: true,
        enableSentimentAnalysis: true,
        enableVolatilityPrediction: true,
        models: ['lstm-1', 'cnn-1', 'transformer-1'],
        minConfidence: 0.6
      })
    }
    
    console.log('✅ Real-time AI trading demo initialized successfully!')
    console.log('📊 Market data is now streaming with live neural network analysis')
    
    // Log status every 30 seconds
    setInterval(() => {
      const status = realTimeAnalysisService.getAnalysisStatus()
      console.log(`📈 Status: ${status.active} active analyses, ${status.totalPredictions} total predictions`)
    }, 30000)
    
    return true
  } catch (error) {
    console.error('❌ Failed to initialize real-time demo:', error)
    return false
  }
}

// Auto-initialize when this module is loaded
if (typeof window !== 'undefined') {
  // Wait a moment for other components to load
  setTimeout(() => {
    initializeRealTimeDemo()
  }, 1000)
}