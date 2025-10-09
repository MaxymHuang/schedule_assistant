import type { 
  Equipment, 
  Booking, 
  BookingWithDetails, 
  BookingCreateRequest
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  }

  async register(email: string, password: string, fullName: string): Promise<void> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name: fullName,
      }),
    });
  }

  async getCurrentUser(): Promise<{
    id: number;
    email: string;
    name: string;
    role: 'user' | 'admin';
    created_at: string;
  }> {
    return this.request('/api/auth/me');
  }

  // Equipment endpoints
  async getEquipment(params?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<Equipment[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString();
    return this.request<Equipment[]>(`/api/equipment/${query ? `?${query}` : ''}`);
  }

  async getEquipmentById(id: number): Promise<Equipment> {
    return this.request<Equipment>(`/api/equipment/${id}`);
  }

  async checkAvailability(
    equipmentId: number,
    startDatetime: string,
    endDatetime: string
  ): Promise<{ is_available: boolean; conflicting_bookings: number }> {
    // Calculate duration in hours
    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    const durationHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    const params = new URLSearchParams({
      start_datetime: startDatetime,
      duration_hours: durationHours.toString(),
    });
    return this.request(`/api/equipment/${equipmentId}/availability?${params}`);
  }

  // Booking endpoints
  async getBookings(): Promise<BookingWithDetails[]> {
    return this.request<BookingWithDetails[]>('/api/bookings');
  }

  async getBooking(id: number): Promise<BookingWithDetails> {
    return this.request<BookingWithDetails>(`/api/bookings/${id}`);
  }

  async createBooking(booking: BookingCreateRequest): Promise<Booking> {
    return this.request<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  async getAvailableTimeSlots(
    equipmentId: number,
    date: string
  ): Promise<{ time_slots: string[] }> {
    return this.request(`/api/equipment/${equipmentId}/time-slots?date=${date}`);
  }

  async cancelBooking(id: number): Promise<void> {
    return this.request<void>(`/api/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  async getEquipmentBookings(
    equipmentId: number,
    startDate?: string,
    endDate?: string
  ): Promise<BookingWithDetails[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const query = params.toString();
    return this.request<BookingWithDetails[]>(`/api/bookings/equipment/${equipmentId}${query ? `?${query}` : ''}`);
  }

  // Admin Equipment Management endpoints
  async createEquipment(equipment: {
    name: string;
    model: string;
    description?: string;
    category: string;
    image_url?: string;
  }): Promise<Equipment> {
    return this.request<Equipment>('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(equipment),
    });
  }

  async updateEquipment(id: number, equipment: {
    name?: string;
    model?: string;
    description?: string;
    category?: string;
    status?: 'available' | 'borrowed';
    image_url?: string;
  }): Promise<Equipment> {
    return this.request<Equipment>(`/api/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(equipment),
    });
  }

  async deleteEquipment(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/equipment/${id}`, {
      method: 'DELETE',
    });
  }

  // Category endpoints
  async getCategories(): Promise<Array<{
    id: number;
    name: string;
    description?: string;
    equipment_count: number;
    created_at: string;
  }>> {
    return this.request('/api/categories/');
  }

  async getCategory(id: number): Promise<{
    id: number;
    name: string;
    description?: string;
    equipment_count: number;
    created_at: string;
  }> {
    return this.request(`/api/categories/${id}`);
  }

  async createCategory(category: {
    name: string;
    description?: string;
  }): Promise<{
    id: number;
    name: string;
    description?: string;
    equipment_count: number;
    created_at: string;
  }> {
    return this.request('/api/categories/', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: number, category: {
    name?: string;
    description?: string;
  }): Promise<{
    id: number;
    name: string;
    description?: string;
    equipment_count: number;
    created_at: string;
  }> {
    return this.request(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: number): Promise<{ message: string }> {
    return this.request(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Database Management endpoints
  async getDatabaseStats(): Promise<{
    users: number;
    admins: number;
    regular_users: number;
    categories: number;
    equipment: number;
    available_equipment: number;
    borrowed_equipment: number;
    bookings: number;
    active_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
  }> {
    return this.request('/admin/stats');
  }

  async cleanAllBookings(): Promise<{
    message: string;
    deleted_count: number;
    operation: string;
  }> {
    return this.request('/admin/cleanup/bookings', {
      method: 'DELETE',
    });
  }

  async cleanAllEquipment(): Promise<{
    message: string;
    deleted_count: number;
    operation: string;
  }> {
    return this.request('/admin/cleanup/equipment', {
      method: 'DELETE',
    });
  }

  async cleanOldBookings(daysOld: number = 30): Promise<{
    message: string;
    deleted_count: number;
    operation: string;
  }> {
    return this.request('/admin/cleanup/bookings/old', {
      method: 'DELETE',
      body: JSON.stringify({ days_old: daysOld }),
    });
  }

  async cleanCompletedCancelledBookings(): Promise<{
    message: string;
    deleted_count: number;
    operation: string;
  }> {
    return this.request('/admin/cleanup/bookings/completed-cancelled', {
      method: 'DELETE',
    });
  }

  async resetEquipmentStatus(): Promise<{
    message: string;
    deleted_count: number;
    operation: string;
  }> {
    return this.request('/admin/equipment/reset-status', {
      method: 'PUT',
    });
  }

  async cleanAllBookingsAndEquipment(): Promise<{
    message: string;
    deleted_bookings: number;
    deleted_equipment: number;
    operation: string;
  }> {
    return this.request('/admin/cleanup/all', {
      method: 'DELETE',
    });
  }

  async cleanNonAdminUsers(): Promise<{
    message: string;
    deleted_count: number;
    operation: string;
  }> {
    return this.request('/admin/cleanup/users', {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
