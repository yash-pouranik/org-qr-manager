import { Department, CreateDepartmentInput, UpdateDepartmentInput } from '@/types/department'

const FALLBACK_DEPARTMENTS: Department[] = [
  {
    id: 'dept_01',
    name: 'Donations & Seva',
    slug: 'donations',
    description: 'Centralized fund collection, seva contributions, and donor receipts.',
    managerName: 'Organization Administrator',
    managerEmail: 'admin@organization.local',
    status: 'active',
    totalQrs: 0,
    totalMembers: 0,
  },
  {
    id: 'dept_02',
    name: 'Events & Festivals',
    slug: 'events',
    description: 'Festival registrations, VIP passes, cultural programs, and crowd logistics.',
    managerName: 'Events Lead',
    managerEmail: 'events@organization.local',
    status: 'active',
    totalQrs: 0,
    totalMembers: 0,
  },
  {
    id: 'dept_03',
    name: 'Kitchen & Prasadam',
    slug: 'kitchen',
    description: 'Annadhanam sponsorship, daily meal passes, and prasad distribution counters.',
    managerName: 'Kitchen Incharge',
    managerEmail: 'kitchen@organization.local',
    status: 'active',
    totalQrs: 0,
    totalMembers: 0,
  },
  {
    id: 'dept_04',
    name: 'Book Distribution',
    slug: 'book-distribution',
    description: 'Literature counters, publications, educational kiosks, and outreach books.',
    managerName: 'Literature Coordinator',
    managerEmail: 'books@organization.local',
    status: 'active',
    totalQrs: 0,
    totalMembers: 0,
  },
  {
    id: 'dept_05',
    name: 'Administration',
    slug: 'administration',
    description: 'General temple management, IT infrastructure, access badges, and audit ops.',
    managerName: 'Admin Officer',
    managerEmail: 'admin@organization.local',
    status: 'active',
    totalQrs: 0,
    totalMembers: 0,
  },
]

export const departmentService = {
  async getAll(): Promise<Department[]> {
    try {
      const res = await fetch('/api/admin/departments')
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      if (data && data.success && Array.isArray(data.data)) {
        return data.data
      }
    } catch {
      // Return fallback when offline or during testing
    }
    return FALLBACK_DEPARTMENTS
  },

  async create(input: CreateDepartmentInput): Promise<Department> {
    const res = await fetch('/api/admin/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to create department')
    }

    return result.data
  },

  async update(id: string, input: UpdateDepartmentInput): Promise<Department> {
    const res = await fetch(`/api/admin/departments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to update department')
    }

    return result.data
  },

  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`/api/admin/departments/${id}`, {
      method: 'DELETE',
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to delete department')
    }

    return result
  },
}
