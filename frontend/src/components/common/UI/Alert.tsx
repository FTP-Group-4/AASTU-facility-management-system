import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  icon?: ReactNode;
  title?: string;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = ({
  className,
  variant = 'default',
  icon,
  title,
  children,
  showIcon = true,
  dismissible = false,
  onDismiss,
  ...props
}: AlertProps) => {
  const variants = {
    default: "bg-muted text-foreground border-border",
    destructive: "bg-danger-light text-danger border-danger/20",
    warning: "bg-warning-light text-warning-foreground border-warning/20",
    success: "bg-success-light text-success border-success/20",
    info: "bg-primary-muted text-primary border-primary/20",
  };

  const icons = {
    default: <Info className="h-4 w-4" />,
    destructive: <XCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4 animate-fade-in",
        variants[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <div className="shrink-0 mt-0.5">
            {icon || icons[variant]}
          </div>
        )}
        
        <div className="flex-1">
          {title && (
            <h5 className="font-medium mb-1">{title}</h5>
          )}
          <div className="text-sm">{children}</div>
        </div>

        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Add these subcomponents at the end of the file:
const AlertTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={cn("font-medium mb-1", className)} {...props} />
);

const AlertDescription = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("text-sm", className)} {...props} />
);

// Add to the export
export default Object.assign(Alert, {
  Title: AlertTitle,
  Description: AlertDescription
});