#!/usr/bin/env python3
"""
Reset database and run migration with proper category setup
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine, SessionLocal, Base
from app.models.category import Category
from app.models.equipment import Equipment

def reset_and_migrate():
    """Reset database and run migration with proper category setup"""
    
    # Drop all tables and recreate
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create default categories
        default_categories = [
            {"name": "camera", "description": "Cameras and photography equipment"},
            {"name": "laptop", "description": "Laptops and computers"},
            {"name": "projector", "description": "Projectors and display equipment"},
            {"name": "audio", "description": "Audio equipment and accessories"},
            {"name": "other", "description": "Other equipment and accessories"}
        ]
        
        created_categories = {}
        for cat_data in default_categories:
            category = Category(**cat_data)
            db.add(category)
            db.flush()  # Get the ID
            created_categories[cat_data["name"]] = category.id
            print(f"Created category: {cat_data['name']}")
        
        # Create sample equipment with proper category references
        sample_equipment = [
            {
                "name": "Canon EOS R5",
                "model": "EOS R5",
                "description": "Professional mirrorless camera with 45MP sensor",
                "category": "camera",
                "category_id": created_categories["camera"],
                "status": "available",
                "image_url": "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400"
            },
            {
                "name": "MacBook Pro 16-inch",
                "model": "MacBook Pro 16\" M2",
                "description": "High-performance laptop for video editing and development",
                "category": "laptop",
                "category_id": created_categories["laptop"],
                "status": "available",
                "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"
            },
            {
                "name": "Epson PowerLite 1781W",
                "model": "PowerLite 1781W",
                "description": "Wireless HD projector for presentations",
                "category": "projector",
                "category_id": created_categories["projector"],
                "status": "available",
                "image_url": "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400"
            },
            {
                "name": "Sony WH-1000XM4",
                "model": "WH-1000XM4",
                "description": "Noise-cancelling wireless headphones",
                "category": "audio",
                "category_id": created_categories["audio"],
                "status": "available",
                "image_url": "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400"
            },
            {
                "name": "DJI Mavic Air 2",
                "model": "Mavic Air 2",
                "description": "Compact drone with 4K video recording",
                "category": "camera",
                "category_id": created_categories["camera"],
                "status": "available",
                "image_url": "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400"
            }
        ]
        
        for eq_data in sample_equipment:
            equipment = Equipment(**eq_data)
            db.add(equipment)
            print(f"Created equipment: {eq_data['name']}")
        
        # Create sample users
        from app.core.auth import get_password_hash
        from app.models.user import User, UserRole
        
        admin_user = User(
            email="admin@example.com",
            name="Admin User",
            password_hash=get_password_hash("admin"),
            role=UserRole.ADMIN
        )
        db.add(admin_user)
        
        regular_user = User(
            email="user@example.com",
            name="Regular User",
            password_hash=get_password_hash("user"),
            role=UserRole.USER
        )
        db.add(regular_user)
        
        db.commit()
        print("\nDatabase reset and migration completed successfully!")
        
        # Display summary
        categories = db.query(Category).all()
        print(f"\nTotal categories: {len(categories)}")
        for category in categories:
            equipment_count = db.query(Equipment).filter(Equipment.category_id == category.id).count()
            print(f"- {category.name}: {equipment_count} equipment items")
        
        print("\nSample accounts:")
        print("Admin: admin@example.com / admin")
        print("User: user@example.com / user")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_migrate()
