from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class EquipmentStatus(str, enum.Enum):
    AVAILABLE = "available"
    BORROWED = "borrowed"


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    model = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String, nullable=False)  # Keep for backward compatibility
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    status = Column(Enum(EquipmentStatus), default=EquipmentStatus.AVAILABLE)
    image_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    bookings = relationship("Booking", back_populates="equipment")
    category_ref = relationship("Category", back_populates="equipment", lazy="select")
