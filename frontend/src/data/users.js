/**
 * Mock users data
 * Matches USERS entity: User ID, Name, Email, Password, Phone, Role, Created At
 * Passwords shown as hashed placeholders — never store real passwords in frontend
 */
export const users = [
  {
    id: 1,
    name: 'Arjun Mehta',
    email: 'arjun@example.com',
    phone: '9876543210',
    role: 'GUEST',
    createdAt: '2025-01-15',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543211',
    role: 'HOST',
    createdAt: '2024-11-20',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 3,
    name: 'Rohan Kapoor',
    email: 'rohan@example.com',
    phone: '9876543212',
    role: 'HOST',
    createdAt: '2024-10-05',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 4,
    name: 'Sneha Patel',
    email: 'sneha@example.com',
    phone: '9876543213',
    role: 'GUEST',
    createdAt: '2025-03-10',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 5,
    name: 'Admin User',
    email: 'admin@staynest.com',
    phone: '9876543200',
    role: 'ADMIN',
    createdAt: '2024-01-01',
    avatar: null,
  },
  {
    id: 6,
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    phone: '9876543214',
    role: 'GUEST',
    createdAt: '2025-05-18',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 7,
    name: 'Ananya Iyer',
    email: 'ananya@example.com',
    phone: '9876543215',
    role: 'HOST',
    createdAt: '2025-02-14',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  },
];

/**
 * Mock credentials for login simulation
 * In a real app, password validation happens on the backend
 */
export const mockCredentials = [
  { email: 'arjun@example.com', password: 'guest123', userId: 1 },
  { email: 'priya@example.com', password: 'host123', userId: 2 },
  { email: 'admin@staynest.com', password: 'admin123', userId: 5 },
];
