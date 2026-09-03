import { apiClient } from '@/lib/api/client'
import { ApiResponse } from '@/lib/types/api'
import { Shipment } from '@/lib/types/constant'

export interface GetUserShipmentsResponse extends ApiResponse<Shipment[]> {
  data: Shipment[]
  meta: {
    isFirstPage: boolean
    isLastPage: boolean
    currentPage: number
    previousPage: number | null
    nextPage: number | null
    pageCount: number
    totalCount: number
  }
}

export interface AdminShipment {
  id: string
  shipmentId: string
  customerName: string
  vehicle: string
  route: string
  status: string
}

export interface GetAdminShipmentsResponse extends ApiResponse<AdminShipment[]> {
  data: AdminShipment[]
  meta: {
    isFirstPage: boolean
    isLastPage: boolean
    currentPage: number
    previousPage: number | null
    nextPage: number | null
    pageCount: number
    totalCount: number
  }
}

export interface GetAdminShipmentMetricsResponse extends ApiResponse<{ all: number, active: number, completed: number, delayed: number }> {
  data: {
    all: number
    active: number
    completed: number
    delayed: number
  }
}

export const shipmentApi = {
  getUserShipments(userId: string, params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<GetUserShipmentsResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.status && params.status !== "All Shipments" && params.status !== "All") query.append('status', params.status)
    if (params?.search) query.append('search', params.search)
    
    const queryString = query.toString()
    return apiClient.get<GetUserShipmentsResponse>(`/shipments/user/${userId}${queryString ? `?${queryString}` : ''}`)
  },

  getAdminShipments(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<GetAdminShipmentsResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.status && params.status !== "All Shipments" && params.status !== "All" && params.status !== "Status") query.append('status', params.status)
    if (params?.search) query.append('search', params.search)
    
    const queryString = query.toString()
    return apiClient.get<GetAdminShipmentsResponse>(`/shipments/admin${queryString ? `?${queryString}` : ''}`)
  },

  getAdminShipmentMetrics(): Promise<GetAdminShipmentMetricsResponse> {
    return apiClient.get<GetAdminShipmentMetricsResponse>('/shipments/admin/metrics')
  },

  createShipment(payload: { quoteRequestId: string }): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/shipments/create', payload)
  }
}
