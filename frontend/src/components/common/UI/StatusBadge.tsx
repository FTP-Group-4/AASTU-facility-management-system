import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';
import { 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  AlertCircle,
  Circle,
  RefreshCw,
  Ban
} from 'lucide-react';

export type StatusType = 'submitted' | 'pending' | 'approved' | 'assigned' | 'in-progress' | 'completed' | 'closed' | 'reopened' | 'rejected';

export interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  status: StatusType;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge = ({
  status,
  showIcon = true,
  showText = true,
  size = 'md',
  className,
  ...props
}: StatusBadgeProps) => {
  const statusConfig: Record<StatusType, {
    icon: any;
    text: string;
    className: string;
    iconColor: string;
  }> = {
    submitted: {
      icon: Circle,
      text: 'Submitted',
      className: 'status-submitted',
      iconColor: 'text-status-submitted',
    },
    pending: {
      icon: Clock,
      text: 'Pending Approval',
      className: 'status-pending',
      iconColor: 'text-status-pending',
    },
    approved: {
      icon: CheckCircle,
      text: 'Approved',
      className: 'status-approved',
      iconColor: 'text-status-approved',
    },
    assigned: {
      icon: PlayCircle,
      text: 'Assigned',
      className: 'status-assigned',
      iconColor: 'text-status-assigned',
    },
    'in-progress': {
      icon: RefreshCw,
      text: 'In Progress',
      className: 'status-in-progress',
      iconColor: 'text-status-in-progress',
    },
    completed: {
      icon: CheckCircle,
      text: 'Completed',
      className: 'status-completed',
      iconColor: 'text-status-completed',
    },
    closed: {
      icon: Circle,
      text: 'Closed',
      className: 'status-closed',
      iconColor: 'text-status-closed',
    },
    reopened: {
      icon: AlertCircle,
      text: 'Reopened',
      className: 'status-reopened',
      iconColor: 'text-status-reopened',
    },
    rejected: {
      icon: Ban,
      text: 'Rejected',
      className: 'status-rejected',
      iconColor: 'text-status-rejected',
    },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const config = statusConfig[status];
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

export default StatusBadge;