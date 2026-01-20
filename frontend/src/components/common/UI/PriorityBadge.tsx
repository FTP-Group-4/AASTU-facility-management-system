import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';
import { AlertTriangle, Flame, Clock, CheckCircle } from 'lucide-react';

export interface PriorityBadgeProps extends HTMLAttributes<HTMLDivElement> {
  priority: 'emergency' | 'high' | 'medium' | 'low';
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PriorityBadge = ({
  priority,
  showIcon = true,
  showText = true,
  size = 'md',
  className,
  ...props
}: PriorityBadgeProps) => {
  const priorityConfig = {
    emergency: {
      icon: Flame,
      text: 'Emergency',
      className: 'badge-priority-emergency emergency-blink',
      iconColor: 'text-emergency',
    },
    high: {
      icon: AlertTriangle,
      text: 'High',
      className: 'badge-priority-high',
      iconColor: 'text-priority-high',
    },
    medium: {
      icon: Clock,
      text: 'Medium',
      className: 'badge-priority-medium',
      iconColor: 'text-priority-medium',
    },
    low: {
      icon: CheckCircle,
      text: 'Low',
      className: 'badge-priority-low',
      iconColor: 'text-priority-low',
    },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md font-medium',
        config.className,
        sizes[size],
        className
      )}
      {...props}
    >
      {showIcon && <Icon className={cn('w-4 h-4', config.iconColor)} />}
      {showText && <span>{config.text}</span>}
    </div>
  );
};

export default PriorityBadge;