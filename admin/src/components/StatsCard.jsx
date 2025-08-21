import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../lib/utils'

const colorVariants = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    trend: 'text-green-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    trend: 'text-purple-600',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    trend: 'text-orange-600',
  },
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    trend: 'text-indigo-600',
  },
  pink: {
    bg: 'bg-pink-50',
    icon: 'text-pink-600',
    trend: 'text-pink-600',
  },
  teal: {
    bg: 'bg-teal-50',
    icon: 'text-teal-600',
    trend: 'text-teal-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    trend: 'text-amber-600',
  },
}

const StatsCard = ({ title, value, icon: Icon, color = 'blue', trend, subtitle }) => {
  const colors = colorVariants[color]
  const isPositiveTrend = trend && trend > 0
  const isNegativeTrend = trend && trend < 0

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="card-content">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {isPositiveTrend && (
                  <TrendingUp className={cn('w-4 h-4', colors.trend)} />
                )}
                {isNegativeTrend && (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    isPositiveTrend && colors.trend,
                    isNegativeTrend && 'text-red-600',
                    !isPositiveTrend && !isNegativeTrend && 'text-gray-500'
                  )}
                >
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', colors.bg)}>
            <Icon className={cn('w-6 h-6', colors.icon)} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsCard
