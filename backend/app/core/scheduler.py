from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import logging

from .database import get_db
from ..models.booking import Booking, BookingStatus
from ..models.equipment import Equipment, EquipmentStatus

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = BackgroundScheduler()


def update_booking_statuses():
    """Update booking statuses based on current time"""
    try:
        db = next(get_db())
        now = datetime.now(timezone.utc)
        
        # Update ACTIVE bookings to ONGOING when start time arrives
        active_bookings = db.query(Booking).filter(
            Booking.status == BookingStatus.ACTIVE,
            Booking.booking_start_datetime <= now
        ).all()
        
        for booking in active_bookings:
            booking.status = BookingStatus.ONGOING
            logger.info(f"Updated booking {booking.id} status to ONGOING")
        
        # Update ONGOING bookings to COMPLETED when end time passes
        ongoing_bookings = db.query(Booking).filter(
            Booking.status == BookingStatus.ONGOING
        ).all()
        
        for booking in ongoing_bookings:
            if booking.booking_end_datetime and booking.booking_end_datetime <= now:
                booking.status = BookingStatus.COMPLETED
                logger.info(f"Updated booking {booking.id} status to COMPLETED")
        
        db.commit()
        logger.info(f"Updated {len(active_bookings)} bookings to ONGOING, {len([b for b in ongoing_bookings if b.booking_end_datetime and b.booking_end_datetime <= now])} bookings to COMPLETED")
        
    except Exception as e:
        logger.error(f"Error updating booking statuses: {e}")
        if 'db' in locals():
            db.rollback()
    finally:
        if 'db' in locals():
            db.close()


def update_equipment_availability():
    """Update equipment availability based on current bookings"""
    try:
        db = next(get_db())
        
        # Get all equipment
        all_equipment = db.query(Equipment).all()
        
        for equipment in all_equipment:
            # Check if there's an ongoing booking for this equipment
            ongoing_booking = db.query(Booking).filter(
                Booking.equipment_id == equipment.id,
                Booking.status == BookingStatus.ONGOING
            ).first()
            
            # Update equipment status based on ongoing bookings
            if ongoing_booking:
                if equipment.status != EquipmentStatus.BORROWED:
                    equipment.status = EquipmentStatus.BORROWED
                    logger.info(f"Updated equipment {equipment.id} status to BORROWED")
            else:
                if equipment.status != EquipmentStatus.AVAILABLE:
                    equipment.status = EquipmentStatus.AVAILABLE
                    logger.info(f"Updated equipment {equipment.id} status to AVAILABLE")
        
        db.commit()
        logger.info(f"Updated equipment availability for {len(all_equipment)} equipment items")
        
    except Exception as e:
        logger.error(f"Error updating equipment availability: {e}")
        if 'db' in locals():
            db.rollback()
    finally:
        if 'db' in locals():
            db.close()


def start_scheduler():
    """Start the background scheduler"""
    if not scheduler.running:
        # Schedule booking status updates every 30 minutes
        scheduler.add_job(
            update_booking_statuses,
            trigger=IntervalTrigger(minutes=30),
            id='update_booking_statuses',
            name='Update Booking Statuses',
            replace_existing=True
        )
        
        # Schedule equipment availability updates every 30 minutes
        scheduler.add_job(
            update_equipment_availability,
            trigger=IntervalTrigger(minutes=30),
            id='update_equipment_availability',
            name='Update Equipment Availability',
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("Background scheduler started - booking status and equipment availability will be updated every 30 minutes")


def stop_scheduler():
    """Stop the background scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Background scheduler stopped")
