import { Department, CreateDepartmentInput, UpdateDepartmentInput } from '@/types/department'
import { apiUrl } from '@/lib/api-client'

const CACHE_KEY = 'org_departments_cache'

const FALLBACK_DEPARTMENTS: Department[] = [
  {
    id: '6af787790d2e1b4e3b7cbf71',
    name: 'Donations & Seva',
    slug: 'donations',
    description: 'Centralized fund collection, seva contributions, and donor receipts.',
    managerName: 'Bhaja Gauranga Dasa',
    managerEmail: 'bhajagaurangadasa.mmd@gmail.com',
    status: 'active',
    totalQrs: 0,
    totalMembers: 1,
  },
  {
    id: '6af787790d2e1b4e3b7cbf7d',
    name: 'Events & Festivals',
    slug: 'events',
    description: 'Festival registrations, VIP passes, cultural programs, and crowd logistics.',
    managerName: 'Events Team',
    managerEmail: 'events@organization.local',
    status: 'active',
    totalQrs: 0,
    totalMembers: 1,
  },
  {
    id: '6af7877a0d2e1b4e3b7cbf95',
    name: 'Book Distribution',
    slug: 'book-distribution',
    description: 'Literature counters, publications, educational kiosks, and outreach books.',
    managerName: 'Bhaja Gauranga Dasa',
    managerEmail: 'bhajagaurangadasa.mmd@gmail.com',
    status: 'active',
    totalQrs: 0,
    totalMembers: 1,
  },
  {
    id: '6af7877a0d2e1b4e3b7cbfa1',
    name: 'Administration',
    slug: 'admin',
    description: 'Executive governance, IT systems, compliance, and department coordination.',
    managerName: 'Yash Pouranik',
    managerEmail: 'yashpouranik124@gmail.com',
    status: 'active',
    totalQrs: 0,
    totalMembers: 1,
  },
]

function getCachedDepartments(): Department[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // Ignore cache parse errors
  }
  return null
}

function saveCachedDepartments(depts: Department[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(depts))
  } catch {
    // Ignore storage quota errors
  }
}

export const departmentService = {
  async getAll(): Promise<Department[]> {
    try {
      const res = await fetch(apiUrl('/api/admin/departments'))
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      if (data && data.success && Array.isArray(data.data)) {
        saveCachedDepartments(data.data)
        return data.data
      }
    } catch {
      // Return cached live data when offline or server warming up
      const cached = getCachedDepartments()
      if (cached) return cached
    }
    return getCachedDepartments() || FALLBACK_DEPARTMENTS
  },

  async create(input: CreateDepartmentInput): Promise<Department> {
    const res = await fetch(apiUrl('/api/admin/departments'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to create department')
    }

    const created = result.data
    const current = getCachedDepartments() || [...FALLBACK_DEPARTMENTS]
    saveCachedDepartments([...current, created])

    return created
  },

  async update(id: string, input: UpdateDepartmentInput): Promise<Department> {
    const res = await fetch(apiUrl(`/api/admin/departments/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to update department')
    }

    const updated = result.data
    const current = getCachedDepartments() || [...FALLBACK_DEPARTMENTS]
    const updatedList = current.map((d) =>
      d.id === id || d.slug === id ? { ...d, ...input } : d
    )
    saveCachedDepartments(updatedList)

    return updated
  },

  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(apiUrl(`/api/admin/departments/${id}`), {
      method: 'DELETE',
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to delete department')
    }

    const current = getCachedDepartments() || [...FALLBACK_DEPARTMENTS]
    const filtered = current.filter((d) => d.id !== id && d.slug !== id)
    saveCachedDepartments(filtered)

    return result
  },
}
