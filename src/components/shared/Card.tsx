import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export function Card({ 
  children, 
  elevated = false, 
  padding = 'md',
  hoverable = false,
  className = '',
  ...props 
}: CardProps) {
  const baseStyles = 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg';
  
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const elevatedStyles = elevated ? 'shadow-[var(--shadow-md)]' : '';
  const hoverStyles = hoverable ? 'hover:shadow-[var(--shadow-lg)] transition-shadow duration-200 cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${paddingStyles[padding]} ${elevatedStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-[var(--color-text-primary)] ${className}`}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
