import { apiClient } from '@/lib/api/client'
import { ApiResponse } from '@/lib/types/api'

export interface CreatePaymentPayload {
  quoteId: string
  paymentMethod: 'stripe' | 'paypal'
}

export interface PaymentData {
  provider: string
  checkoutUrl: string
  sessionId?: string
  orderId?: string
  expiresAt?: number
  paymentId: string
}

export interface CreatePaymentResponse extends ApiResponse<PaymentData> {
  data: PaymentData
}

import { Payment } from '@/lib/types/constant'

export interface GetUserPaymentHistoryResponse extends ApiResponse<Payment[]> {
  data: Payment[]
  meta: {
    isFirstPage: boolean
    isLastPage: boolean
    currentPage: number
    previousPage: number | null
    nextPage: number | null
  }
}

export interface AdminPayment {
  id: string
  paymentId: string
  customerName: string
  shipmentId: string | null
  date: string
  amount: number
  currency: string
  status: string
  receiptUrl: string | null
}

export interface GetAdminPaymentsResponse extends ApiResponse<AdminPayment[]> {
  data: AdminPayment[]
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

export const paymentApi = {
  createPaymentV2(payload: CreatePaymentPayload): Promise<CreatePaymentResponse> {
    return apiClient.post<CreatePaymentResponse>('/payment/v2/create', payload)
  },

  getUserPaymentHistory(userId: string, params?: { page?: number; limit?: number }): Promise<GetUserPaymentHistoryResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    const queryString = query.toString()
    return apiClient.get<GetUserPaymentHistoryResponse>(`/payment/history/user/${userId}${queryString ? `?${queryString}` : ''}`)
  },

  getAdminPayments(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<GetAdminPaymentsResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.status && params.status !== "All Payments" && params.status !== "All" && params.status !== "Status") {
      query.append('status', params.status)
    }
    if (params?.search) query.append('search', params.search)
    
    const queryString = query.toString()
    return apiClient.get<GetAdminPaymentsResponse>(`/payment${queryString ? `?${queryString}` : ''}`)
  },

  getAdminPaymentMetrics(): Promise<GetAdminPaymentMetricsResponse> {
    return apiClient.get<GetAdminPaymentMetricsResponse>('/payment/admin/metrics')
  }
}

export interface GetAdminPaymentMetricsResponse extends ApiResponse<{ totalReceived: number, pendingPayments: number, failedPayments: number }> {
  data: {
    totalReceived: number
    pendingPayments: number
    failedPayments: number
  }
}
