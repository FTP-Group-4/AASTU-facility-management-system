import type { User, Report, Block, Notification, Stats, PerformanceMetrics } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@aastu.edu.et',
    name: 'John Doe',
    nameAm: 'ጆን ዶ',
    role: 'reporter',
    block: 'Block A',
    phone: '+251911234567',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date()
  },
  {
    id: '2',
    email: 'coordinator@aastu.edu.et',
    name: 'Sarah Johnson',
    nameAm: 'ሳራ ጆንሰን',
    role: 'coordinator',
    block: 'Block A',
    phone: '+251922345678',
    createdAt: new Date('2023-06-01'),
    lastLogin: new Date()
  },
  {
    id: '3',
    email: 'fixer@aastu.edu.et',
    name: 'Michael Smith',
    nameAm: 'ሚካኤል ስሚዝ',
    role: 'fixer',
    phone: '+251933456789',
    createdAt: new Date('2023-08-10'),
    lastLogin: new Date()
  },
  {
    id: '4',
    email: 'admin@aastu.edu.et',
    name: 'Admin User',
    nameAm: 'አስተዳዳሪ',
    role: 'admin',
    phone: '+251944567890',
    createdAt: new Date('2023-01-01'),
    lastLogin: new Date()
  }
];

// Mock Blocks
export const mockBlocks: Block[] = [
  {
    id: '1',
    name: 'Block A',
    nameAm: 'ብሎክ ሀ',
    code: 'BLK-A',
    coordinatorId: '2',
    floors: 5,
    status: 'active'
  },
  {
    id: '2',
    name: 'Block B',
    nameAm: 'ብሎክ ለ',
    code: 'BLK-B',
    floors: 4,
    status: 'active'
  },
  {
    id: '3',
    name: 'Block C',
    nameAm: 'ብሎክ ሐ',
    code: 'BLK-C',
    floors: 6,
    status: 'active'
  }
];

// Mock Reports
export const mockReports: Report[] = [
  {
    id: '1',
    ticketNumber: 'AASTU-2026-001',
    reporterId: '1',
    reporter: mockUsers[0],
    category: 'plumbing',
    priority: 'high',
    status: 'in-progress',
    location: {
      block: 'Block A',
      floor: '3',
      room: '304',
      description: 'Third floor, Room 304, near main staircase'
    },
    title: 'Leaking Water Pipe',
    description: 'Water pipe in the bathroom is leaking continuously. Water is spreading to the hallway.',
    photos: [],
    assignedTo: '3',
    fixer: mockUsers[2],
    coordinatorId: '2',
    coordinator: mockUsers[1],
    slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    timeline: [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        action: 'Report submitted',
        actionAm: 'ሪፖርት ቀረበ',
        userId: '1',
        user: mockUsers[0]
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        action: 'Report approved and assigned',
        actionAm: 'ሪፖርት ጸድቆ ተመድቧል',
        userId: '2',
        user: mockUsers[1]
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        action: 'Work started',
        actionAm: 'ስራ ተጀመረ',
        userId: '3',
        user: mockUsers[2]
      }
    ]
  },
  {
    id: '2',
    ticketNumber: 'AASTU-2026-002',
    reporterId: '1',
    reporter: mockUsers[0],
    category: 'electrical',
    priority: 'emergency',
    status: 'submitted',
    location: {
      block: 'Block B',
      floor: '2',
      room: '201',
      description: 'Second floor, Lecture Hall 201'
    },
    title: 'Electrical Sparking',
    description: 'Electrical socket is sparking. Potential fire hazard. Room evacuated.',
    photos: [],
    slaDeadline: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    timeline: [
      {
        id: '1',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        action: 'Report submitted',
        actionAm: 'ሪፖርት ቀረበ',
        userId: '1',
        user: mockUsers[0]
      }
    ]
  },
  {
    id: '3',
    ticketNumber: 'AASTU-2026-003',
    reporterId: '1',
    reporter: mockUsers[0],
    category: 'cleaning',
    priority: 'medium',
    status: 'completed',
    location: {
      block: 'Block A',
      floor: '1',
      room: 'Lobby',
      description: 'Main entrance lobby'
    },
    title: 'Floor Cleaning Required',
    description: 'Lobby floor needs cleaning after event.',
    photos: [],
    assignedTo: '3',
    fixer: mockUsers[2],
    coordinatorId: '2',
    coordinator: mockUsers[1],
    slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    timeline: [
      {
        id: '1',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        action: 'Report submitted',
        actionAm: 'ሪፖርት ቀረበ',
        userId: '1',
        user: mockUsers[0]
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        action: 'Report approved and assigned',
        actionAm: 'ሪፖርት ጸድቆ ተመድቧል',
        userId: '2',
        user: mockUsers[1]
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        action: 'Work completed',
        actionAm: 'ስራ ተጠናቋል',
        userId: '3',
        user: mockUsers[2]
      }
    ]
  }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    type: 'alert',
    title: 'Report Approved',
    titleAm: 'ሪፖርት ጸድቋል',
    message: 'Your report AASTU-2026-001 has been approved and assigned.',
    messageAm: 'የእርስዎ ሪፖርት AASTU-2026-001 ጸድቆ ተመድቧል።',
    read: false,
    actionUrl: '/reports/1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    relatedReportId: '1'
  },
  {
    id: '2',
    userId: '2',
    type: 'warning',
    title: 'Emergency Report',
    titleAm: 'የአደጋ ጊዜ ሪፖርት',
    message: 'New emergency report requires immediate attention.',
    messageAm: 'አዲስ የአደጋ ጊዜ ሪፖርት አፋጣኝ ትኩረት ይፈልጋል።',
    read: false,
    actionUrl: '/reports/2',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    relatedReportId: '2'
  }
];

// Mock Stats
export const mockStats: Stats = {
  total: 245,
  submitted: 12,
  inProgress: 45,
  completed: 178,
  rejected: 10,
  avgResolutionTime: 4.5, // hours
  slaCompliance: 92 // percentage
};

// Mock Performance Metrics
export const mockPerformanceMetrics: PerformanceMetrics[] = [
  {
    userId: '3',
    totalAssigned: 156,
    completed: 142,
    avgCompletionTime: 3.8,
    slaCompliance: 94,
    rating: 4.7
  }
];

// SLA Times (in hours)
export const SLA_TIMES = {
  emergency: 1,
  high: 4,
  medium: 24,
  low: 72
};

// Helper function to calculate time remaining
export function getTimeRemaining(deadline: Date): {
  hours: number;
  minutes: number;
  isOverdue: boolean;
} {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const isOverdue = diff < 0;
  const totalMinutes = Math.abs(Math.floor(diff / 1000 / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes, isOverdue };
}

// Helper to format time remaining
export function formatTimeRemaining(deadline: Date, language: 'en' | 'am' = 'en'): string {
  const { hours, minutes, isOverdue } = getTimeRemaining(deadline);
  
  if (language === 'am') {
    if (isOverdue) {
      return `${hours}ሰ ${minutes}ደ በዘገየ`;
    }
    return `${hours}ሰ ${minutes}ደ ይቀራል`;
  }
  
  if (isOverdue) {
    return `${hours}h ${minutes}m overdue`;
  }
  return `${hours}h ${minutes}m remaining`;
}
