import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendUp, Shield, Target, Clock } from "@phosphor-icons/react"
import { Order, Position } from "@/lib/mockData"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface AdvancedTradeDialogProps {
  positions: Position[]
  onOrderPlace: (order: Order) => void
  trigger?: React.ReactNode
}

export function AdvancedTradeDialog({ positions, onOrderPlace, trigger }: AdvancedTradeDialogProps) {
  const [open, setOpen] = useState(false)
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY')
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LIMIT'>('MARKET')
  const [symbol, setSymbol] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [condition, setCondition] = useState<'GTC' | 'DAY' | 'IOC' | 'FOK'>('GTC')
  const [loading, setLoading] = useState(false)

  const availableSymbols = positions.map(p => p.symbol)
  const currentPosition = positions.find(p => p.symbol === symbol)
  const currentPrice = currentPosition?.currentPrice || 0

  const resetForm = () => {
    setSymbol('')
    setQuantity('')
    setPrice('')
    setStopPrice('')
    setLimitPrice('')
    setOrderType('MARKET')
    setCondition('GTC')
  }

  const validateOrder = (): string | null => {
    if (!symbol || !quantity) return "Please fill in symbol and quantity"
    
    const numQuantity = parseInt(quantity)
    if (numQuantity <= 0) return "Quantity must be positive"

    if (tradeType === 'SELL' && currentPosition && numQuantity > currentPosition.quantity) {
      return `Insufficient shares. Available: ${currentPosition.quantity}`
    }

    if (orderType === 'LIMIT' && (!price || parseFloat(price) <= 0)) {
      return "Limit price is required and must be positive"
    }

    if (orderType === 'STOP_LOSS' && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      return "Stop price is required and must be positive"
    }

    if (orderType === 'STOP_LIMIT') {
      if (!stopPrice || parseFloat(stopPrice) <= 0) return "Stop price is required"
      if (!limitPrice || parseFloat(limitPrice) <= 0) return "Limit price is required"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const error = validateOrder()
    if (error) {
      toast.error(error)
      return
    }

    setLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200))

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      symbol,
      type: tradeType,
      orderType,
      quantity: parseInt(quantity),
      price: price ? parseFloat(price) : undefined,
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
      limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
      timestamp: new Date().toISOString(),
      status: orderType === 'MARKET' ? 'FILLED' : 'PENDING',
      filledQuantity: orderType === 'MARKET' ? parseInt(quantity) : 0,
      avgFillPrice: orderType === 'MARKET' ? currentPrice : undefined,
      condition,
      expiresAt: condition === 'DAY' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
    }

    onOrderPlace(newOrder)
    
    const orderTypeLabel = orderType.replace('_', ' ').toLowerCase()
    toast.success(`${orderTypeLabel} ${tradeType.toLowerCase()} order for ${quantity} ${symbol} placed successfully`)
    
    resetForm()
    setLoading(false)
    setOpen(false)
  }

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'MARKET': return <TrendUp className="h-4 w-4" />
      case 'LIMIT': return <Target className="h-4 w-4" />
      case 'STOP_LOSS': return <Shield className="h-4 w-4" />
      case 'STOP_LIMIT': return <Clock className="h-4 w-4" />
      default: return <TrendUp className="h-4 w-4" />
    }
  }

  const getOrderTypeDescription = (type: string) => {
    switch (type) {
      case 'MARKET': return "Execute immediately at current market price"
      case 'LIMIT': return "Execute only at specified price or better"
      case 'STOP_LOSS': return "Sell when price drops to stop level (loss protection)"
      case 'STOP_LIMIT': return "Convert to limit order when stop price is reached"
      default: return ""
    }
  }

  const estimatedTotal = quantity && ((orderType === 'MARKET' && currentPrice) || price) 
    ? parseInt(quantity) * (orderType === 'MARKET' ? currentPrice : parseFloat(price || '0'))
    : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <TrendUp className="h-4 w-4 mr-2" />
            Advanced Trade
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Trading</DialogTitle>
        </DialogHeader>
        
        <Tabs value={tradeType} onValueChange={(value: string) => setTradeType(value as 'BUY' | 'SELL')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="BUY" className="text-green-600">Buy Order</TabsTrigger>
            <TabsTrigger value="SELL" className="text-red-600">Sell Order</TabsTrigger>
          </TabsList>

          <TabsContent value={tradeType} className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Symbol Selection */}
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                {tradeType === 'SELL' ? (
                  <Select value={symbol} onValueChange={setSymbol}>
                    <SelectTrigger id="symbol">
                      <SelectValue placeholder="Select a symbol to sell" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSymbols.map(sym => {
                        const pos = positions.find(p => p.symbol === sym)
                        return (
                          <SelectItem key={sym} value={sym}>
                            <div className="flex items-center justify-between w-full">
                              <span>{sym}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {pos?.quantity} shares @ {formatCurrency(pos?.currentPrice || 0)}
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="symbol"
                    placeholder="Enter symbol (e.g., AAPL)"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    required
                  />
                )}
                {currentPosition && (
                  <div className="text-xs text-muted-foreground">
                    Current: {formatCurrency(currentPosition.currentPrice)} 
                    {tradeType === 'SELL' && ` • Available: ${currentPosition.quantity} shares`}
                  </div>
                )}
              </div>

              {/* Order Type Selection */}
              <div className="space-y-3">
                <Label>Order Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LIMIT'] as const).map((type) => (
                    <Card 
                      key={type}
                      className={`cursor-pointer transition-colors ${
                        orderType === type ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setOrderType(type)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center">
                          {getOrderTypeIcon(type)}
                          <span className="ml-2">{type.replace('_', ' ')}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-xs">
                          {getOrderTypeDescription(type)}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Number of shares"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  required
                />
              </div>

              {/* Price Fields Based on Order Type */}
              <div className="space-y-4">
                {orderType === 'LIMIT' && (
                  <div className="space-y-2">
                    <Label htmlFor="limit-price">Limit Price</Label>
                    <Input
                      id="limit-price"
                      type="number"
                      step="0.01"
                      placeholder="Maximum buy price / Minimum sell price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      min="0.01"
                      required
                    />
                  </div>
                )}

                {orderType === 'STOP_LOSS' && (
                  <div className="space-y-2">
                    <Label htmlFor="stop-price">Stop Price</Label>
                    <Input
                      id="stop-price"
                      type="number"
                      step="0.01"
                      placeholder="Trigger price for stop loss"
                      value={stopPrice}
                      onChange={(e) => setStopPrice(e.target.value)}
                      min="0.01"
                      required
                    />
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Order will execute when price {tradeType === 'SELL' ? 'falls to or below' : 'rises to or above'} the stop price
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {orderType === 'STOP_LIMIT' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="stop-limit-stop">Stop Price</Label>
                      <Input
                        id="stop-limit-stop"
                        type="number"
                        step="0.01"
                        placeholder="Trigger price"
                        value={stopPrice}
                        onChange={(e) => setStopPrice(e.target.value)}
                        min="0.01"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stop-limit-limit">Limit Price</Label>
                      <Input
                        id="stop-limit-limit"
                        type="number"
                        step="0.01"
                        placeholder="Limit price after trigger"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        min="0.01"
                        required
                      />
                    </div>
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Becomes a limit order when stop price is reached
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>

              {/* Order Duration */}
              <div className="space-y-2">
                <Label htmlFor="condition">Order Duration</Label>
                <Select value={condition} onValueChange={(value: any) => setCondition(value)}>
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GTC">Good Till Cancelled</SelectItem>
                    <SelectItem value="DAY">Day Order</SelectItem>
                    <SelectItem value="IOC">Immediate or Cancel</SelectItem>
                    <SelectItem value="FOK">Fill or Kill</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Order Summary */}
              {(quantity && symbol) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Action:</span>
                      <Badge variant={tradeType === 'BUY' ? 'default' : 'secondary'}>
                        {tradeType} {quantity} {symbol}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Order Type:</span>
                      <span className="text-sm font-medium">{orderType.replace('_', ' ')}</span>
                    </div>
                    {estimatedTotal > 0 && orderType !== 'STOP_LOSS' && (
                      <div className="flex justify-between">
                        <span className="text-sm">Estimated Total:</span>
                        <span className="font-mono font-medium">{formatCurrency(estimatedTotal)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm">Duration:</span>
                      <span className="text-sm">{condition}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Placing Order..." : `Place ${orderType.replace('_', ' ')} Order`}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}