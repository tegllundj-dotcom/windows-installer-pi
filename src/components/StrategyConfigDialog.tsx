import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { StrategyConfig } from '@/lib/tradingStrategy'
import { validateStrategyConfig, getStrategyParameterInfo } from '@/lib/strategyManager'
import { toast } from 'sonner'

interface StrategyConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategy: StrategyConfig | null
  onSave: (strategy: StrategyConfig) => void
}

export function StrategyConfigDialog({ 
  open, 
  onOpenChange, 
  strategy, 
  onSave 
}: StrategyConfigDialogProps) {
  const [config, setConfig] = useState<StrategyConfig | null>(strategy)

  if (!strategy || !config) return null

  const paramInfo = getStrategyParameterInfo(strategy.id)
  const errors = validateStrategyConfig(config)

  const handleSave = () => {
    if (errors.length > 0) {
      toast.error('Please fix validation errors before saving')
      return
    }

    onSave(config)
    onOpenChange(false)
  }

  const updateParameter = (key: string, value: any) => {
    setConfig({
      ...config,
      parameters: {
        ...config.parameters,
        [key]: value
      }
    })
  }

  const updateRiskManagement = (key: keyof StrategyConfig['riskManagement'], value: number) => {
    setConfig({
      ...config,
      riskManagement: {
        ...config.riskManagement,
        [key]: value
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Strategy: {strategy.name}</DialogTitle>
          <DialogDescription>
            Adjust parameters and risk management settings for this strategy
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Strategy Parameters */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Strategy Parameters</h3>
              <p className="text-sm text-muted-foreground">
                Fine-tune the strategy's trading logic
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(paramInfo).map(([key, info]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="text-sm font-medium">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {info.description}
                  </p>
                  
                  {info.type === 'number' && info.min !== undefined && info.max !== undefined ? (
                    <div className="space-y-2">
                      <Slider
                        value={[config.parameters[key] as number]}
                        onValueChange={([value]) => updateParameter(key, value)}
                        min={info.min}
                        max={info.max}
                        step={info.step || 1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{info.min}</span>
                        <Badge variant="outline" className="text-xs">
                          {config.parameters[key]}
                        </Badge>
                        <span>{info.max}</span>
                      </div>
                    </div>
                  ) : (
                    <Input
                      id={key}
                      type={info.type}
                      value={config.parameters[key] as string}
                      onChange={(e) => updateParameter(
                        key, 
                        info.type === 'number' ? Number(e.target.value) : e.target.value
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Risk Management */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Risk Management</h3>
              <p className="text-sm text-muted-foreground">
                Set limits to protect your capital
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stop Loss (%)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[config.riskManagement.stopLoss]}
                    onValueChange={([value]) => updateRiskManagement('stopLoss', value)}
                    min={0.5}
                    max={20}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.5%</span>
                    <Badge variant="outline">{config.riskManagement.stopLoss}%</Badge>
                    <span>20%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Take Profit (%)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[config.riskManagement.takeProfit]}
                    onValueChange={([value]) => updateRiskManagement('takeProfit', value)}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1%</span>
                    <Badge variant="outline">{config.riskManagement.takeProfit}%</Badge>
                    <span>50%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Position Size (%)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[config.riskManagement.maxPositionSize]}
                    onValueChange={([value]) => updateRiskManagement('maxPositionSize', value)}
                    min={5}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5%</span>
                    <Badge variant="outline">{config.riskManagement.maxPositionSize}%</Badge>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Drawdown (%)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[config.riskManagement.maxDrawdown]}
                    onValueChange={([value]) => updateRiskManagement('maxDrawdown', value)}
                    min={2}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>2%</span>
                    <Badge variant="outline">{config.riskManagement.maxDrawdown}%</Badge>
                    <span>30%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-semibold text-red-800 mb-2">
                Validation Errors:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={errors.length > 0}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}