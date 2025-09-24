import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendUp, TrendDown, Target, Shield } from '@phosphor-icons/react'
import { BacktestResult } from '@/lib/tradingStrategy'
import { StrategyConfig } from '@/lib/tradingStrategy'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts'

interface BacktestResultsProps {
  results: Record<string, BacktestResult>
  strategies: StrategyConfig[]
}

export function BacktestResults({ results, strategies }: BacktestResultsProps) {
  const [selectedResult, setSelectedResult] = useState<string | null>(null)

  const resultsList = Object.values(results || {})

  if (resultsList.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Backtest Results</h3>
          <p className="text-muted-foreground mb-4">
            Run backtests on your strategies to see performance analysis here
          </p>
          <Button variant="outline">Run Your First Backtest</Button>
        </CardContent>
      </Card>
    )
  }

  const selectedResultData = selectedResult ? results[selectedResult] : null

  return (
    <div className="space-y-6">
      {/* Results Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {resultsList.map((result) => {
          const strategy = strategies.find(s => s.id === result.strategyId)
          return (
            <Card 
              key={result.strategyId}
              className={`cursor-pointer transition-all ${
                selectedResult === result.strategyId 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:border-border'
              }`}
              onClick={() => setSelectedResult(result.strategyId)}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {strategy?.name || result.strategyId}
                    </Badge>
                    {result.totalReturnPercent >= 0 ? (
                      <TrendUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Total Return</p>
                    <p className={`font-semibold ${
                      result.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.totalReturnPercent >= 0 ? '+' : ''}
                      {result.totalReturnPercent.toFixed(2)}%
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Trades</p>
                      <p className="font-medium">{result.totalTrades}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Win Rate</p>
                      <p className="font-medium">{result.winRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Results */}
      {selectedResultData && (
        <Card>
          <CardHeader>
            <CardTitle>
              Detailed Analysis: {strategies.find(s => s.id === selectedResultData.strategyId)?.name}
            </CardTitle>
            <CardDescription>
              Backtest period: {new Date(selectedResultData.startDate).toLocaleDateString()} - {new Date(selectedResultData.endDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="summary" className="space-y-4">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="equity">Equity Curve</TabsTrigger>
                <TabsTrigger value="trades">Trade History</TabsTrigger>
                <TabsTrigger value="metrics">Risk Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      ${selectedResultData.finalCapital.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Final Capital</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <p className={`text-2xl font-bold ${
                      selectedResultData.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedResultData.totalReturnPercent >= 0 ? '+' : ''}
                      {selectedResultData.totalReturnPercent.toFixed(2)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Total Return</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">
                      {selectedResultData.winRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">
                      {selectedResultData.sharpeRatio.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                  </div>
                </div>

                {/* Trade Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Trade Statistics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Trades:</span>
                        <span className="font-medium">{selectedResultData.totalTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Winning Trades:</span>
                        <span className="font-medium text-green-600">{selectedResultData.winningTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Losing Trades:</span>
                        <span className="font-medium text-red-600">{selectedResultData.losingTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit Factor:</span>
                        <span className="font-medium">{selectedResultData.profitFactor.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Risk Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Drawdown:</span>
                        <span className="font-medium text-red-600">
                          {selectedResultData.maxDrawdownPercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average Win:</span>
                        <span className="font-medium text-green-600">
                          ${selectedResultData.avgWin.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average Loss:</span>
                        <span className="font-medium text-red-600">
                          ${selectedResultData.avgLoss.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Largest Win:</span>
                        <span className="font-medium text-green-600">
                          ${selectedResultData.largestWin.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="equity" className="space-y-4">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={selectedResultData.equity.map(e => ({
                        date: new Date(e.date).toLocaleDateString(),
                        equity: e.equity,
                        drawdown: -e.drawdown * selectedResultData.initialCapital / 100
                      }))}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="equity"
                        stroke="#22c55e"
                        strokeWidth={2}
                        name="Portfolio Value"
                        dot={false}
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="drawdown"
                        fill="#ef4444"
                        stroke="#ef4444"
                        name="Drawdown"
                        fillOpacity={0.3}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="trades">
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entry Date</TableHead>
                        <TableHead>Exit Date</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Entry Price</TableHead>
                        <TableHead>Exit Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>P&L</TableHead>
                        <TableHead>P&L %</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedResultData.trades.slice(0, 20).map((trade, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(trade.entryDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(trade.exitDate).toLocaleDateString()}</TableCell>
                          <TableCell>{trade.symbol}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {trade.type}
                            </Badge>
                          </TableCell>
                          <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                          <TableCell>${trade.exitPrice.toFixed(2)}</TableCell>
                          <TableCell>{trade.quantity}</TableCell>
                          <TableCell className={trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </TableCell>
                          <TableCell className={trade.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {trade.reason}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {selectedResultData.trades.length > 20 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Showing first 20 trades of {selectedResultData.trades.length} total
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="metrics">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Risk Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Maximum Drawdown:</span>
                          <span className="font-medium text-red-600">
                            {selectedResultData.maxDrawdownPercent.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sharpe Ratio:</span>
                          <span className="font-medium">{selectedResultData.sharpeRatio.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profit Factor:</span>
                          <span className="font-medium">{selectedResultData.profitFactor.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Win/Loss Ratio:</span>
                          <span className="font-medium">
                            {selectedResultData.losingTrades > 0 
                              ? (selectedResultData.avgWin / selectedResultData.avgLoss).toFixed(2)
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Return:</span>
                          <span className={`font-medium ${
                            selectedResultData.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${selectedResultData.totalReturn.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annualized Return:</span>
                          <span className="font-medium">
                            {(selectedResultData.totalReturnPercent * 365 / 
                              ((new Date(selectedResultData.endDate).getTime() - new Date(selectedResultData.startDate).getTime()) / (1000 * 60 * 60 * 24))
                            ).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Best Trade:</span>
                          <span className="font-medium text-green-600">
                            ${selectedResultData.largestWin.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Worst Trade:</span>
                          <span className="font-medium text-red-600">
                            -${selectedResultData.largestLoss.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}