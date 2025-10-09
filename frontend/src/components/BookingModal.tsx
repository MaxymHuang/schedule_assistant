import React, { useState } from 'react';
import type { Equipment, BookingCreateRequest } from '../types';
import { apiClient } from '../api/client';
import BookingCalendar from './BookingCalendar';

interface BookingModalProps {
  equipment: Equipment;
  onClose: () => void;
  onSuccess: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ equipment, onClose, onSuccess }) => {
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedStartTime) {
      setError('Please select a date and time slot');
      setLoading(false);
      return;
    }

    try {
      // Calculate end time for availability check
      const startTime = new Date(selectedStartTime);
      const endTime = new Date(startTime.getTime() + selectedDuration * 60 * 60 * 1000);

      // Check availability first
      const availability = await apiClient.checkAvailability(
        equipment.id,
        selectedStartTime,
        endTime.toISOString()
      );

      if (!availability.is_available) {
        setError('Equipment is not available for the selected time slot');
        setLoading(false);
        return;
      }

      // Create booking
      const bookingData: BookingCreateRequest = {
        equipment_id: equipment.id,
        borrower_name: '', // Will be filled by backend from authenticated user
        borrower_email: '', // Will be filled by backend from authenticated user
        booking_start_datetime: selectedStartTime,
        booking_duration_hours: selectedDuration,
      };

      await apiClient.createBooking(bookingData);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotSelect = (startTime: string, duration: number) => {
    setSelectedStartTime(startTime);
    setSelectedDuration(duration);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the overlay, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Book {equipment.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              style={{ fontSize: '1.5rem', lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">
              <strong>Model:</strong> {equipment.model}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Category:</strong> {equipment.category}
            </p>
            {equipment.description && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>Description:</strong> {equipment.description}
              </p>
            )}
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <BookingCalendar
                equipmentId={equipment.id}
                onTimeSlotSelect={handleTimeSlotSelect}
                selectedStartTime={selectedStartTime}
                selectedDuration={selectedDuration}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedStartTime}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {loading ? 'Booking...' : 'Book Equipment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
