import { ApiError, ApiResponse } from '@/lib/types/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>
}

// Get token from localStorage (client-side only)
function getToken(): string | null {
    if (globalThis.window === undefined) return null
    return localStorage.getItem('auth_token')
}

// Set token in localStorage
function setToken(token: string): void {
    if (globalThis.window === undefined) return
    localStorage.setItem('auth_token', token)
}

// Remove token from localStorage
function removeToken(): void {
    if (globalThis.window === undefined) return
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
}

// Get refresh token
function getRefreshToken(): string | null {
    if (globalThis.window === undefined) return null
    return localStorage.getItem('refresh_token')
}

// Set refresh token
function setRefreshToken(token: string): void {
    if (globalThis.window === undefined) return
    localStorage.setItem('refresh_token', token)
}

async function request<T>( endpoint: string, options: RequestOptions = {} ): Promise<T> {
    
    const url = `${API_BASE_URL}${endpoint}`
    const token = getToken()

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
        ...options,
        headers,
    })

    const data = (await response.json()) as ApiResponse<T>

    if (!response.ok) {
        if (response.status === 401) {
            removeToken()
            if (globalThis.window !== undefined) {
                window.location.href = '/'
            }
        }
        const errorMessage = data.message || data.error || 'API request failed'
        throw new ApiError(response.status, errorMessage, data)
    }

    return data as T
}

// Public API client (no auth required)
export const apiClient = {
    get<T>(endpoint: string) {
        return request<T>(endpoint, { method: 'GET' })
    },

    post<T>(endpoint: string, body?: unknown) {
        return request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        })
    },

    put<T>(endpoint: string, body?: unknown) {
        return request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        })
    },

    patch<T>(endpoint: string, body?: unknown) {
        return request<T>(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        })
    },

    delete<T>(endpoint: string) {
        return request<T>(endpoint, { method: 'DELETE' })
    },
}

// Authentication-specific methods
export const authApi = {
    setToken,
    getToken,
    removeToken,
    setRefreshToken,
    getRefreshToken,
}
