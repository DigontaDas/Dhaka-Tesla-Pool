// Oi Tesla - Frontend API Client
// Connects to Express backend with bearer token & demo actor headers

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

export class ApiClient {
  private static token: string | null = null;
  private static userId: string | null = null;

  public static setAuth(token: string | null, userId: string | null) {
    this.token = token;
    this.userId = userId;
  }

  private static getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.userId) {
      headers['x-user-id'] = this.userId;
    }
    return headers;
  }

  public static async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to API' };
    }
  }

  public static async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to API' };
    }
  }

  public static async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to API' };
    }
  }
}
