import { ReactNode } from 'react';

interface StatItem {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
}

interface StatsProps {
  items: StatItem[];
  className?: string;
  layout?: 'grid' | 'horizontal';
}

export function Stats({ items, className = '', layout = 'grid' }: StatsProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      text: 'text-primary-700',
      icon: 'text-primary-600',
      border: 'border-primary-200'
    },
    success: {
      bg: 'bg-success-50',
      text: 'text-success-700',
      icon: 'text-success-600',
      border: 'border-success-200'
    },
    warning: {
      bg: 'bg-warning-50',
      text: 'text-warning-700',
      icon: 'text-warning-600',
      border: 'border-warning-200'
    },
    danger: {
      bg: 'bg-danger-50',
      text: 'text-danger-700',
      icon: 'text-danger-600',
      border: 'border-danger-200'
    },
    gray: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      icon: 'text-gray-600',
      border: 'border-gray-200'
    }
  };

  const layoutClasses = layout === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'
    : 'flex flex-wrap gap-4';

  return (
    <div className={`${layoutClasses} ${className}`}>
      {items.map((item, index) => {
        const colors = colorClasses[item.color || 'gray'];
        
        return (
          <div
            key={index}
            className={`
              ${colors.bg} ${colors.border}
              border rounded-xl p-6 transition-all duration-300 hover:shadow-medium
              animate-fade-in
            `}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              {item.icon && (
                <div className={`text-2xl ${colors.icon}`}>
                  {item.icon}
                </div>
              )}
              {item.change && (
                <div className={`
                  flex items-center text-xs font-medium px-2 py-1 rounded-full
                  ${item.change.type === 'increase' 
                    ? 'bg-success-100 text-success-700' 
                    : 'bg-danger-100 text-danger-700'
                  }
                `}>
                  <span className="mr-1">
                    {item.change.type === 'increase' ? '↗' : '↘'}
                  </span>
                  {Math.abs(item.change.value)}%
                </div>
              )}
            </div>
            
            <div>
              <div className={`text-3xl font-bold ${colors.text} mb-1`}>
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {item.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}