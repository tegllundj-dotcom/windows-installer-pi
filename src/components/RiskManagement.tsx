import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Shield, TrendDown, Warning, Target } from "@phosphor-icons/react"
import { Order, Position, Portfolio } from "@/lib/mockData"
import { formatCurrency, formatPercent } from "@/lib/utils"

interface RiskManagementProps {
  portfolio: Portfolio
  positions: Position[]
  orders: Order[]
}

export function RiskManagement({ portfolio, positions, orders }: RiskManagementProps) {
  // Calculate risk metrics
  const totalPortfolioValue = portfolio.totalValue
  const stopLossOrders = orders.filter(o => o.orderType === 'STOP_LOSS' && o.status === 'PENDING')
  
  // Position concentration risk
  const positionRisks = positions.map(position => {
    const concentration = (position.marketValue / totalPortfolioValue) * 100
    const hasStopLoss = stopLossOrders.some(order => 
      order.symbol === position.symbol && order.type === 'SELL'
    )
    
    return {
      ...position,
      concentration,
      hasStopLoss,
      riskLevel: concentration > 25 ? 'HIGH' : concentration > 15 ? 'MEDIUM' : 'LOW'
    }
  })

  // Portfolio risk metrics
  const highRiskPositions = positionRisks.filter(p => p.riskLevel === 'HIGH')
  const mediumRiskPositions = positionRisks.filter(p => p.riskLevel === 'MEDIUM')
  const unprotectedPositions = positionRisks.filter(p => !p.hasStopLoss && p.marketValue > 5000)
  
  // Diversification score (simplified)
  const diversificationScore = Math.max(0, 100 - (highRiskPositions.length * 20) - (mediumRiskPositions.length * 10))

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'secondary'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'HIGH': return <Warning className="h-4 w-4" />
      case 'MEDIUM': return <TrendDown className="h-4 w-4" />
      case 'LOW': return <Shield className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diversificationScore}/100</div>
            <div className="mt-2">
              <Progress value={diversificationScore} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {diversificationScore >= 80 ? 'Low Risk' : 
               diversificationScore >= 60 ? 'Medium Risk' : 'High Risk'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stop Loss Orders</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stopLossOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active protection orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unprotected Value</CardTitle>
            <Warning className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(unprotectedPositions.reduce((sum, p) => sum + p.marketValue, 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {unprotectedPositions.length} positions without stop-loss
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Position</CardTitle>
            <TrendDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(Math.max(...positionRisks.map(p => p.concentration)))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Largest position concentration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Position Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Warning className="h-5 w-5 mr-2" />
            Position Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {positionRisks.map((position) => (
              <div key={position.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="font-medium">{position.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(position.marketValue)} • {formatPercent(position.concentration)} of portfolio
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {position.hasStopLoss ? (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Protected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <Warning className="h-3 w-3 mr-1" />
                      Unprotected
                    </Badge>
                  )}
                  
                  <Badge variant={getRiskColor(position.riskLevel)} className="text-xs">
                    {getRiskIcon(position.riskLevel)}
                    <span className="ml-1">{position.riskLevel}</span>
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Alerts */}
      <div className="space-y-3">
        {highRiskPositions.length > 0 && (
          <Alert>
            <Warning className="h-4 w-4" />
            <AlertDescription>
              <strong>High Concentration Risk:</strong> {highRiskPositions.length} position(s) exceed 25% of portfolio value. 
              Consider reducing exposure: {highRiskPositions.map(p => p.symbol).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {unprotectedPositions.length > 0 && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Unprotected Positions:</strong> {unprotectedPositions.length} significant position(s) lack stop-loss protection.
              Consider setting stop-loss orders for: {unprotectedPositions.map(p => p.symbol).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {portfolio.dailyPL < -portfolio.totalValue * 0.05 && (
          <Alert>
            <TrendDown className="h-4 w-4" />
            <AlertDescription>
              <strong>Large Daily Loss:</strong> Portfolio down {formatPercent(portfolio.dailyPLPercent)} today.
              Review positions and consider risk management actions.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Risk Management Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Risk Management Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <div>
                <div className="font-medium text-sm">Diversification</div>
                <div className="text-xs text-muted-foreground">
                  Maintain no more than 20% in any single position to reduce concentration risk
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <div className="font-medium text-sm">Stop-Loss Protection</div>
                <div className="text-xs text-muted-foreground">
                  Set stop-loss orders 10-15% below purchase price for downside protection
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
              <div>
                <div className="font-medium text-sm">Position Sizing</div>
                <div className="text-xs text-muted-foreground">
                  Use the 1-2% rule: risk no more than 1-2% of portfolio on any single trade
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
              <div>
                <div className="font-medium text-sm">Regular Review</div>
                <div className="text-xs text-muted-foreground">
                  Review and adjust stop-loss levels as positions move in your favor
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}