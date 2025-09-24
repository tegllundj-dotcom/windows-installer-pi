import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendUp, TrendDown, Activity, CurrencyDollar, ChartBar } from "@phosphor-icons/react"
import { Portfolio, Trade, Position } from "@/lib/mockData"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { TradeDialog } from "@/components/TradeDialog"
import { PortfolioChart } from "@/components/PortfolioChart"

interface TradingDashboardProps {
  portfolio: Portfolio
  trades: Trade[]
  positions: Position[]
  onUpdatePortfolio: (portfolio: Portfolio) => void
  onUpdateTrades: (trades: Trade[]) => void
  onUpdatePositions: (positions: Position[]) => void
}

export function TradingDashboard({
  portfolio,
  trades,
  positions,
  onUpdatePortfolio,
  onUpdateTrades,
  onUpdatePositions
}: TradingDashboardProps) {

  const totalPositionValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Auto-Trading Dashboard</h1>
            <p className="text-muted-foreground">Real-time portfolio management and trading</p>
          </div>
          <div className="flex gap-2">
            <TradeDialog 
              positions={positions}
              onTradeComplete={(newTrade) => {
                onUpdateTrades([...trades, newTrade])
              }}
            />
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
              <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{formatCurrency(portfolio.totalValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{formatPercent(portfolio.totalGainLossPercent)} all time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
              {portfolio.dailyPL >= 0 ? 
                <TrendUp className="h-4 w-4 text-green-600" /> :
                <TrendDown className="h-4 w-4 text-red-600" />
              }
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${portfolio.dailyPL >= 0 ? 'profit' : 'loss'}`}>
                {formatCurrency(portfolio.dailyPL)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatPercent(portfolio.dailyPLPercent)} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Cash</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{formatCurrency(portfolio.availableCash)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for trading
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
              <ChartBar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{positions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(totalPositionValue)} total value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="positions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="trades">Recent Trades</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">Market Value</TableHead>
                      <TableHead className="text-right">Gain/Loss</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => (
                      <TableRow key={position.symbol}>
                        <TableCell className="font-medium">{position.symbol}</TableCell>
                        <TableCell className="text-right font-mono">{position.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(position.avgPrice)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(position.currentPrice)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(position.marketValue)}</TableCell>
                        <TableCell className={`text-right font-mono ${position.gainLoss >= 0 ? 'profit' : 'loss'}`}>
                          {formatCurrency(position.gainLoss)}
                        </TableCell>
                        <TableCell className={`text-right font-mono ${position.gainLossPercent >= 0 ? 'profit' : 'loss'}`}>
                          {formatPercent(position.gainLossPercent)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.slice().reverse().map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === 'BUY' ? 'default' : 'secondary'}>
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{trade.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(trade.price)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(trade.quantity * trade.price)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            trade.status === 'COMPLETED' ? 'default' : 
                            trade.status === 'PENDING' ? 'secondary' : 'destructive'
                          }>
                            {trade.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(trade.timestamp).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PortfolioChart positions={positions} />
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Return</span>
                    <span className={`font-mono font-medium ${portfolio.totalGainLoss >= 0 ? 'profit' : 'loss'}`}>
                      {formatPercent(portfolio.totalGainLossPercent)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Return</span>
                    <span className={`font-mono font-medium ${portfolio.dailyPL >= 0 ? 'profit' : 'loss'}`}>
                      {formatPercent(portfolio.dailyPLPercent)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Portfolio Value</span>
                    <span className="font-mono font-medium">{formatCurrency(portfolio.totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Balance</span>
                    <span className="font-mono font-medium">{formatCurrency(portfolio.availableCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Invested Amount</span>
                    <span className="font-mono font-medium">{formatCurrency(totalPositionValue)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}