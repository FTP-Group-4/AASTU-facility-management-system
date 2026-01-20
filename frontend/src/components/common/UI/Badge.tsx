import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'destructive';
  priority?: 'emergency' | 'high' | 'medium' | 'low';
  status?: 'submitted' | 'pending' | 'approved' | 'assigned' | 'in-progress' | 'completed' | 'closed' | 'reopened' | 'rejected';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
}

const Badge = ({ 
  className, 
  variant = 'default', 
  priority, 
  status,
  size = 'md',
  rounded = false,
  children,
  ...props 
}: BadgeProps) => {
  const baseStyles = "inline-flex items-center font-medium transition-colors";
  
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border text-foreground",
    destructive: "bg-danger text-danger-foreground",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-sm",
    lg: "px-3 py-1 text-base",
  };

  const priorityClasses = {
    emergency: "badge-priority-emergency",
    high: "badge-priority-high",
    medium: "badge-priority-medium",
    low: "badge-priority-low",
  };

  const statusClasses = {
    submitted: "status-submitted",
    pending: "status-pending",
    approved: "status-approved",
    assigned: "status-assigned",
    "in-progress": "status-in-progress",
    completed: "status-completed",
    closed: "status-closed",
    reopened: "status-reopened",
    rejected: "status-rejected",
  };

  return (
    <span
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        priority && priorityClasses[priority],
        status && statusClasses[status],
        rounded ? "rounded-full" : "rounded-md",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;