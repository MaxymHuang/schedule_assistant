from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Annotated
from datetime import datetime, timedelta

from ..core.database import get_db
from ..core.auth import verify_token
from ..models.user import User, UserRole
from ..models.equipment import Equipment, EquipmentStatus
from ..models.booking import Booking, BookingStatus
from ..schemas.booking import Booking as BookingSchema, BookingCreate, BookingWithDetails

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

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


@router.get("/", response_model=List[BookingWithDetails])
def get_user_bookings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get bookings for the current user"""
    bookings = db.query(Booking).filter(
        Booking.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return bookings


@router.get("/equipment/{equipment_id}", response_model=List[BookingWithDetails])
def get_equipment_bookings(
    equipment_id: int,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get bookings for a specific equipment within a date range"""
    query = db.query(Booking).filter(Booking.equipment_id == equipment_id)
    
    # Filter by date range if provided
    if start_date:
        start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        query = query.filter(Booking.booking_start_datetime >= start_datetime)
    
    if end_date:
        end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query = query.filter(Booking.booking_start_datetime <= end_datetime)
    
    bookings = query.order_by(Booking.booking_start_datetime).all()
    return bookings


@router.get("/{booking_id}", response_model=BookingWithDetails)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific booking by ID (only if it belongs to the current user)"""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    return booking


@router.post("/", response_model=BookingSchema)
def create_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new booking for the current user (users only, not admins)"""
    # Prevent admins from creating bookings
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot create bookings"
        )
    
    # Check if equipment exists
    equipment = db.query(Equipment).filter(Equipment.id == booking.equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    # Check if equipment is available
    if equipment.status != EquipmentStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment is not available"
        )
    
    # Validate booking start time is not in the past and within 2 weeks
    from datetime import timezone
    now = datetime.now(timezone.utc)
    max_advance = now + timedelta(days=14)
    
    if booking.booking_start_datetime < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking start time cannot be in the past"
        )
    
    if booking.booking_start_datetime > max_advance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bookings can only be made up to 2 weeks in advance"
        )
    
    # Calculate booking end time
    booking_end_time = booking.booking_start_datetime + timedelta(hours=booking.booking_duration_hours)
    
    # Check for conflicting bookings (time overlap detection)
    conflicting_bookings = db.query(Booking).filter(
        Booking.equipment_id == booking.equipment_id,
        Booking.status == BookingStatus.ACTIVE,
        Booking.booking_start_datetime < booking_end_time
    ).all()
    
    # Filter out non-conflicting bookings by checking end times
    actual_conflicts = []
    for existing_booking in conflicting_bookings:
        existing_end = existing_booking.booking_start_datetime + timedelta(hours=existing_booking.booking_duration_hours)
        if existing_end > booking.booking_start_datetime:
            actual_conflicts.append(existing_booking)
    
    if actual_conflicts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment is not available for the selected time slot"
        )
    
    # Create booking
    db_booking = Booking(
        equipment_id=booking.equipment_id,
        user_id=current_user.id,
        borrower_name=current_user.name,
        borrower_email=current_user.email,
        booking_start_datetime=booking.booking_start_datetime,
        booking_duration_hours=booking.booking_duration_hours
    )
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    return db_booking


@router.delete("/{booking_id}")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel and delete a booking (only if it belongs to the current user)"""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    if booking.status != BookingStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active bookings can be cancelled"
        )
    
    # Delete the booking record completely instead of just changing status
    db.delete(booking)
    db.commit()
    
    return {"message": "Booking cancelled and deleted successfully"}
