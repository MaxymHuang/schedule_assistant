#!/usr/bin/env python3
"""
Migration script to create categories table and populate with existing categories
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine, SessionLocal, Base
from app.models.category import Category
from app.models.equipment import Equipment

def migrate_categories():
    """Create categories table and migrate existing string categories"""
    
    # Create all tables (including the new categories table)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # First, add the category_id column to equipment table if it doesn't exist
        try:
            with engine.connect() as conn:
                # Add column without foreign key constraint first
                conn.execute(text("ALTER TABLE equipment ADD COLUMN category_id INTEGER"))
                conn.commit()
                print("Added category_id column to equipment table")
        except Exception as e:
            if "already exists" in str(e) or "duplicate column" in str(e).lower():
                print("category_id column already exists")
            else:
                print(f"Warning: Could not add category_id column: {e}")
        
        # Get all unique categories from existing equipment
        existing_categories = db.query(Equipment.category).distinct().all()
        category_names = [cat[0] for cat in existing_categories if cat[0]]
        
        print(f"Found existing categories: {category_names}")
        
        # Create category records for each unique category
        created_categories = {}
        for category_name in category_names:
            # Check if category already exists
            existing = db.query(Category).filter(Category.name == category_name).first()
            if not existing:
                category = Category(
                    name=category_name,
                    description=f"Equipment category for {category_name}"
                )
                db.add(category)
                db.flush()  # Get the ID
                created_categories[category_name] = category.id
                print(f"Created category: {category_name}")
            else:
                created_categories[category_name] = existing.id
                print(f"Category already exists: {category_name}")
        
        # Update equipment records to reference the new category IDs
        for category_name, category_id in created_categories.items():
            # Use raw SQL to avoid SQLAlchemy model issues
            with engine.connect() as conn:
                result = conn.execute(
                    text("UPDATE equipment SET category_id = :category_id WHERE category = :category_name"),
                    {"category_id": category_id, "category_name": category_name}
                )
                conn.commit()
                print(f"Updated {result.rowcount} equipment items for category '{category_name}' to reference category ID {category_id}")
        
        db.commit()
        
        # Now add the foreign key constraint
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE equipment ADD CONSTRAINT equipment_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id)"))
                conn.commit()
                print("Added foreign key constraint")
        except Exception as e:
            if "already exists" in str(e) or "duplicate" in str(e).lower():
                print("Foreign key constraint already exists")
            else:
                print(f"Warning: Could not add foreign key constraint: {e}")
        
        print("\nCategory migration completed successfully!")
        
        # Display summary
        categories = db.query(Category).all()
        print(f"\nTotal categories: {len(categories)}")
        for category in categories:
            with engine.connect() as conn:
                result = conn.execute(
                    text("SELECT COUNT(*) FROM equipment WHERE category_id = :category_id"),
                    {"category_id": category.id}
                )
                equipment_count = result.scalar()
                print(f"- {category.name}: {equipment_count} equipment items")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_categories()
