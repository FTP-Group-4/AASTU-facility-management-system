import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText,
    options,
    placeholder = 'Select an option',
    fullWidth = true,
    id,
    ...props 
  }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={selectId} 
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 custom-scrollbar',
              error && 'border-danger focus-visible:ring-danger',
              'pr-10', // Space for chevron
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        
        {error && (
          <p className="text-sm text-danger" id={`${selectId}-error`}>
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-muted-foreground" id={`${selectId}-helper`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;