import { User } from '@/features/users/data/schema'
import { users as fallbackUsers } from '@/features/users/data/users'

export interface CreateUserInput {
  firstName: string
  lastName: string
  username: string
  email: string
  password?: string
  phoneNumber?: string
  role: string
  departmentId?: string | null
  departmentName?: string | null
}

export interface UpdateUserRoleInput {
  targetUserId: string
  newRole?: string
  newStatus?: 'active' | 'inactive' | 'invited' | 'suspended'
  newDepartmentId?: string | null
  requesterEmail?: string
}

export const userService = {
  async getAll(): Promise<User[]> {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const json = await res.json()
      if (json && json.success && Array.isArray(json.data)) {
        return json.data.map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        }))
      }
    } catch {
      // Offline fallback
    }
    return fallbackUsers
  },

  async create(input: CreateUserInput): Promise<User> {
    const payload = {
      ...input,
      password: input.password || `Invite@${Math.floor(100000 + Math.random() * 900000)}`,
    }
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to create user')
    }

    return {
      ...result.data,
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    }
  },

  async updateRoleAndStatus(input: UpdateUserRoleInput): Promise<User> {
    const res = await fetch('/api/admin/users/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to update user role/status')
    }

    return {
      ...result.data,
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    }
  },

  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to delete user')
    }

    return result
  },
}
