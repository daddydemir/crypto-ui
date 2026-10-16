import { API_BASE_URL, AUTH_BASE_URL, MOSAIC_BASE_URL } from './config';
import { recordAuthDiagnostic } from '@/services/authDiagnostics';

class HttpClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const token = localStorage.getItem('token');
        
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        };

        const config: RequestInit = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const text = await response.text();
                let errorData: { message?: string } | null = null;
                try {
                    errorData = text ? JSON.parse(text) : null;
                } catch {
                    errorData = null;
                }
                if (response.status === 401 && !endpoint.includes('/login')) {
                    const reason = response.headers.get('X-Auth-Reason') || errorData?.message || 'unspecified';
                    recordAuthDiagnostic({
                        kind: 'unauthorized',
                        method: config.method || 'GET',
                        path: new URL(url, window.location.origin).pathname,
                        status: response.status,
                        reason,
                    });
                    window.dispatchEvent(new CustomEvent('auth-401-unauthorized', { detail: { reason } }));
                }
                const message = errorData?.message || text.trim() || `İstek başarısız oldu (${response.status})`;
                const error = Object.assign(new Error(message), { status: response.status, data: errorData });
                throw error;
            }

            // check if response is empty to avoid json parse error
            const text = await response.text();
            return text ? JSON.parse(text) : {} as T;
        } catch (error) {
            // The caller owns presentation/logging. Logging here caused every handled
            // request failure to be printed again by each service and component.
            throw error;
        }
    }

    get<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    post<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    put<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    patch<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }

    delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

export const http = new HttpClient(API_BASE_URL);
export const authHttp = new HttpClient(AUTH_BASE_URL);
export const mosaicHttp = new HttpClient(MOSAIC_BASE_URL);

