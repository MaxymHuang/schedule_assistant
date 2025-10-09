import React, { useState, useEffect } from 'react';
import type { BookingWithDetails } from '../types';
import { apiClient } from '../api/client';
import { convertUTCToUTCPlus8 } from '../utils/timezone';

const BookingList: React.FC = () => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBookings();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.cancelBooking(bookingId);
      // Remove the booking from the local state immediately for better UX
      setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId));
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
      // Reload bookings on error to ensure consistency
      loadBookings();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return "badge badge-success";
      case 'completed':
        return "badge badge-info";
      case 'cancelled':
        return "badge badge-danger";
      default:
        return "badge badge-warning";
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    // Convert UTC to UTC+8 for display
    const utcPlus8String = convertUTCToUTCPlus8(dateTimeString);
    const date = new Date(utcPlus8String);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatBookingTime = (booking: BookingWithDetails) => {
    // Convert UTC to UTC+8 for display
    const utcPlus8StartString = convertUTCToUTCPlus8(booking.booking_start_datetime);
    const startTime = new Date(utcPlus8StartString);
    const endTime = new Date(startTime.getTime() + booking.booking_duration_hours * 60 * 60 * 1000);
    
    const startTimeStr = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const endTimeStr = endTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${startTimeStr} - ${endTimeStr}`;
  };

  if (loading) {
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
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-medium text-gray-900">All Bookings</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Borrower</th>
              <th>Date & Time</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {booking.equipment.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.equipment.model}
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {booking.borrower_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.borrower_email}
                    </div>
                  </div>
                </td>
                <td className="text-sm text-gray-900">
                  <div>{formatDateTime(booking.booking_start_datetime)}</div>
                  <div className="text-xs text-gray-500">{formatBookingTime(booking)}</div>
                </td>
                <td className="text-sm text-gray-900">
                  {booking.booking_duration_hours} hour{booking.booking_duration_hours > 1 ? 's' : ''}
                </td>
                <td>
                  <span className={getStatusBadge(booking.status)}>
                    {booking.status}
                  </span>
                </td>
                <td>
                  {booking.status === 'active' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bookings.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No bookings found.</p>
        </div>
      )}
    </div>
  );
};

export default BookingList;
