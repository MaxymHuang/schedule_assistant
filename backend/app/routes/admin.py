from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
from typing import Optional

from ..core.database import get_db
from ..core.auth import require_admin
from ..models.user import User, UserRole
from ..models.booking import Booking, BookingStatus
from ..models.equipment import Equipment, EquipmentStatus
from ..models.category import Category
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])


class DatabaseStats(BaseModel):
    users: int
    admins: int
    regular_users: int
    categories: int
    equipment: int
    available_equipment: int
    borrowed_equipment: int
    bookings: int
    active_bookings: int
    completed_bookings: int
    cancelled_bookings: int


class CleanupResponse(BaseModel):
    message: str
    deleted_count: int
    operation: str


class OldBookingsCleanup(BaseModel):
    days_old: int = 30


@router.get("/stats", response_model=DatabaseStats)
def get_database_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get current database statistics (admin only)"""
    try:
        users_count = db.query(User).count()
        admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
        regular_users_count = db.query(User).filter(User.role == UserRole.USER).count()
        
        categories_count = db.query(Category).count()
        
        equipment_count = db.query(Equipment).count()
        available_equipment = db.query(Equipment).filter(Equipment.status == EquipmentStatus.AVAILABLE).count()
        borrowed_equipment = db.query(Equipment).filter(Equipment.status == EquipmentStatus.BORROWED).count()
        
        bookings_count = db.query(Booking).count()
        active_bookings = db.query(Booking).filter(Booking.status == BookingStatus.ACTIVE).count()
        completed_bookings = db.query(Booking).filter(Booking.status == BookingStatus.COMPLETED).count()
        cancelled_bookings = db.query(Booking).filter(Booking.status == BookingStatus.CANCELLED).count()
        
        return DatabaseStats(
            users=users_count,
            admins=admin_count,
            regular_users=regular_users_count,
            categories=categories_count,
            equipment=equipment_count,
            available_equipment=available_equipment,
            borrowed_equipment=borrowed_equipment,
            bookings=bookings_count,
            active_bookings=active_bookings,
            completed_bookings=completed_bookings,
            cancelled_bookings=cancelled_bookings
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting database stats: {str(e)}"
        )


@router.delete("/cleanup/bookings", response_model=CleanupResponse)
def clean_all_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Clean all booking records (admin only)"""
    try:
        # Count bookings before deletion
        total_bookings = db.query(Booking).count()
        
        if total_bookings == 0:
            return CleanupResponse(
                message="No bookings to clean",
                deleted_count=0,
                operation="clean_all_bookings"
            )
        
        # Delete all bookings
        deleted_count = db.query(Booking).delete()
        db.commit()
        
        return CleanupResponse(
            message=f"Successfully deleted {deleted_count} booking records",
            deleted_count=deleted_count,
            operation="clean_all_bookings"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning bookings: {str(e)}"
        )


@router.delete("/cleanup/equipment", response_model=CleanupResponse)
def clean_all_equipment(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Clean all equipment records (admin only)"""
    try:
        # Count equipment before deletion
        total_equipment = db.query(Equipment).count()
        
        if total_equipment == 0:
            return CleanupResponse(
                message="No equipment to clean",
                deleted_count=0,
                operation="clean_all_equipment"
            )
        
        # Delete all equipment
        deleted_count = db.query(Equipment).delete()
        db.commit()
        
        return CleanupResponse(
            message=f"Successfully deleted {deleted_count} equipment records",
            deleted_count=deleted_count,
            operation="clean_all_equipment"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning equipment: {str(e)}"
        )


@router.delete("/cleanup/bookings/old", response_model=CleanupResponse)
def clean_old_bookings(
    cleanup_data: OldBookingsCleanup,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Clean bookings older than specified days (admin only)"""
    try:
        cutoff_date = datetime.now() - timedelta(days=cleanup_data.days_old)
        
        # Count old bookings
        old_bookings = db.query(Booking).filter(Booking.created_at < cutoff_date).count()
        
        if old_bookings == 0:
            return CleanupResponse(
                message=f"No bookings older than {cleanup_data.days_old} days found",
                deleted_count=0,
                operation="clean_old_bookings"
            )
        
        # Delete old bookings
        deleted_count = db.query(Booking).filter(Booking.created_at < cutoff_date).delete()
        db.commit()
        
        return CleanupResponse(
            message=f"Successfully deleted {deleted_count} bookings older than {cleanup_data.days_old} days",
            deleted_count=deleted_count,
            operation="clean_old_bookings"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning old bookings: {str(e)}"
        )


@router.delete("/cleanup/bookings/completed-cancelled", response_model=CleanupResponse)
def clean_completed_cancelled_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Clean only completed and cancelled bookings (admin only)"""
    try:
        # Count completed and cancelled bookings
        completed_count = db.query(Booking).filter(Booking.status == BookingStatus.COMPLETED).count()
        cancelled_count = db.query(Booking).filter(Booking.status == BookingStatus.CANCELLED).count()
        
        if completed_count == 0 and cancelled_count == 0:
            return CleanupResponse(
                message="No completed or cancelled bookings to clean",
                deleted_count=0,
                operation="clean_completed_cancelled_bookings"
            )
        
        # Delete completed and cancelled bookings
        deleted_count = db.query(Booking).filter(
            Booking.status.in_([BookingStatus.COMPLETED, BookingStatus.CANCELLED])
        ).delete()
        db.commit()
        
        return CleanupResponse(
            message=f"Successfully deleted {deleted_count} completed/cancelled bookings",
            deleted_count=deleted_count,
            operation="clean_completed_cancelled_bookings"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning completed/cancelled bookings: {str(e)}"
        )


@router.put("/equipment/reset-status", response_model=CleanupResponse)
def reset_equipment_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Reset all equipment status to available (admin only)"""
    try:
        # Count borrowed equipment
        borrowed_count = db.query(Equipment).filter(Equipment.status == EquipmentStatus.BORROWED).count()
        
        if borrowed_count == 0:
            return CleanupResponse(
                message="No borrowed equipment to reset",
                deleted_count=0,
                operation="reset_equipment_status"
            )
        
        # Reset all equipment to available
        updated_count = db.query(Equipment).filter(
            Equipment.status == EquipmentStatus.BORROWED
        ).update({Equipment.status: EquipmentStatus.AVAILABLE})
        db.commit()
        
        return CleanupResponse(
            message=f"Successfully reset {updated_count} equipment items to available status",
            deleted_count=updated_count,
            operation="reset_equipment_status"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting equipment status: {str(e)}"
        )


@router.delete("/cleanup/all", response_model=dict)
def clean_all_bookings_and_equipment(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Clean all bookings AND equipment records (admin only)"""
    try:
        # Count before deletion
        bookings_count = db.query(Booking).count()
        equipment_count = db.query(Equipment).count()
        
        # Delete all bookings
        deleted_bookings = db.query(Booking).delete()
        
        # Delete all equipment
        deleted_equipment = db.query(Equipment).delete()
        
        db.commit()
        
        return {
            "message": "Successfully cleaned all bookings and equipment",
            "deleted_bookings": deleted_bookings,
            "deleted_equipment": deleted_equipment,
            "operation": "clean_all_bookings_and_equipment"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning all records: {str(e)}"
        )


@router.delete("/cleanup/users", response_model=CleanupResponse)
def clean_non_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Clean all non-admin users (admin only)"""
    try:
        # Count non-admin users
        non_admin_count = db.query(User).filter(User.role != UserRole.ADMIN).count()
        
        if non_admin_count == 0:
            return CleanupResponse(
                message="No non-admin users to clean",
                deleted_count=0,
                operation="clean_non_admin_users"
            )
        
        # Delete non-admin users
        deleted_count = db.query(User).filter(User.role != UserRole.ADMIN).delete()
        db.commit()
        
        return CleanupResponse(
            message=f"Successfully deleted {deleted_count} non-admin users",
            deleted_count=deleted_count,
            operation="clean_non_admin_users"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning non-admin users: {str(e)}"
        )
