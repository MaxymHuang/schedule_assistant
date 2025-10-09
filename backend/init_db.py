#!/usr/bin/env python3
"""
Initialize the database with sample data
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, SessionLocal, Base
from app.core.auth import get_password_hash
from app.models.user import User, UserRole
from app.models.equipment import Equipment, EquipmentStatus

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            # Create admin user
            admin_user = User(
                email="admin@example.com",
                name="Admin User",
                password_hash=get_password_hash("admin"),
                role=UserRole.ADMIN
            )
            db.add(admin_user)
            print("Created admin user: admin@example.com / admin")
        
        # Check if regular user already exists
        regular_user = db.query(User).filter(User.email == "user@example.com").first()
        if not regular_user:
            # Create regular user
            regular_user = User(
                email="user@example.com",
                name="Regular User",
                password_hash=get_password_hash("user"),
                role=UserRole.USER
            )
            db.add(regular_user)
            print("Created regular user: user@example.com / user")
        
        # Create sample equipment
        sample_equipment = [
            {
                "name": "Canon EOS R5",
                "model": "EOS R5",
                "description": "Professional mirrorless camera with 45MP sensor",
                "category": "camera",
                "status": EquipmentStatus.AVAILABLE,
                "image_url": "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400"
            },
            {
                "name": "MacBook Pro 16-inch",
                "model": "MacBook Pro 16\" M2",
                "description": "High-performance laptop for video editing and development",
                "category": "laptop",
                "status": EquipmentStatus.AVAILABLE,
                "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"
            },
            {
                "name": "Epson PowerLite 1781W",
                "model": "PowerLite 1781W",
                "description": "Wireless HD projector for presentations",
                "category": "projector",
                "status": EquipmentStatus.AVAILABLE,
                "image_url": "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400"
            },
            {
                "name": "Sony WH-1000XM4",
                "model": "WH-1000XM4",
                "description": "Noise-cancelling wireless headphones",
                "category": "audio",
                "status": EquipmentStatus.AVAILABLE,
                "image_url": "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400"
            },
            {
                "name": "DJI Mavic Air 2",
                "model": "Mavic Air 2",
                "description": "Compact drone with 4K video recording",
                "category": "camera",
                "status": EquipmentStatus.AVAILABLE,
                "image_url": "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400"
            }
        ]
        
        for eq_data in sample_equipment:
            existing = db.query(Equipment).filter(
                Equipment.name == eq_data["name"],
                Equipment.model == eq_data["model"]
            ).first()
            
            if not existing:
                equipment = Equipment(**eq_data)
                db.add(equipment)
                print(f"Created equipment: {eq_data['name']}")
        
        db.commit()
        print("\nDatabase initialized successfully!")
        print("\nSample accounts:")
        print("Admin: admin@example.com / admin")
        print("User: user@example.com / user")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
