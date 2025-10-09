from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.equipment import EquipmentStatus


class EquipmentBase(BaseModel):
    name: str
    model: str
    description: Optional[str] = None
    category: str
    image_url: Optional[str] = None


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[EquipmentStatus] = None
    image_url: Optional[str] = None


class Equipment(EquipmentBase):
    id: int
    status: EquipmentStatus
    created_at: datetime

    class Config:
        from_attributes = True
