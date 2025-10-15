from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum
from datetime import timedelta


class BookingStatus(str, enum.Enum):
    ACTIVE = "active"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    borrower_name = Column(String, nullable=False)
    borrower_email = Column(String, nullable=False)
    booking_start_datetime = Column(DateTime(timezone=True), nullable=False)
    booking_duration_hours = Column(Integer, nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Property for booking end datetime
    @property
    def booking_end_datetime(self):
        if self.booking_start_datetime and self.booking_duration_hours:
            return self.booking_start_datetime + timedelta(hours=self.booking_duration_hours)
        return None

    # Relationships
    equipment = relationship("Equipment", back_populates="bookings")
    user = relationship("User", back_populates="bookings")
