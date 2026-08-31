// API Response Types
export interface ApiResponse<T> {
    success: boolean
    message?: string
    data?: T
    error?: string
    meta?: {
        isFirstPage: boolean
        isLastPage: boolean
        currentPage: number
        previousPage: number | null
        nextPage: number | null
        pageCount: number
        totalCount: number
    }
}

// Auth Types
export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    firstName: string
    lastName: string
    email: string
    password: string
    isAgreedToTermsAndConditions: boolean
    isSubscribedToNewsletter: boolean
}

export interface LoginResponse {
    success: boolean
    message: string
    data: {
        token: string
        refreshToken?: string
        user: AuthUser
    }
}

export interface VerifyAccountResponse {
    success: boolean
    message: string
}

export interface AuthUser {
    id: string
    email: string
    firstName: string
    lastName: string
    fullName: string
    phone: string
    role: string
    status: string
    avatar?: string
}

export interface RefreshTokenResponse {
    success: boolean
    message: string
    data: {
        token: string
    }
}

// Shipment Types
export interface Shipment {
    id: string
    vehicleType: string
    route: {
        origin: string
        destination: string
    }
    status: string
    trackingNumber: string
    estimatedArrival: string
}

export interface Quote {
    id: string
    vehicleType: string
    originPort: string
    destinationPort: string
    amount: number
    currency: string
    createdAt: string
}

// Error Types
export class ApiError extends Error {
    constructor(
        public status: number,
        public message: string,
        public data?: unknown
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

export interface CreateQuotePayload {
    customer: {
        fullName: string
        email: string
        phone: string
    }
    vehicle: {
        type: string
        vin: string
        make: string
        model: string
        year: string
        condition: 'Running' | 'Non-running' | ''
        dimensions: {
            length: number
            width: number
            height: number
        }
        weight: number
    }
    route: {
        originCountry: string
        originPort: string
        destinationCountry: string
        destinationPort: string
        shippingDate?: string
    }
}

export interface GenerateQuotePayload {
  price: number
  currency?: string
  notes?: string
  validUntil?: string
}

export interface UpdateQuotePayload {
  estimatedPrice?: number
  currency?: string
  notes?: string
  validUntil?: string
  status?: string
}

export interface UpdateStatusPayload {
  reason?: string
  notes?: string
}
