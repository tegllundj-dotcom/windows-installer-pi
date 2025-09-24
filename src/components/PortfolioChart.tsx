import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Position } from "@/lib/mockData"
import { formatCurrency } from "@/lib/utils"

interface PortfolioChartProps {
  positions: Position[]
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#f97316']

export function PortfolioChart({ positions }: PortfolioChartProps) {
  const chartData = positions.map((position, index) => ({
    name: position.symbol,
    value: position.marketValue,
    color: COLORS[index % COLORS.length],
    percentage: 0 // Will be calculated below
  }))

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0)
  
  // Calculate percentages
  chartData.forEach(item => {
    item.percentage = (item.value / totalValue) * 100
  })

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Value: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-muted-foreground">
            Share: {data.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({ name, percentage }: any) => {
    if (percentage < 5) return '' // Hide labels for small slices
    return `${name} (${percentage.toFixed(1)}%)`
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No positions to display</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value: string, entry: any) => (
                <span style={{ color: entry.color }}>
                  {value} ({formatCurrency(entry.payload?.value || 0)})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}