import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'relative' = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'relative') {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
  }
  
  const options: Intl.DateTimeFormatOptions = format === 'long' 
    ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
  
  return d.toLocaleDateString('en-US', options);
}

export function formatPriority(priority: string) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function formatBlockNumber(blockId: number) {
  return `Block ${blockId}`;
}

export function getSLAHours(priority: 'emergency' | 'high' | 'medium' | 'low'): number {
  const slaHours = {
    emergency: 2,
    high: 24,
    medium: 72,
    low: 168,
  };
  return slaHours[priority];
}

export function calculateDeadline(submittedAt: Date | string, priority: string): Date {
  const start = typeof submittedAt === 'string' ? new Date(submittedAt) : submittedAt;
  const hours = getSLAHours(priority as any) || 168;
  return new Date(start.getTime() + hours * 60 * 60 * 1000);
}

export function isSLAOverdue(deadline: Date | string): boolean {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  return deadlineDate.getTime() < Date.now();
}

export function getSLAStatus(deadline: Date | string): 'normal' | 'warning' | 'critical' {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const hoursRemaining = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60);
  
  if (hoursRemaining <= 2) return 'critical';
  if (hoursRemaining <= 12) return 'warning';
  return 'normal';
}

export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@(aastu\.edu\.et|aastustudent\.edu\.et)$/;
  return regex.test(email);
}

export function validateBlockNumber(blockId: number): boolean {
  return blockId >= 1 && blockId <= 100;
}

export function compressImage(file: File, maxSize = 1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        } else if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to compress image'));
          },
          'image/jpeg',
          0.8
        );
      };
    };
    
    reader.onerror = reject;
  });
}