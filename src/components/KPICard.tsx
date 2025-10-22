import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  iconColor?: string;
  iconBgColor?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-50'
}: KPICardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>

          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive && <TrendingUp className="w-4 h-4 text-green-600" />}
              {isNegative && <TrendingDown className="w-4 h-4 text-red-600" />}
              <span className={`text-sm font-medium ${
                isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend > 0 ? '+' : ''}{trend.toFixed(2)}%
              </span>
              {trendLabel && (
                <span className="text-sm text-gray-500 ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        <div className={`${iconBgColor} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
