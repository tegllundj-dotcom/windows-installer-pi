import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Plus, Shield } from "@phosphor-icons/react"
import { Trade, Position, Order } from "@/lib/mockData"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface TradeDialogProps {
  positions: Position[]
  onTradeComplete: (trade: Trade) => void
  onOrderPlace?: (order: Order) => void
}

export function TradeDialog({ positions, onTradeComplete, onOrderPlace }: TradeDialogProps) {
  const [open, setOpen] = useState(false)
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY')
  const [symbol, setSymbol] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [addStopLoss, setAddStopLoss] = useState(false)
  const [stopLossPercent, setStopLossPercent] = useState('10')
  const [loading, setLoading] = useState(false)

  const availableSymbols = positions.map(p => p.symbol)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!symbol || !quantity || !price) {
      toast.error("Please fill in all fields")
      return
    }

    const numQuantity = parseInt(quantity)
    const numPrice = parseFloat(price)

    if (numQuantity <= 0 || numPrice <= 0) {
      toast.error("Quantity and price must be positive numbers")
      return
    }

    setLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newTrade: Trade = {
      id: Date.now().toString(),
      symbol,
      type: tradeType,
      quantity: numQuantity,
      price: numPrice,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    }

    onTradeComplete(newTrade)
    
    // Create stop-loss order if requested and it's a BUY trade
    if (addStopLoss && tradeType === 'BUY' && onOrderPlace) {
      const stopPrice = numPrice * (1 - parseFloat(stopLossPercent) / 100)
      const stopLossOrder: Order = {
        id: `stop-${Date.now()}`,
        symbol,
        type: 'SELL',
        orderType: 'STOP_LOSS',
        quantity: numQuantity,
        stopPrice,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
        filledQuantity: 0,
        condition: 'GTC'
      }
      onOrderPlace(stopLossOrder)
      toast.success(`Stop-loss order also placed at ${formatCurrency(stopPrice)}`)
    }
    
    toast.success(`${tradeType} order for ${numQuantity} shares of ${symbol} completed`)
    
    // Reset form
    setSymbol('')
    setQuantity('')
    setPrice('')
    setAddStopLoss(false)
    setStopLossPercent('10')
    setLoading(false)
    setOpen(false)
  }

  const estimatedTotal = quantity && price ? parseInt(quantity) * parseFloat(price) : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Trade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place New Trade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trade-type">Trade Type</Label>
            <Select value={tradeType} onValueChange={(value: 'BUY' | 'SELL') => setTradeType(value)}>
              <SelectTrigger id="trade-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">
                  <Badge variant="default" className="mr-2">BUY</Badge>
                  Purchase shares
                </SelectItem>
                <SelectItem value="SELL">
                  <Badge variant="secondary" className="mr-2">SELL</Badge>
                  Sell shares
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            {tradeType === 'SELL' ? (
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger id="symbol">
                  <SelectValue placeholder="Select a symbol to sell" />
                </SelectTrigger>
                <SelectContent>
                  {availableSymbols.map(sym => (
                    <SelectItem key={sym} value={sym}>{sym}</SelectItem>
                  ))}
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
          </div>

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
            {tradeType === 'SELL' && symbol && (
              <p className="text-xs text-muted-foreground">
                Available: {positions.find(p => p.symbol === symbol)?.quantity || 0} shares
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price per Share</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="Price per share"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0.01"
              required
            />
          </div>

          {estimatedTotal > 0 && (
            <div className="rounded-lg bg-muted p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Estimated Total:</span>
                <span className="font-mono font-medium">{formatCurrency(estimatedTotal)}</span>
              </div>
            </div>
          )}

          {/* Stop-Loss Option for BUY orders */}
          {tradeType === 'BUY' && onOrderPlace && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="add-stop-loss" 
                    checked={addStopLoss}
                    onCheckedChange={(checked) => setAddStopLoss(!!checked)}
                  />
                  <Label htmlFor="add-stop-loss" className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Add Stop-Loss Protection
                  </Label>
                </div>
                
                {addStopLoss && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="stop-loss-percent">Stop-Loss Percentage</Label>
                    <Select value={stopLossPercent} onValueChange={setStopLossPercent}>
                      <SelectTrigger id="stop-loss-percent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5% below purchase price</SelectItem>
                        <SelectItem value="10">10% below purchase price</SelectItem>
                        <SelectItem value="15">15% below purchase price</SelectItem>
                        <SelectItem value="20">20% below purchase price</SelectItem>
                      </SelectContent>
                    </Select>
                    {price && (
                      <p className="text-xs text-muted-foreground">
                        Stop-loss will trigger at: {formatCurrency(parseFloat(price) * (1 - parseFloat(stopLossPercent) / 100))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : `Place ${tradeType} Order`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}