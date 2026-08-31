// lib/quotes.ts
import { apiClient } from '@/lib/api/client'
import { ApiResponse, CreateQuotePayload, GenerateQuotePayload, UpdateQuotePayload, UpdateStatusPayload } from '@/lib/types/api'
import { Quote, QuoteRequest } from '@/lib/types/constant'


export interface QuoteRequestFilters {
    status?: 'pending' | 'approved' | 'rejected'
    page?: number
    limit?: number
    search?: string
    [key: string]: unknown
}

export interface CreateQuoteResponse extends ApiResponse<Quote> {
  data: Quote
}

export interface GetQuotesResponse extends ApiResponse<Quote[]> {
  data: Quote[]
}

export interface QuoteRequestResponse extends ApiResponse<QuoteRequest> {
  data: QuoteRequest
}

export interface GetQuoteRequestsResponse extends ApiResponse<{ requests: QuoteRequest[] }> {
  data: {
    requests: QuoteRequest[]
  }
}

export interface GetUserQuoteRequestsResponse extends ApiResponse<{ quoteRequests: QuoteRequest[], meta: any }> {
  data: {
    quoteRequests: QuoteRequest[]
    meta: {
      isFirstPage: boolean
      isLastPage: boolean
      currentPage: number
      previousPage: number | null
      nextPage: number | null
      pageCount?: number
      totalCount?: number
    }
  }
}

// Public API
export const quoteApi = {
  /** POST /api/quotes/request — Submit a new quote request (rate-limited: 5/hr) */
  createQuote(payload: CreateQuotePayload): Promise<CreateQuoteResponse> {
    return apiClient.post<CreateQuoteResponse>('/quotes/request', payload)
  },

  /** GET /api/quotes/track/:referenceId — Track a quote by its reference ID */
  trackQuote(referenceId: string): Promise<QuoteRequestResponse> {
    return apiClient.get<QuoteRequestResponse>(`/quotes/track/${referenceId}`)
  },

  /** GET /api/quotes/requests — List all quote requests (supports filters) */
  getAllQuoteRequests(filters?: QuoteRequestFilters): Promise<GetQuoteRequestsResponse> {
    return apiClient.get<GetQuoteRequestsResponse>('/quotes/requests')
  },

  /** GET /api/quotes/requests/user/:userId — List all quote requests by current user */
  getUserQuoteRequests(userId: string, params?: { page?: number; limit?: number }): Promise<GetUserQuoteRequestsResponse> {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    const queryString = query.toString()
    const url = `/quotes/requests/user/${userId}${queryString ? `?${queryString}` : ''}`
    return apiClient.get<GetUserQuoteRequestsResponse>(url)
  },

  /** GET /api/quotes/requests/:id — Get a specific quote request by ID */
  getQuoteRequestById(id: string): Promise<QuoteRequestResponse> {
    return apiClient.get<QuoteRequestResponse>(`/quotes/requests/${id}`)
  },
}

// Admin API
export const adminQuoteApi = {
  /** PATCH /api/admin/quotes/requests/approve/:id — Approve a quote request */
  approveQuoteRequest(id: string, payload?: UpdateStatusPayload): Promise<QuoteRequestResponse> {
    return apiClient.patch<QuoteRequestResponse>(`/admin/quotes/requests/approve/${id}`, payload)
  },

  /** PATCH /api/admin/quotes/requests/reject/:id — Reject a quote request */
  rejectQuoteRequest(id: string, payload?: UpdateStatusPayload): Promise<QuoteRequestResponse> {
    return apiClient.patch<QuoteRequestResponse>(`/admin/quotes/requests/reject/${id}`, payload)
  },

  /** DELETE /api/admin/quotes/requests/:id — Delete a quote request */
  deleteQuoteRequest(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<ApiResponse<null>>(`/admin/quotes/requests/${id}`)
  },

  /** POST /api/admin/quotes/:requestId/generate — Generate a pricing quote from a request */
  generateQuote(requestId: string, payload: GenerateQuotePayload): Promise<CreateQuoteResponse> {
    return apiClient.post<CreateQuoteResponse>(`/admin/quotes/${requestId}/generate`, payload)
  },

  /** GET /api/admin/quotes — List all generated quotes */
  getAllQuotes(): Promise<GetQuotesResponse> {
    return apiClient.get<GetQuotesResponse>('/admin/quotes')
  },

  /** GET /api/admin/quotes/request/:id — Get a specific quote's details */
  getQuoteRequestById(id: string): Promise<CreateQuoteResponse> {
    return apiClient.get<CreateQuoteResponse>(`/admin/quotes/request/${id}`)
  },

  /** GET /api/admin/quotes/:id — Get a specific quote's details */
  getQuoteById(id: string): Promise<CreateQuoteResponse> {
    return apiClient.get<CreateQuoteResponse>(`/admin/quotes/${id}`)
  },


  /** PUT /api/admin/quotes/:id — Update a quote's details */
  updateQuote(id: string, payload: UpdateQuotePayload): Promise<CreateQuoteResponse> {
    return apiClient.put<CreateQuoteResponse>(`/admin/quotes/${id}`, payload)
  },

  /** POST /api/admin/quotes/:id/send — Send the quote email to the customer */
  sendQuote(id: string): Promise<ApiResponse<null>> {
    return apiClient.post<ApiResponse<null>>(`/admin/quotes/${id}/send`)
  },
}