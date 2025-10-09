export interface Equipment {
  id: number;
  name: string;
  model: string;
  description?: string;
  category: string;
  status: 'available' | 'borrowed';
  image_url?: string;
  created_at: string;
}

export interface Booking {
  id: number;
  equipment_id: number;
  borrower_name: string;
  borrower_email: string;
  booking_start_datetime: string;
  booking_duration_hours: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface BookingWithDetails extends Booking {
  equipment: Equipment;
}

export interface BookingCreateRequest {
  equipment_id: number;
  borrower_name: string;
  borrower_email: string;
  booking_start_datetime: string;
  booking_duration_hours: number;
}
