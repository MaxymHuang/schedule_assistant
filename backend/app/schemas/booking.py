from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, timedelta, timezone
from ..models.booking import BookingStatus


class BookingBase(BaseModel):
    equipment_id: int
    booking_start_datetime: datetime
    booking_duration_hours: int = Field(..., ge=1, le=8, description="Booking duration in hours (1-8)")

    @validator('booking_duration_hours')
    def validate_duration(cls, v):
        if not 1 <= v <= 8:
            raise ValueError('Booking duration must be between 1 and 8 hours')
        return v

    @validator('booking_start_datetime')
    def validate_booking_window(cls, v):
        now = datetime.now(timezone.utc)
        max_advance = now + timedelta(days=14)  # 2 weeks in advance
        
        if v < now:
            raise ValueError('Booking start time cannot be in the past')
        if v > max_advance:
            raise ValueError('Bookings can only be made up to 2 weeks in advance')
        return v


class BookingCreate(BookingBase):
    borrower_name: str = ""
    borrower_email: str = ""


class BookingUpdate(BaseModel):
    booking_start_datetime: Optional[datetime] = None
    booking_duration_hours: Optional[int] = Field(None, ge=1, le=8)
    status: Optional[BookingStatus] = None

    @validator('booking_duration_hours')
    def validate_duration(cls, v):
        if v is not None and not 1 <= v <= 8:
            raise ValueError('Booking duration must be between 1 and 8 hours')
        return v

    @validator('booking_start_datetime')
    def validate_booking_window(cls, v):
        if v is not None:
            now = datetime.now(timezone.utc)
            max_advance = now + timedelta(days=14)  # 2 weeks in advance
            
            if v < now:
                raise ValueError('Booking start time cannot be in the past')
            if v > max_advance:
                raise ValueError('Bookings can only be made up to 2 weeks in advance')
        return v


class Booking(BookingBase):
    id: int
    user_id: int
    borrower_name: str
    borrower_email: str
    status: BookingStatus
    created_at: datetime

    class Config:
        from_attributes = True


class BookingWithDetails(Booking):
    equipment: "Equipment"
    user: "User"

    class Config:
        from_attributes = True


from .equipment import Equipment
from .user import User
BookingWithDetails.model_rebuild()
