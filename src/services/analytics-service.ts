import axios from 'axios'

export interface TimeSeriesPoint {
  date: string
  label: string
  scans: number
  uniqueVisitors: number
}

export interface BreakdownItem {
  name: string
  value: number
}

export interface TopQrItem {
  id: string
  name: string
  departmentName: string
  type: string
  totalScans: number
  uniqueVisitors: number
  lastScannedAt: string | null
  shortCode: string | null
}

export interface TopDepartmentItem {
  id: string
  name: string
  totalScans: number
}

export interface AnalyticsSummary {
  summary: {
    totalScans: number
    uniqueVisitors: number
    mobileShare: number
    activeQrsCount: number
  }
  timeSeries: TimeSeriesPoint[]
  deviceBreakdown: BreakdownItem[]
  osBreakdown: BreakdownItem[]
  browserBreakdown: BreakdownItem[]
  topQrs: TopQrItem[]
  topDepartments: TopDepartmentItem[]
}

export const analyticsService = {
  /**
   * Fetch aggregated analytics summary across time range and department scope
   */
  async getSummary(params?: {
    departmentId?: string
    qrCodeId?: string
    timeRange?: 'today' | '7d' | '30d' | '90d' | 'all'
  }): Promise<AnalyticsSummary> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.departmentId && params.departmentId !== 'all') {
        queryParams.set('department_id', params.departmentId)
      }
      if (params?.qrCodeId && params.qrCodeId !== 'all') {
        queryParams.set('qr_code_id', params.qrCodeId)
      }
      if (params?.timeRange) {
        queryParams.set('time_range', params.timeRange)
      }

      const res = await axios.get<{ success: boolean; data: AnalyticsSummary }>(
        `/api/admin/analytics/summary?${queryParams.toString()}`
      )
      return res.data.data
    } catch (err) {
      console.warn('Analytics API call failed, using empty baseline:', err)
      return {
        summary: {
          totalScans: 0,
          uniqueVisitors: 0,
          mobileShare: 0,
          activeQrsCount: 0,
        },
        timeSeries: [],
        deviceBreakdown: [],
        osBreakdown: [],
        browserBreakdown: [],
        topQrs: [],
        topDepartments: [],
      }
    }
  },

  /**
   * Simulate sample test scans for testing & demonstration
   */
  async simulateScans(count = 15, qrCodeId?: string): Promise<{ success: boolean; message: string }> {
    const res = await axios.post<{ success: boolean; message: string }>(
      '/api/admin/analytics/simulate-scan',
      { count, qrCodeId }
    )
    return res.data
  },

  /**
   * Run custom MongoDB aggregation pipeline
   */
  async executePipeline(pipeline: any[]): Promise<any> {
    const res = await axios.post('/api/admin/analytics/aggregate', { pipeline })
    return res.data
  },
}
