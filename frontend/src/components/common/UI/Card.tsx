import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  status?: 'submitted' | 'pending' | 'approved' | 'assigned' | 'in-progress' | 'completed' | 'closed' | 'reopened' | 'rejected';
  priority?: 'emergency' | 'high' | 'medium' | 'low';
  clickable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, status, priority, clickable, children, ...props }, ref) => {
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

    const priorityClasses = {
      emergency: "border-l-4 border-priority-emergency",
      high: "border-l-4 border-priority-high",
      medium: "border-l-4 border-priority-medium",
      low: "border-l-4 border-priority-low",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-card text-card-foreground rounded-lg border shadow-card",
          interactive && "card-interactive cursor-pointer",
          clickable && "hover:shadow-lg transition-shadow",
          status && statusClasses[status],
          priority && priorityClasses[priority],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("font-semibold leading-none tracking-tight text-lg", className)} {...props} />
);

const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);

const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };