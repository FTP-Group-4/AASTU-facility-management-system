// Type Definitions for AASTU Facilities Management System

export type UserRole = 'reporter' | 'coordinator' | 'fixer' | 'admin';

export type ReportStatus = 
  | 'submitted' 
  | 'reviewing' 
  | 'approved' 
  | 'assigned' 
  | 'in-progress' 
  | 'completed' 
  | 'rejected';

export type Priority = 'emergency' | 'high' | 'medium' | 'low';

export type Category = 
  | 'plumbing' 
  | 'electrical' 
  | 'structural' 
  | 'hvac' 
  | 'cleaning' 
  | 'landscaping' 
  | 'it' 
  | 'furniture' 
  | 'other';

export type Language = 'en' | 'am';

export type Theme = 'light' | 'dark' | 'high-contrast';

export type NotificationType = 'alert' | 'warning' | 'info' | 'success';

export interface User {
  id: string;
  email: string;
  name: string;
  nameAm?: string;
  role: UserRole;
  block?: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Report {
  id: string;
  ticketNumber: string;
  reporterId: string;
  reporter: User;
  category: Category;
  priority: Priority;
  status: ReportStatus;
  location: {
    block: string;
    floor?: string;
    room?: string;
    description: string;
  };
  title: string;
  description: string;
  photos: string[];
  assignedTo?: string;
  fixer?: User;
  coordinatorId?: string;
  coordinator?: User;
  slaDeadline: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  rejectionReason?: string;
  timeline: TimelineEvent[];
  isDuplicate?: boolean;
  duplicateOf?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  action: string;
  actionAm?: string;
  userId: string;
  user: User;
  details?: string;
  detailsAm?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleAm?: string;
  message: string;
  messageAm?: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
  relatedReportId?: string;
}

export interface Block {
  id: string;
  name: string;
  nameAm?: string;
  code: string;
  coordinatorId?: string;
  coordinator?: User;
  floors: number;
  status: 'active' | 'inactive';
}

export interface Stats {
  total: number;
  submitted: number;
  inProgress: number;
  completed: number;
  rejected: number;
  avgResolutionTime: number;
  slaCompliance: number;
}

export interface PerformanceMetrics {
  userId: string;
  totalAssigned: number;
  completed: number;
  avgCompletionTime: number;
  slaCompliance: number;
  rating?: number;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingActions: number;
  lastSync?: Date;
  syncing: boolean;
}

export interface AppSettings {
  language: Language;
  theme: Theme;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
}
