import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Target, TrendUp, Lightning } from "@phosphor-icons/react"
import { Position, Order } from "@/lib/mockData"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface QuickActionsProps {
  positions: Position[]
  onOrderPlace: (order: Order) => void
}

export function QuickActions({ positions, onOrderPlace }: QuickActionsProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [selectedPosition, setSelectedPosition] = useState('')
  const [percentage, setPercentage] = useState('10')
  const [loading, setLoading] = useState(false)

  const positionsAtRisk = positions.filter(p => p.gainLossPercent < -5)
  const profitablePositions = positions.filter(p => p.gainLossPercent > 10)

  const handleQuickStopLoss = async () => {
    if (!selectedPosition) {
      toast.error("Please select a position")
      return
    }

    const position = positions.find(p => p.symbol === selectedPosition)
    if (!position) return

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    const stopPrice = position.currentPrice * (1 - parseFloat(percentage) / 100)
    
    const order: Order = {
      id: `quick-stop-${Date.now()}`,
      symbol: position.symbol,
      type: 'SELL',
      orderType: 'STOP_LOSS',
      quantity: Math.floor(position.quantity * 0.5), // Default to 50% of position
      stopPrice,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      filledQuantity: 0,
      condition: 'GTC'
    }

    onOrderPlace(order)
    toast.success(`Stop-loss set for ${position.symbol} at ${formatCurrency(stopPrice)}`)
    setLoading(false)
    setSelectedAction(null)
  }

  const handleQuickProfitTaking = async () => {
    if (!selectedPosition) {
      toast.error("Please select a position")
      return
    }

    const position = positions.find(p => p.symbol === selectedPosition)
    if (!position) return

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    const targetPrice = position.currentPrice * (1 + parseFloat(percentage) / 100)
    
    const order: Order = {
      id: `quick-limit-${Date.now()}`,
      symbol: position.symbol,
      type: 'SELL',
      orderType: 'LIMIT',
      quantity: Math.floor(position.quantity * 0.3), // Default to 30% of position
      price: targetPrice,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      filledQuantity: 0,
      condition: 'GTC'
    }

    onOrderPlace(order)
    toast.success(`Profit-taking order set for ${position.symbol} at ${formatCurrency(targetPrice)}`)
    setLoading(false)
    setSelectedAction(null)
  }

  const quickActions = [
    {
      id: 'stop-loss',
      title: 'Quick Stop-Loss',
      description: 'Protect losing positions',
      icon: <Shield className="h-5 w-5" />,
      badge: positionsAtRisk.length > 0 ? positionsAtRisk.length : null,
      color: 'destructive' as const,
      available: positionsAtRisk.length > 0
    },
    {
      id: 'profit-taking',
      title: 'Profit Taking',
      description: 'Lock in gains above target',
      icon: <Target className="h-5 w-5" />,
      badge: profitablePositions.length > 0 ? profitablePositions.length : null,
      color: 'default' as const,
      available: profitablePositions.length > 0
    },
    {
      id: 'rebalance',
      title: 'Portfolio Rebalance',
      description: 'Adjust position sizes',
      icon: <TrendUp className="h-5 w-5" />,
      badge: null,
      color: 'secondary' as const,
      available: positions.length > 0
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightning className="h-5 w-5 mr-2" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Dialog
              key={action.id}
              open={selectedAction === action.id}
              onOpenChange={(open) => setSelectedAction(open ? action.id : null)}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                  disabled={!action.available}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      {action.icon}
                      <span className="font-medium text-sm">{action.title}</span>
                    </div>
                    {action.badge && (
                      <Badge variant={action.color} className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    {action.description}
                  </p>
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    {action.icon}
                    <span className="ml-2">{action.title}</span>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Position Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="position-select">Select Position</Label>
                    <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                      <SelectTrigger id="position-select">
                        <SelectValue placeholder="Choose a position" />
                      </SelectTrigger>
                      <SelectContent>
                        {(action.id === 'stop-loss' ? positionsAtRisk : 
                          action.id === 'profit-taking' ? profitablePositions : positions)
                          .map((position) => (
                          <SelectItem key={position.symbol} value={position.symbol}>
                            <div className="flex items-center justify-between w-full">
                              <span>{position.symbol}</span>
                              <div className="ml-4 text-xs text-muted-foreground">
                                {position.quantity} @ {formatCurrency(position.currentPrice)}
                                <span className={`ml-2 ${position.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {position.gainLossPercent >= 0 ? '+' : ''}{position.gainLossPercent.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Percentage Input */}
                  <div className="space-y-2">
                    <Label htmlFor="percentage">
                      {action.id === 'stop-loss' ? 'Stop-Loss Percentage' :
                       action.id === 'profit-taking' ? 'Profit Target %' : 'Adjustment %'}
                    </Label>
                    <Select value={percentage} onValueChange={setPercentage}>
                      <SelectTrigger id="percentage">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {action.id === 'stop-loss' ? (
                          <>
                            <SelectItem value="5">5% below current price</SelectItem>
                            <SelectItem value="10">10% below current price</SelectItem>
                            <SelectItem value="15">15% below current price</SelectItem>
                            <SelectItem value="20">20% below current price</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="5">5% above current price</SelectItem>
                            <SelectItem value="10">10% above current price</SelectItem>
                            <SelectItem value="15">15% above current price</SelectItem>
                            <SelectItem value="20">20% above current price</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preview */}
                  {selectedPosition && (
                    <div className="bg-muted p-3 rounded-lg space-y-2">
                      <div className="text-sm font-medium">Order Preview:</div>
                      {(() => {
                        const position = positions.find(p => p.symbol === selectedPosition)
                        if (!position) return null
                        
                        const multiplier = action.id === 'stop-loss' ? (1 - parseFloat(percentage) / 100) : (1 + parseFloat(percentage) / 100)
                        const targetPrice = position.currentPrice * multiplier
                        const quantity = action.id === 'stop-loss' ? Math.floor(position.quantity * 0.5) : Math.floor(position.quantity * 0.3)
                        
                        return (
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Symbol:</span>
                              <span className="font-mono">{position.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Quantity:</span>
                              <span className="font-mono">{quantity} shares</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Target Price:</span>
                              <span className="font-mono">{formatCurrency(targetPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Order Type:</span>
                              <span>{action.id === 'stop-loss' ? 'Stop-Loss' : 'Limit'}</span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setSelectedAction(null)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={action.id === 'stop-loss' ? handleQuickStopLoss : handleQuickProfitTaking}
                      disabled={loading || !selectedPosition}
                    >
                      {loading ? 'Placing...' : `Place ${action.title}`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Positions at Risk</div>
              <div className="font-medium">{positionsAtRisk.length} positions down &gt;5%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Profit Opportunities</div>
              <div className="font-medium">{profitablePositions.length} positions up &gt;10%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}