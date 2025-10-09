import React, { useState, useEffect } from 'react';
import type { Equipment, BookingWithDetails } from '../types';
import { apiClient } from '../api/client';

interface EquipmentBookingCalendarProps {
  // This component will be self-contained with its own equipment selection
}

const EquipmentBookingCalendar: React.FC<EquipmentBookingCalendarProps> = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load equipment list on component mount
  useEffect(() => {
    loadEquipment();
  }, []);

  // Load bookings when equipment or week changes
  useEffect(() => {
    if (selectedEquipmentId) {
      loadBookings();
    }
  }, [selectedEquipmentId, currentWeek]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getEquipment();
      setEquipment(data);
      // Auto-select first equipment if available
      if (data.length > 0) {
        setSelectedEquipmentId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!selectedEquipmentId) return;
    
    try {
      setLoading(true);
      const startOfWeek = getStartOfWeek(currentWeek);
      const endOfWeek = getEndOfWeek(currentWeek);
      
      const data = await apiClient.getEquipmentBookings(
        selectedEquipmentId,
        startOfWeek.toISOString(),
        endOfWeek.toISOString()
      );
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStartOfWeek = (date: Date): Date => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getEndOfWeek = (date: Date): Date => {
    const end = getStartOfWeek(date);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const getWeekDays = (): Date[] => {
    const start = getStartOfWeek(currentWeek);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getBookingsForDay = (date: Date): BookingWithDetails[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_start_datetime);
      return bookingDate >= dayStart && bookingDate <= dayEnd;
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const weekDays = getWeekDays();

  if (loading && equipment.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Equipment Booking Calendar</h2>
          
          {/* Equipment Selection */}
          <div className="mb-6">
            <label className="form-label">Select Equipment</label>
            <select
              className="form-select"
              value={selectedEquipmentId || ''}
              onChange={(e) => setSelectedEquipmentId(Number(e.target.value))}
            >
              <option value="">Choose equipment...</option>
              {equipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.model}
                </option>
              ))}
            </select>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="btn btn-secondary"
              >
                ← Previous Week
              </button>
              <button
                onClick={goToCurrentWeek}
                className="btn btn-secondary"
              >
                Current Week
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="btn btn-secondary"
              >
                Next Week →
              </button>
            </div>
            <div className="text-lg font-semibold text-gray-700">
              {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {selectedEquipmentId && (
        <div className="card">
          <div className="card-body p-0">
            <div className="calendar-grid">
              {/* Day Headers */}
              {weekDays.map((day, index) => (
                <div key={index} className="calendar-day-header">
                  <div>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {day.getDate()}
                  </div>
                </div>
              ))}

              {/* Booking Content */}
              {weekDays.map((day, index) => {
                const dayBookings = getBookingsForDay(day);
                return (
                  <div key={index} className="calendar-day">
                    {dayBookings.length === 0 ? (
                      <div className="calendar-empty-day">
                        No bookings
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {dayBookings.map((booking) => (
                          <div key={booking.id} className="calendar-booking">
                            <div className="calendar-booking-time">
                              {formatTime(booking.booking_start_datetime)}
                            </div>
                            <div className="calendar-booking-name">
                              {booking.borrower_name}
                            </div>
                            <div className="calendar-booking-duration">
                              {booking.booking_duration_hours}h
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator for bookings */}
      {loading && selectedEquipmentId && (
        <div className="flex justify-center items-center py-4">
          <div className="spinner"></div>
          <span className="ml-2 text-gray-600">Loading bookings...</span>
        </div>
      )}
    </div>
  );
};

export default EquipmentBookingCalendar;
