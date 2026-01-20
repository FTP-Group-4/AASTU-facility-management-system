import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';
import { Clock, AlertTriangle, AlertOctagon } from 'lucide-react';

export interface SLAIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  deadline: Date | string;
  currentTime?: Date;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}

const SLAIndicator = ({
  deadline,
  currentTime = new Date(),
  size = 'md',
  showIcon = true,
  showLabel = true,
  className,
  ...props
}: SLAIndicatorProps) => {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const timeRemaining = deadlineDate.getTime() - currentTime.getTime();
  const hoursRemaining = timeRemaining / (1000 * 60 * 60);

  let status: 'normal' | 'warning' | 'critical';
  let icon = Clock;
  let label = '';
  let colorClass = '';

  if (hoursRemaining <= 2) {
    status = 'critical';
    icon = AlertOctagon;
    label = 'SLA Critical';
    colorClass = 'sla-critical';
  } else if (hoursRemaining <= 12) {
    status = 'warning';
    icon = AlertTriangle;
    label = 'SLA Warning';
    colorClass = 'sla-warning';
  } else {
    status = 'normal';
    icon = Clock;
    label = 'On Track';
    colorClass = 'sla-normal';
  }

  const Icon = icon;

  const sizes = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  };

  const formatTimeRemaining = () => {
    if (hoursRemaining < 0) {
      const overdueHours = Math.abs(Math.floor(hoursRemaining));
      const overdueMinutes = Math.abs(Math.floor((hoursRemaining % 1) * 60));
      return `${overdueHours}h ${overdueMinutes}m overdue`;
    }

    const remainingHours = Math.floor(hoursRemaining);
    const remainingMinutes = Math.floor((hoursRemaining % 1) * 60);
    return `${remainingHours}h ${remainingMinutes}m remaining`;
  };

  return (
    <div
      className={cn(
        'inline-flex items-center font-medium',
        colorClass,
        sizes[size],
        className
      )}
      {...props}
    >
      {showIcon && <Icon className="w-4 h-4" />}
      <div className="flex flex-col">
        {showLabel && <span className="font-medium">{label}</span>}
        <span className="text-xs opacity-80">{formatTimeRemaining()}</span>
      </div>
    </div>
  );
};

export default SLAIndicator;