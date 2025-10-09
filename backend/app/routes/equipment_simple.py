from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..core.database import get_db
from ..models.equipment import Equipment, EquipmentStatus
from ..schemas.equipment import Equipment as EquipmentSchema

router = APIRouter(prefix="/api/equipment", tags=["equipment"])


@router.get("/", response_model=List[EquipmentSchema])
def get_equipment(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = Query(None),
    status: Optional[EquipmentStatus] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Equipment)
    
    if category:
        query = query.filter(Equipment.category == category)
    if status:
        query = query.filter(Equipment.status == status)
    if search:
        query = query.filter(
            (Equipment.name.contains(search)) | 
            (Equipment.model.contains(search))
        )
    
    return query.offset(skip).limit(limit).all()


@router.get("/{equipment_id}", response_model=EquipmentSchema)
def get_equipment_by_id(equipment_id: int, db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    return equipment


@router.get("/{equipment_id}/availability")
def check_equipment_availability(
    equipment_id: int,
    start_datetime: datetime = Query(...),
    end_datetime: datetime = Query(...),
    db: Session = Depends(get_db)
):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    # Check for conflicting bookings using datetime-based logic
    from ..models.booking import Booking, BookingStatus
    from datetime import timedelta
    
    # Get all active bookings for this equipment
    active_bookings = db.query(Booking).filter(
        Booking.equipment_id == equipment_id,
        Booking.status == BookingStatus.ACTIVE
    ).all()
    
    # Check for time overlaps
    conflicting_bookings = []
    for booking in active_bookings:
        booking_start = booking.booking_start_datetime
        booking_end = booking_start + timedelta(hours=booking.booking_duration_hours)
        
        # Check if there's any overlap
        if (booking_start < end_datetime and booking_end > start_datetime):
            conflicting_bookings.append(booking)
    
    is_available = len(conflicting_bookings) == 0 and equipment.status == EquipmentStatus.AVAILABLE
    
    return {
        "equipment_id": equipment_id,
        "start_datetime": start_datetime,
        "end_datetime": end_datetime,
        "is_available": is_available,
        "conflicting_bookings": len(conflicting_bookings)
    }
