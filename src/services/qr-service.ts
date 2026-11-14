export interface QrCodeItem {
  id: string
  name: string
  category: 'dynamic' | 'static'
  type: string
  shortCode: string | null
  shortUrl: string | null
  destinationUrl: string
  departmentId: string
  departmentName: string
  status: 'active' | 'paused' | 'archived'
  totalScans: number
  uniqueVisitors: number
  lastScannedAt: string | null
  isDeleted: boolean
  deletedAt: string | null
  styleOptions?: any
  donationConfig?: {
    payeeVpa: string
    payeeName: string
    defaultAmounts: number[]
    sevaNote: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateQrInput {
  name: string
  category: 'dynamic' | 'static'
  type: string
  destinationUrl: string
  departmentId: string
  shortCode?: string
  styleOptions?: any
  donationConfig?: any
}

export interface UpdateQrInput {
  name?: string
  destinationUrl?: string
  status?: 'active' | 'paused' | 'archived'
  departmentId?: string
}

const FALLBACK_QR_CODES: QrCodeItem[] = []

export const qrService = {
  async getAll(params?: {
    trash?: boolean
    departmentId?: string
    category?: string
    search?: string
  }): Promise<QrCodeItem[]> {
    try {
      const q = new URLSearchParams()
      if (params?.trash) q.append('trash', 'true')
      if (params?.departmentId) q.append('departmentId', params.departmentId)
      if (params?.category) q.append('category', params.category)
      if (params?.search) q.append('search', params.search)

      const url = `/api/admin/qr-codes${q.toString() ? `?${q.toString()}` : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data && data.success && Array.isArray(data.data)) {
        return data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          type: item.type,
          shortCode: item.short_code,
          shortUrl: item.short_url,
          destinationUrl: item.destination_url,
          departmentId: item.department_id,
          departmentName: item.department_name,
          status: item.status,
          totalScans: item.total_scans,
          uniqueVisitors: item.unique_visitors,
          lastScannedAt: item.last_scanned_at,
          isDeleted: item.isDeleted,
          deletedAt: item.deletedAt,
          styleOptions: item.style_options,
          donationConfig: item.donation_config,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }))
      }
    } catch {
      // Offline fallback
    }

    const isTrash = params?.trash === true
    return FALLBACK_QR_CODES.filter((q) => (isTrash ? q.isDeleted : !q.isDeleted))
  },

  async create(input: CreateQrInput): Promise<QrCodeItem> {
    const res = await fetch('/api/admin/qr-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to create QR code')
    }

    const item = result.data
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      type: item.type,
      shortCode: item.short_code,
      shortUrl: item.short_url,
      destinationUrl: item.destination_url,
      departmentId: item.department_id,
      departmentName: item.department_name,
      status: item.status,
      totalScans: item.total_scans,
      uniqueVisitors: item.unique_visitors,
      lastScannedAt: item.last_scanned_at,
      isDeleted: item.isDeleted,
      deletedAt: item.deletedAt,
      styleOptions: item.style_options,
      donationConfig: item.donation_config,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }
  },

  async update(id: string, input: UpdateQrInput): Promise<QrCodeItem> {
    const res = await fetch(`/api/admin/qr-codes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to update QR code')
    }

    const item = result.data
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      type: item.type,
      shortCode: item.short_code,
      shortUrl: item.short_url,
      destinationUrl: item.destination_url,
      departmentId: item.department_id,
      departmentName: item.department_name,
      status: item.status,
      totalScans: item.total_scans,
      uniqueVisitors: item.unique_visitors,
      lastScannedAt: item.last_scanned_at,
      isDeleted: item.isDeleted,
      deletedAt: item.deletedAt,
      styleOptions: item.style_options,
      donationConfig: item.donation_config,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }
  },

  async restore(id: string): Promise<void> {
    const res = await fetch(`/api/admin/qr-codes/${id}/restore`, {
      method: 'POST',
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to restore QR code')
    }
  },

  async delete(id: string, permanent = false): Promise<void> {
    const res = await fetch(`/api/admin/qr-codes/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE',
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to delete QR code')
    }
  },

  async getDonationCampaign(slug: string): Promise<{
    name: string
    departmentName: string
    donationConfig: {
      payeeVpa: string
      payeeName: string
      defaultAmounts: number[]
      sevaNote: string
    }
  }> {
    try {
      const res = await fetch(`/api/public/donation/${slug}`)
      if (!res.ok) throw new Error('Campaign not found')
      const json = await res.json()
      if (json && json.success) return json.data
    } catch {
      // Fallback
    }

    return {
      name: 'Annadhanam Seva Campaign',
      departmentName: 'Kitchen & Prasadam',
      donationConfig: {
        payeeVpa: 'temple.annadhanam@okhdfcbank',
        payeeName: 'Annadhanam Seva Trust',
        defaultAmounts: [101, 251, 501, 1100, 5001],
        sevaNote: 'Annadhanam Sponsorship',
      },
    }
  },
}
