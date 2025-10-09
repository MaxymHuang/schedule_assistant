#!/usr/bin/env python3
"""
Clean database records script
Provides options to clean bookings and equipment records
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.models.booking import Booking, BookingStatus
from app.models.equipment import Equipment, EquipmentStatus
from app.models.user import User, UserRole
from app.models.category import Category
from sqlalchemy import text
from datetime import datetime, timedelta


def clean_all_bookings():
    """Clean all booking records from the database"""
    db = SessionLocal()
    try:
        # Count bookings before deletion
        total_bookings = db.query(Booking).count()
        active_bookings = db.query(Booking).filter(Booking.status == BookingStatus.ACTIVE).count()
        completed_bookings = db.query(Booking).filter(Booking.status == BookingStatus.COMPLETED).count()
        cancelled_bookings = db.query(Booking).filter(Booking.status == BookingStatus.CANCELLED).count()
        
        print(f"Current booking statistics:")
        print(f"  Total bookings: {total_bookings}")
        print(f"  Active bookings: {active_bookings}")
        print(f"  Completed bookings: {completed_bookings}")
        print(f"  Cancelled bookings: {cancelled_bookings}")
        
        if total_bookings == 0:
            print("No bookings to clean.")
            return
        
        # Delete all bookings
        deleted_count = db.query(Booking).delete()
        db.commit()
        
        print(f"✅ Successfully deleted {deleted_count} booking records")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error cleaning bookings: {e}")
        raise
    finally:
        db.close()


def clean_all_equipment():
    """Clean all equipment records from the database"""
    db = SessionLocal()
    try:
        # Count equipment before deletion
        total_equipment = db.query(Equipment).count()
        available_equipment = db.query(Equipment).filter(Equipment.status == EquipmentStatus.AVAILABLE).count()
        borrowed_equipment = db.query(Equipment).filter(Equipment.status == EquipmentStatus.BORROWED).count()
        
        print(f"Current equipment statistics:")
        print(f"  Total equipment: {total_equipment}")
        print(f"  Available equipment: {available_equipment}")
        print(f"  Borrowed equipment: {borrowed_equipment}")
        
        if total_equipment == 0:
            print("No equipment to clean.")
            return
        
        # Delete all equipment
        deleted_count = db.query(Equipment).delete()
        db.commit()
        
        print(f"✅ Successfully deleted {deleted_count} equipment records")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error cleaning equipment: {e}")
        raise
    finally:
        db.close()


def clean_old_bookings(days_old=30):
    """Clean bookings older than specified days"""
    db = SessionLocal()
    try:
        cutoff_date = datetime.now() - timedelta(days=days_old)
        
        # Count old bookings
        old_bookings = db.query(Booking).filter(Booking.created_at < cutoff_date).count()
        
        if old_bookings == 0:
            print(f"No bookings older than {days_old} days found.")
            return
        
        # Delete old bookings
        deleted_count = db.query(Booking).filter(Booking.created_at < cutoff_date).delete()
        db.commit()
        
        print(f"✅ Successfully deleted {deleted_count} bookings older than {days_old} days")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error cleaning old bookings: {e}")
        raise
    finally:
        db.close()


def clean_completed_cancelled_bookings():
    """Clean only completed and cancelled bookings"""
    db = SessionLocal()
    try:
        # Count completed and cancelled bookings
        completed_count = db.query(Booking).filter(Booking.status == BookingStatus.COMPLETED).count()
        cancelled_count = db.query(Booking).filter(Booking.status == BookingStatus.CANCELLED).count()
        
        if completed_count == 0 and cancelled_count == 0:
            print("No completed or cancelled bookings to clean.")
            return
        
        # Delete completed and cancelled bookings
        deleted_count = db.query(Booking).filter(
            Booking.status.in_([BookingStatus.COMPLETED, BookingStatus.CANCELLED])
        ).delete()
        db.commit()
        
        print(f"✅ Successfully deleted {deleted_count} completed/cancelled bookings")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error cleaning completed/cancelled bookings: {e}")
        raise
    finally:
        db.close()


def reset_equipment_status():
    """Reset all equipment status to available (useful after cleaning bookings)"""
    db = SessionLocal()
    try:
        # Count borrowed equipment
        borrowed_count = db.query(Equipment).filter(Equipment.status == EquipmentStatus.BORROWED).count()
        
        if borrowed_count == 0:
            print("No borrowed equipment to reset.")
            return
        
        # Reset all equipment to available
        updated_count = db.query(Equipment).filter(
            Equipment.status == EquipmentStatus.BORROWED
        ).update({Equipment.status: EquipmentStatus.AVAILABLE})
        db.commit()
        
        print(f"✅ Successfully reset {updated_count} equipment items to available status")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error resetting equipment status: {e}")
        raise
    finally:
        db.close()


def show_database_stats():
    """Show current database statistics"""
    db = SessionLocal()
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
        
        print("📊 Current Database Statistics:")
        print("=" * 50)
        print(f"Users: {users_count} (Admins: {admin_count}, Regular: {regular_users_count})")
        print(f"Categories: {categories_count}")
        print(f"Equipment: {equipment_count} (Available: {available_equipment}, Borrowed: {borrowed_equipment})")
        print(f"Bookings: {bookings_count} (Active: {active_bookings}, Completed: {completed_bookings}, Cancelled: {cancelled_bookings})")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error getting database stats: {e}")
    finally:
        db.close()


def main():
    """Main function with interactive menu"""
    print("🧹 Database Cleaning Script")
    print("=" * 40)
    
    while True:
        print("\nSelect an option:")
        print("1. Show database statistics")
        print("2. Clean all bookings")
        print("3. Clean all equipment")
        print("4. Clean old bookings (30+ days)")
        print("5. Clean completed/cancelled bookings only")
        print("6. Reset equipment status to available")
        print("7. Clean all bookings AND equipment")
        print("8. Exit")
        
        choice = input("\nEnter your choice (1-8): ").strip()
        
        if choice == "1":
            show_database_stats()
        elif choice == "2":
            confirm = input("⚠️  Are you sure you want to delete ALL bookings? (yes/no): ").strip().lower()
            if confirm == "yes":
                clean_all_bookings()
            else:
                print("Operation cancelled.")
        elif choice == "3":
            confirm = input("⚠️  Are you sure you want to delete ALL equipment? (yes/no): ").strip().lower()
            if confirm == "yes":
                clean_all_equipment()
            else:
                print("Operation cancelled.")
        elif choice == "4":
            days = input("Enter number of days (default 30): ").strip()
            days = int(days) if days.isdigit() else 30
            clean_old_bookings(days)
        elif choice == "5":
            clean_completed_cancelled_bookings()
        elif choice == "6":
            reset_equipment_status()
        elif choice == "7":
            confirm = input("⚠️  Are you sure you want to delete ALL bookings AND equipment? (yes/no): ").strip().lower()
            if confirm == "yes":
                print("Cleaning all bookings...")
                clean_all_bookings()
                print("Cleaning all equipment...")
                clean_all_equipment()
                print("✅ All bookings and equipment cleaned successfully!")
            else:
                print("Operation cancelled.")
        elif choice == "8":
            print("Goodbye!")
            break
        else:
            print("Invalid choice. Please try again.")


if __name__ == "__main__":
    main()
