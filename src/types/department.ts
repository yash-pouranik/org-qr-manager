export interface Department {
  id: string
  name: string
  slug: string
  description: string
  managerName: string
  managerEmail: string
  status: 'active' | 'archived'
  totalQrs: number
  totalMembers: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateDepartmentInput {
  name: string
  slug: string
  description?: string
  managerName?: string
  managerEmail?: string
}

export interface UpdateDepartmentInput {
  name?: string
  description?: string
  managerName?: string
  managerEmail?: string
  status?: 'active' | 'archived'
}
