import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Clock, CheckCircle, XCircle, TrendUp, TrendDown, Shield, Target } from "@phosphor-icons/react"
import { Order } from "@/lib/mockData"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface OrdersManagementProps {
  orders: Order[]
  onCancelOrder: (orderId: string) => void
  onModifyOrder?: (order: Order) => void
}

export function OrdersManagement({ orders, onCancelOrder, onModifyOrder }: OrdersManagementProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return 'default'
      case 'FILLED': return 'secondary'
      case 'CANCELLED': return 'destructive'
      case 'EXPIRED': return 'outline'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-3 w-3" />
      case 'FILLED': return <CheckCircle className="h-3 w-3" />
      case 'CANCELLED': return <XCircle className="h-3 w-3" />
      case 'EXPIRED': return <XCircle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getOrderTypeIcon = (orderType: Order['orderType']) => {
    switch (orderType) {
      case 'MARKET': return <TrendUp className="h-3 w-3" />
      case 'LIMIT': return <Target className="h-3 w-3" />
      case 'STOP_LOSS': return <Shield className="h-3 w-3" />
      case 'STOP_LIMIT': return <Clock className="h-3 w-3" />
      default: return <TrendUp className="h-3 w-3" />
    }
  }

  const handleCancelOrder = (orderId: string) => {
    onCancelOrder(orderId)
    toast.success("Order cancelled successfully")
  }

  const formatTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return 'No expiry'
    
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const pendingOrders = orders.filter(o => o.status === 'PENDING')
  const filledOrders = orders.filter(o => o.status === 'FILLED')
  const otherOrders = orders.filter(o => !['PENDING', 'FILLED'].includes(o.status))

  const OrderRow = ({ order }: { order: Order }) => (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedOrder(order)}>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Badge variant={order.type === 'BUY' ? 'default' : 'secondary'} className="w-12 justify-center">
            {order.type}
          </Badge>
          <span className="font-medium">{order.symbol}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {getOrderTypeIcon(order.orderType)}
          <span className="text-sm">{order.orderType.replace('_', ' ')}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono">{order.quantity}</TableCell>
      <TableCell className="font-mono">
        {order.orderType === 'MARKET' ? (
          <span className="text-muted-foreground">Market</span>
        ) : order.orderType === 'STOP_LOSS' ? (
          formatCurrency(order.stopPrice || 0)
        ) : order.orderType === 'STOP_LIMIT' ? (
          <div className="text-xs">
            <div>Stop: {formatCurrency(order.stopPrice || 0)}</div>
            <div>Limit: {formatCurrency(order.limitPrice || 0)}</div>
          </div>
        ) : (
          formatCurrency(order.price || 0)
        )}
      </TableCell>
      <TableCell>
        <Badge variant={getStatusColor(order.status)} className="flex items-center w-fit">
          {getStatusIcon(order.status)}
          <span className="ml-1 text-xs">{order.status}</span>
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatTimeRemaining(order.expiresAt)}
      </TableCell>
      <TableCell>
        {order.status === 'PENDING' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleCancelOrder(order.id)
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Orders Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="filled">
              Filled ({filledOrders.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              History ({otherOrders.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders.map((order) => (
                    <OrderRow key={order.id} order={order} />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  No pending orders. Use Advanced Trade to place limit orders, stop-loss orders, and more.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="filled" className="space-y-4">
            {filledOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Fill Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filledOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={order.type === 'BUY' ? 'default' : 'secondary'} className="w-12 justify-center">
                            {order.type}
                          </Badge>
                          <span className="font-medium">{order.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getOrderTypeIcon(order.orderType)}
                          <span className="text-sm">{order.orderType.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{order.filledQuantity}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(order.avgFillPrice || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center w-fit">
                          <CheckCircle className="h-3 w-3" />
                          <span className="ml-1 text-xs">FILLED</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No filled orders yet.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            {otherOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherOrders.map((order) => (
                    <OrderRow key={order.id} order={order} />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  No cancelled or expired orders.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        {/* Order Details Dialog */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Symbol</div>
                    <div className="text-lg">{selectedOrder.symbol}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Action</div>
                    <Badge variant={selectedOrder.type === 'BUY' ? 'default' : 'secondary'}>
                      {selectedOrder.type}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Order Type</div>
                    <div>{selectedOrder.orderType.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Quantity</div>
                    <div className="font-mono">{selectedOrder.quantity}</div>
                  </div>
                </div>

                {selectedOrder.price && (
                  <div>
                    <div className="text-sm font-medium">Price</div>
                    <div className="font-mono">{formatCurrency(selectedOrder.price)}</div>
                  </div>
                )}

                {selectedOrder.stopPrice && (
                  <div>
                    <div className="text-sm font-medium">Stop Price</div>
                    <div className="font-mono">{formatCurrency(selectedOrder.stopPrice)}</div>
                  </div>
                )}

                {selectedOrder.limitPrice && (
                  <div>
                    <div className="text-sm font-medium">Limit Price</div>
                    <div className="font-mono">{formatCurrency(selectedOrder.limitPrice)}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Status</div>
                    <Badge variant={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Duration</div>
                    <div>{selectedOrder.condition}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(selectedOrder.timestamp).toLocaleString()}
                  </div>
                </div>

                {selectedOrder.expiresAt && (
                  <div>
                    <div className="text-sm font-medium">Expires</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(selectedOrder.expiresAt).toLocaleString()}
                      {' '}({formatTimeRemaining(selectedOrder.expiresAt)})
                    </div>
                  </div>
                )}

                {selectedOrder.status === 'PENDING' && (
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                      Close
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        handleCancelOrder(selectedOrder.id)
                        setSelectedOrder(null)
                      }}
                    >
                      Cancel Order
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}