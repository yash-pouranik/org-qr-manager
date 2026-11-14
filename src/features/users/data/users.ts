import { User } from './schema'

export const users: User[] = [
  {
    id: 'user_001',
    firstName: 'System',
    lastName: 'Admin',
    username: 'superadmin',
    email: 'admin@organization.local',
    phoneNumber: '+91 9876543210',
    status: 'active',
    role: 'super_admin',
    departmentId: null,
    departmentName: 'All Departments',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
]
