import { forwardRef, useEffect } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/utils';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  preventCloseOnOverlayClick?: boolean;
  showOverlay?: boolean;
  overlayClassName?: string;
  portalId?: string;
  closeOnEsc?: boolean;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    showCloseButton = true,
    preventCloseOnOverlayClick = false,
    showOverlay = true,
    overlayClassName,
    portalId = 'modal-root',
    closeOnEsc = true,
    className,
    children,
    ...props
  }, ref) => {
    // Handle ESC key
    useEffect(() => {
      if (!closeOnEsc || typeof window === 'undefined') return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose();
        }
      };
      if (isOpen) {
        window.addEventListener('keydown', handleKeyDown);
      }
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [closeOnEsc, isOpen, onClose]);

    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-[95vw]',
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (preventCloseOnOverlayClick) return;
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    if (!isOpen) return null;

    const modalContent = (
      <div className="fixed inset-0 z-[100] overflow-y-auto">
        {/* Overlay */}
        {showOverlay && (
          <div
            className={cn(
              'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in',
              overlayClassName
            )}
            aria-hidden="true"
          />
        )}
        
        {/* Modal Container */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={cn(
              'fixed inset-0 sm:static sm:inset-auto',
              showOverlay && 'sm:flex sm:items-center sm:justify-center'
            )}
            onClick={handleOverlayClick}
          >
            {/* Modal Panel */}
            <div
              ref={ref}
              className={cn(
                'relative bg-card text-card-foreground rounded-lg shadow-xl animate-scale-in',
                sizes[size],
                'mx-auto w-full border',
                className
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              aria-describedby={description ? 'modal-description' : undefined}
              {...props}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between border-b px-6 py-4">
                  {title && (
                    <h3
                      id="modal-title"
                      className="text-lg font-semibold leading-6"
                    >
                      {title}
                    </h3>
                  )}
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors touch-target"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Description */}
              {description && (
                <div className="border-b px-6 py-3">
                  <p id="modal-description" className="text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              )}
              
              {/* Content */}
              <div className="px-6 py-4 custom-scrollbar max-h-[70vh] overflow-y-auto">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    // Create portal if portal element exists, otherwise render inline
    if (typeof document !== 'undefined') {
      let portalElement = document.getElementById(portalId);
      
      if (!portalElement) {
        portalElement = document.createElement('div');
        portalElement.id = portalId;
        document.body.appendChild(portalElement);
      }
      
      return createPortal(modalContent, portalElement);
    }

    return modalContent;
  }
);

Modal.displayName = 'Modal';

// Modal Parts Components
const ModalHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
);

const ModalTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
);

const ModalDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
);

const ModalContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pt-0', className)} {...props} />
);

const ModalFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-end space-x-2 p-6 pt-0', className)} {...props} />
);

export { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter };