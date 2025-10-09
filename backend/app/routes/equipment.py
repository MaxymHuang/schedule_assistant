from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional, Annotated
from datetime import datetime, timedelta

from ..core.database import get_db
from ..core.auth import verify_token
from ..models.user import User, UserRole
from ..models.equipment import Equipment, EquipmentStatus
from ..schemas.equipment import Equipment as EquipmentSchema, EquipmentCreate, EquipmentUpdate

router = APIRouter(prefix="/api/equipment", tags=["equipment"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


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
    duration_hours: int = Query(..., ge=1, le=8),
    db: Session = Depends(get_db)
):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    # Calculate end datetime
    end_datetime = start_datetime + timedelta(hours=duration_hours)
    
    # Check for conflicting bookings
    from ..models.booking import Booking, BookingStatus
    conflicting_bookings = db.query(Booking).filter(
        Booking.equipment_id == equipment_id,
        Booking.status == BookingStatus.ACTIVE,
        Booking.booking_start_datetime < end_datetime
    ).all()
    
    # Filter out non-conflicting bookings by checking end times
    actual_conflicts = []
    for booking in conflicting_bookings:
        booking_end = booking.booking_start_datetime + timedelta(hours=booking.booking_duration_hours)
        if booking_end > start_datetime:
            actual_conflicts.append(booking)
    
    is_available = len(actual_conflicts) == 0 and equipment.status == EquipmentStatus.AVAILABLE
    
    return {
        "equipment_id": equipment_id,
        "start_datetime": start_datetime,
        "end_datetime": end_datetime,
        "duration_hours": duration_hours,
        "is_available": is_available,
        "conflicting_bookings": len(actual_conflicts)
    }


@router.post("/", response_model=EquipmentSchema)
def create_equipment(
    equipment: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_equipment = Equipment(**equipment.dict())
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment


@router.put("/{equipment_id}", response_model=EquipmentSchema)
def update_equipment(
    equipment_id: int,
    equipment_update: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not db_equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    update_data = equipment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_equipment, field, value)
    
    db.commit()
    db.refresh(db_equipment)
    return db_equipment


@router.delete("/{equipment_id}")
def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not db_equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    # Check if equipment has active bookings
    from ..models.booking import Booking, BookingStatus
    active_bookings = db.query(Booking).filter(
        Booking.equipment_id == equipment_id,
        Booking.status == BookingStatus.ACTIVE
    ).count()
    
    if active_bookings > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete equipment with active bookings"
        )
    
    db.delete(db_equipment)
    db.commit()
    return {"message": "Equipment deleted successfully"}
