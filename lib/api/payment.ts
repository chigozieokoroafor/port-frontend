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

export const paymentApi = {
  createPaymentV2(payload: CreatePaymentPayload): Promise<CreatePaymentResponse> {
    return apiClient.post<CreatePaymentResponse>('/payment/v2/create', payload)
  }
}
