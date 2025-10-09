from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func

from ..core.database import get_db
from ..core.auth import get_current_user, require_admin
from ..models.category import Category
from ..models.equipment import Equipment
from ..schemas.category import Category as CategorySchema, CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("/", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    """Get all categories with equipment counts"""
    categories = db.query(
        Category,
        func.count(Equipment.id).label('equipment_count')
    ).outerjoin(Equipment, Category.id == Equipment.category_id).group_by(Category.id).all()
    
    result = []
    for category, count in categories:
        category_dict = {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "created_at": category.created_at,
            "equipment_count": count
        }
        result.append(category_dict)
    
    return result


@router.get("/{category_id}", response_model=CategorySchema)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a specific category by ID"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Get equipment count
    equipment_count = db.query(Equipment).filter(Equipment.category_id == category_id).count()
    
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "created_at": category.created_at,
        "equipment_count": equipment_count
    }


@router.post("/", response_model=CategorySchema)
def create_category(
    category: CategoryCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new category (admin only)"""
    # Check if category with same name already exists
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )
    
    db_category = Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return {
        "id": db_category.id,
        "name": db_category.name,
        "description": db_category.description,
        "created_at": db_category.created_at,
        "equipment_count": 0
    }


@router.put("/{category_id}", response_model=CategorySchema)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a category (admin only)"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if new name conflicts with existing category
    if category_update.name and category_update.name != category.name:
        existing = db.query(Category).filter(
            Category.name == category_update.name,
            Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )
    
    # Store old name for equipment update
    old_name = category.name
    
    # Update fields
    update_data = category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    # If category name was changed, update all equipment items that reference this category
    if category_update.name and category_update.name != old_name:
        equipment_items = db.query(Equipment).filter(Equipment.category_id == category_id).all()
        for equipment in equipment_items:
            equipment.category = category_update.name
        db.commit()
    
    # Get equipment count
    equipment_count = db.query(Equipment).filter(Equipment.category_id == category_id).count()
    
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "created_at": category.created_at,
        "equipment_count": equipment_count
    }


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a category (admin only)"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if category has equipment
    equipment_count = db.query(Equipment).filter(Equipment.category_id == category_id).count()
    if equipment_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category with {equipment_count} equipment items. Please reassign or delete equipment first."
        )
    
    db.delete(category)
    db.commit()
    
    return {"message": "Category deleted successfully"}
