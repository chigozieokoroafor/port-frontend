import { apiClient } from '@/lib/api/client'
import { ApiResponse } from '@/lib/types/api'

export interface AdminCustomerListItem {
  customerId: string
  customerName: string
  emailAddress: string
  numberOfShipments: number
  status: string
}

export interface GetCustomersResponse extends ApiResponse<{ customers: AdminCustomerListItem[], meta: any }> {
  data: {
    customers: AdminCustomerListItem[]
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
}

export interface GetCustomerMetricsResponse extends ApiResponse<{ all: number, active: number, inactive: number }> {
  data: {
    all: number
    active: number
    inactive: number
  }
}

export interface GetCustomerProfileResponse extends ApiResponse<any> {
  data: {
    id: string
    status: string
    initials: string
    firstName: string
    lastName: string
    name: string
    email: string
    phoneNumber: string | null
    company: string | null
    customerSince: string
  }
}

export const adminCustomerApi = {
  getCustomers(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<GetCustomersResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.status && params.status !== "All Customers" && params.status !== "All" && params.status !== "Status") {
      query.append('status', params.status)
    }
    if (params?.search) query.append('search', params.search)
    
    const queryString = query.toString()
    return apiClient.get<GetCustomersResponse>(`/customers${queryString ? `?${queryString}` : ''}`)
  },

  getCustomerMetrics(): Promise<GetCustomerMetricsResponse> {
    return apiClient.get<GetCustomerMetricsResponse>('/customers/metrics')
  },

  getCustomerProfile(id: string): Promise<GetCustomerProfileResponse> {
    return apiClient.get<GetCustomerProfileResponse>(`/customers/${id}`)
  }
}
