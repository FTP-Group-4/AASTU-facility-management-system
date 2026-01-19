import React from 'react';
import type { ReportStatus, Priority } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'status' | 'priority' | 'default';
  status?: ReportStatus;
  priority?: Priority;
  className?: string;
}

export function Badge({ children, variant = 'default', status, priority, className = '' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  const getStatusColor = (status?: ReportStatus) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
      case 'assigned':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'in-progress':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority?: Priority) => {
    switch (priority) {
      case 'emergency':
        return 'bg-red-600 text-white animate-pulse';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-blue-500 text-white';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  let colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';

  if (variant === 'status') {
    colorClasses = getStatusColor(status);
  } else if (variant === 'priority') {
    colorClasses = getPriorityColor(priority);
  }

  return (
    <span className={`${baseStyles} ${colorClasses} ${className}`}>
      {children}
    </span>
  );
}
