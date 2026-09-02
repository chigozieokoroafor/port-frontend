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
  }
}
