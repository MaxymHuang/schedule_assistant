import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { 
  generateAvailableDatesUTCPlus8, 
  formatDateTimeUTCPlus8,
  formatTimeUTCPlus8,
  createDateTimeUTCPlus8,
  isDateTimeInPast
} from '../utils/timezone';

interface BookingCalendarProps {
  equipmentId: number;
  onTimeSlotSelect: (startTime: string, duration: number) => void;
  selectedStartTime?: string;
  selectedDuration?: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  hour: number;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  equipmentId,
  onTimeSlotSelect,
  selectedStartTime,
  selectedDuration = 1
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [localSelectedDuration, setLocalSelectedDuration] = useState<number>(selectedDuration);

  // Generate available dates (next 14 days) in UTC+8
  const generateAvailableDates = () => {
    return generateAvailableDatesUTCPlus8();
  };

  // Generate time slots for a day (8 AM to 8 PM)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour <= 20; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      
      slots.push({
        time: timeString,
        available: true, // Will be updated by availability check
        hour: hour
      });
    }
    return slots;
  };

  // Check availability for selected date
  const checkAvailability = async (date: string) => {
    if (!date) return;
    
    setLoading(true);
    setError('');
    
    try {
      const slots = generateTimeSlots();
      
      const updatedSlots = await Promise.all(
        slots.map(async (slot) => {
          const startDatetime = createDateTimeUTCPlus8(date, slot.time);
          const endDatetime = createDateTimeUTCPlus8(date, `${(slot.hour + 1).toString().padStart(2, '0')}:00`);
          
          // Check if the time is in the past
          if (isDateTimeInPast(startDatetime)) {
            return { ...slot, available: false };
          }
          
          try {
            const availability = await apiClient.checkAvailability(
              equipmentId,
              startDatetime,
              endDatetime
            );
            return { ...slot, available: availability.is_available };
          } catch (err) {
            return { ...slot, available: false };
          }
        })
      );
      
      setTimeSlots(updatedSlots);
    } catch (err) {
      setError('Failed to check availability');
      console.error('Availability check error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    checkAvailability(date);
  };

  // Handle time slot selection
  const handleTimeSlotClick = (slot: TimeSlot) => {
    if (!slot.available || !selectedDate) return;
    
    const startDatetime = createDateTimeUTCPlus8(selectedDate, slot.time);
    
    // Double-check that the time is not in the past
    if (isDateTimeInPast(startDatetime)) {
      return;
    }
    
    onTimeSlotSelect(startDatetime, localSelectedDuration);
  };

  // Handle duration change
  const handleDurationChange = (duration: number) => {
    setLocalSelectedDuration(duration);
    if (selectedStartTime) {
      onTimeSlotSelect(selectedStartTime, duration);
    }
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hour] = time.split(':');
    const hourNum = parseInt(hour);
    if (hourNum === 12) return '12:00 PM';
    if (hourNum > 12) return `${hourNum - 12}:00 PM`;
    return `${hourNum}:00 AM`;
  };

  const availableDates = generateAvailableDates();

  return (
    <div className="space-y-4">
      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <div className="grid grid-cols-7 gap-2">
          {availableDates.map((date) => {
            const dateObj = new Date(date);
            const isSelected = date === selectedDate;
            const isToday = date === new Date().toISOString().split('T')[0];
            
            return (
              <button
                key={date}
                type="button"
                onClick={() => handleDateSelect(date)}
                className={`
                  p-2 text-sm rounded border
                  ${isSelected 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }
                  ${isToday ? 'ring-2 ring-blue-200' : ''}
                `}
              >
                <div className="font-medium">
                  {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-xs">
                  {dateObj.getDate()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration (hours)
        </label>
        <select
          value={localSelectedDuration}
          onChange={(e) => handleDurationChange(parseInt(e.target.value))}
          className="form-input"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
            <option key={hours} value={hours}>
              {hours} hour{hours > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Time Slots
          </label>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Checking availability...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = selectedStartTime === createDateTimeUTCPlus8(selectedDate, slot.time);
                
                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => handleTimeSlotClick(slot)}
                    disabled={!slot.available}
                    className={`
                      p-2 text-sm rounded border
                      ${!slot.available
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                      }
                    `}
                  >
                    {formatTime(slot.time)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Booking Summary */}
      {selectedStartTime && selectedDate && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-medium text-blue-900">Selected Booking</h4>
          <p className="text-sm text-blue-700">
            {formatDateTimeUTCPlus8(selectedStartTime)}
          </p>
          <p className="text-sm text-blue-700">
            {formatTimeUTCPlus8(selectedStartTime)} - 
            {(() => {
              const startHour = parseInt(selectedStartTime.split('T')[1].substring(0, 2));
              const endHour = startHour + localSelectedDuration;
              if (endHour === 12) return '12:00 PM';
              if (endHour > 12) return `${endHour - 12}:00 PM`;
              return `${endHour}:00 AM`;
            })()}
          </p>
          <p className="text-sm text-blue-700">
            Duration: {localSelectedDuration} hour{localSelectedDuration > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
