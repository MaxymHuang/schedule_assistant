#!/usr/bin/env python3
"""
Initialize the database with production data
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
        admin_user = db.query(User).filter(User.email == "admin@admin.com").first()
        if not admin_user:
            # Create admin user
            admin_user = User(
                email="admin@admin.com",
                name="System Administrator",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN
            )
            db.add(admin_user)
            print("Created admin user: admin@admin.com / admin123")
        
        # Create one sample equipment item
        sample_equipment = {
            "name": "Canon EOS R5",
            "model": "EOS R5",
            "description": "Professional mirrorless camera with 45MP sensor and 8K video recording",
            "category": "camera",
            "status": EquipmentStatus.AVAILABLE,
            "image_url": "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400"
        }
        
        existing = db.query(Equipment).filter(
            Equipment.name == sample_equipment["name"],
            Equipment.model == sample_equipment["model"]
        ).first()
        
        if not existing:
            equipment = Equipment(**sample_equipment)
            db.add(equipment)
            print(f"Created equipment: {sample_equipment['name']}")
        
        db.commit()
        print("\nDatabase initialized successfully!")
        print("\nAdmin account:")
        print("Email: admin@admin.com")
        print("Password: admin123")
        print("\nYou can now register additional users through the web interface.")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
