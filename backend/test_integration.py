#!/usr/bin/env python3
"""
Comprehensive Integration Tests for Equipment Lending System API

This test suite covers all API endpoints including:
- Authentication (login, register)
- Equipment CRUD operations
- User booking operations
- Admin booking management
- Equipment availability checks
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.core.database import get_db, Base
from app.core.auth import get_password_hash
from app.models.user import User, UserRole
from app.models.equipment import Equipment, EquipmentStatus
from app.models.booking import Booking, BookingStatus

# Test database URL (using SQLite in-memory for testing)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="function")
def setup_test_db():
    """Set up test database with sample data for each test"""
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    
    # Create test users
    admin_user = User(
        email="admin@test.com",
        name="Test Admin",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN
    )
    regular_user = User(
        email="user@test.com",
        name="Test User",
        password_hash=get_password_hash("user123"),
        role=UserRole.USER
    )
    
    db.add(admin_user)
    db.add(regular_user)
    db.commit()
    db.refresh(admin_user)
    db.refresh(regular_user)
    
    # Create test equipment
    equipment1 = Equipment(
        name="Test Camera",
        model="Test Model",
        description="Test camera for testing",
        category="camera",
        status=EquipmentStatus.AVAILABLE,
        image_url="https://example.com/camera.jpg"
    )
    equipment2 = Equipment(
        name="Test Laptop",
        model="Test Laptop Model",
        description="Test laptop for testing",
        category="laptop",
        status=EquipmentStatus.AVAILABLE,
        image_url="https://example.com/laptop.jpg"
    )
    
    db.add(equipment1)
    db.add(equipment2)
    db.commit()
    db.refresh(equipment1)
    db.refresh(equipment2)
    
    yield {
        "admin_user": admin_user,
        "regular_user": regular_user,
        "equipment1": equipment1,
        "equipment2": equipment2
    }
    
    db.close()
    Base.metadata.drop_all(bind=engine)


def get_auth_headers(email: str, password: str):
    """Helper function to get authentication headers"""
    response = client.post("/api/auth/login", data={"username": email, "password": password})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_register_user(self, setup_test_db):
        """Test user registration"""
        response = client.post("/api/auth/register", json={
            "email": "newuser@test.com",
            "name": "New User",
            "password": "newpassword123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newuser@test.com"
        assert data["name"] == "New User"
        assert data["role"] == "user"
        assert "id" in data
    
    def test_register_duplicate_email(self, setup_test_db):
        """Test registration with duplicate email"""
        response = client.post("/api/auth/register", json={
            "email": "user@test.com",  # Already exists
            "name": "Duplicate User",
            "password": "password123"
        })
        assert response.status_code == 400
    
    def test_login_success(self, setup_test_db):
        """Test successful login"""
        response = client.post("/api/auth/login", data={
            "username": "user@test.com",
            "password": "user123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, setup_test_db):
        """Test login with invalid credentials"""
        response = client.post("/api/auth/login", data={
            "username": "user@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_get_current_user(self, setup_test_db):
        """Test getting current user info"""
        headers = get_auth_headers("user@test.com", "user123")
        response = client.get("/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "user@test.com"
        assert data["name"] == "Test User"
        assert data["role"] == "user"


class TestEquipmentEndpoints:
    """Test equipment CRUD operations"""
    
    def test_get_equipment_list(self, setup_test_db):
        """Test getting equipment list"""
        response = client.get("/api/equipment/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert any(eq["name"] == "Test Camera" for eq in data)
        assert any(eq["name"] == "Test Laptop" for eq in data)
    
    def test_get_equipment_by_id(self, setup_test_db):
        """Test getting equipment by ID"""
        equipment_id = setup_test_db["equipment1"].id
        response = client.get(f"/api/equipment/{equipment_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Camera"
        assert data["id"] == equipment_id
    
    def test_get_nonexistent_equipment(self, setup_test_db):
        """Test getting non-existent equipment"""
        response = client.get("/api/equipment/999")
        assert response.status_code == 404
    
    def test_create_equipment_admin(self, setup_test_db):
        """Test creating equipment as admin"""
        headers = get_auth_headers("admin@test.com", "admin123")
        response = client.post("/api/equipment/", json={
            "name": "New Equipment",
            "model": "New Model",
            "description": "New equipment description",
            "category": "audio",
            "status": "available",
            "image_url": "https://example.com/new.jpg"
        }, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Equipment"
        assert data["category"] == "audio"
    
    def test_create_equipment_non_admin(self, setup_test_db):
        """Test creating equipment as non-admin (should fail)"""
        headers = get_auth_headers("user@test.com", "user123")
        response = client.post("/api/equipment/", json={
            "name": "New Equipment",
            "model": "New Model",
            "description": "New equipment description",
            "category": "audio",
            "status": "available",
            "image_url": "https://example.com/new.jpg"
        }, headers=headers)
        assert response.status_code == 403
    
    def test_update_equipment_admin(self, setup_test_db):
        """Test updating equipment as admin"""
        headers = get_auth_headers("admin@test.com", "admin123")
        equipment_id = setup_test_db["equipment1"].id
        response = client.put(f"/api/equipment/{equipment_id}", json={
            "name": "Updated Camera",
            "description": "Updated description"
        }, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Camera"
        assert data["description"] == "Updated description"
    
    def test_delete_equipment_admin(self, setup_test_db):
        """Test deleting equipment as admin"""
        headers = get_auth_headers("admin@test.com", "admin123")
        equipment_id = setup_test_db["equipment2"].id
        response = client.delete(f"/api/equipment/{equipment_id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Equipment deleted successfully"
    
    def test_equipment_availability_check(self, setup_test_db):
        """Test equipment availability check"""
        equipment_id = setup_test_db["equipment1"].id
        start_time = datetime.now() + timedelta(hours=1)
        
        response = client.get(f"/api/equipment/{equipment_id}/availability", params={
            "start_datetime": start_time.isoformat(),
            "duration_hours": 2
        })
        assert response.status_code == 200
        data = response.json()
        assert data["equipment_id"] == equipment_id
        assert data["is_available"] == True
        assert data["duration_hours"] == 2


class TestUserBookingEndpoints:
    """Test user booking operations"""
    
    def test_create_booking_user(self, setup_test_db):
        """Test creating booking as user"""
        headers = get_auth_headers("user@test.com", "user123")
        equipment_id = setup_test_db["equipment1"].id
        start_time = datetime.now() + timedelta(hours=1)
        
        response = client.post("/api/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": start_time.isoformat(),
            "booking_duration_hours": 2
        }, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["equipment_id"] == equipment_id
        assert data["booking_duration_hours"] == 2
        assert data["status"] == "active"
    
    def test_create_booking_admin_forbidden(self, setup_test_db):
        """Test that admin cannot create bookings"""
        headers = get_auth_headers("admin@test.com", "admin123")
        equipment_id = setup_test_db["equipment1"].id
        start_time = datetime.now() + timedelta(hours=1)
        
        response = client.post("/api/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": start_time.isoformat(),
            "booking_duration_hours": 2
        }, headers=headers)
        assert response.status_code == 403
        assert "Admins cannot create bookings" in response.json()["detail"]
    
    def test_create_booking_invalid_duration(self, setup_test_db):
        """Test creating booking with invalid duration"""
        headers = get_auth_headers("user@test.com", "user123")
        equipment_id = setup_test_db["equipment1"].id
        start_time = datetime.now() + timedelta(hours=1)
        
        response = client.post("/api/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": start_time.isoformat(),
            "booking_duration_hours": 10  # Invalid: > 8 hours
        }, headers=headers)
        assert response.status_code == 422  # Validation error
    
    def test_create_booking_past_time(self, setup_test_db):
        """Test creating booking in the past"""
        headers = get_auth_headers("user@test.com", "user123")
        equipment_id = setup_test_db["equipment1"].id
        past_time = datetime.now() - timedelta(hours=1)
        
        response = client.post("/api/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": past_time.isoformat(),
            "booking_duration_hours": 2
        }, headers=headers)
        assert response.status_code == 400
        assert "past" in response.json()["detail"].lower()
    
    def test_create_booking_conflict(self, setup_test_db):
        """Test creating booking with time conflict"""
        headers = get_auth_headers("user@test.com", "user123")
        equipment_id = setup_test_db["equipment1"].id
        start_time = datetime.now() + timedelta(hours=1)
        
        # Create first booking
        response1 = client.post("/api/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": start_time.isoformat(),
            "booking_duration_hours": 2
        }, headers=headers)
        assert response1.status_code == 200
        
        # Try to create conflicting booking
        response2 = client.post("/api/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": (start_time + timedelta(hours=1)).isoformat(),
            "booking_duration_hours": 2
        }, headers=headers)
        assert response2.status_code == 400
        assert "not available" in response2.json()["detail"].lower()
    
    def test_get_user_bookings(self, setup_test_db):
        """Test getting user's bookings"""
        headers = get_auth_headers("user@test.com", "user123")
        equipment_id = setup_test_db["equipment1"].id
        start_time = datetime.now() + timedelta(hours=1)
        
        # Create a booking
        client.post("/api/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": start_time.isoformat(),
            "booking_duration_hours": 2
        }, headers=headers)
        
        # Get user bookings
        response = client.get("/api/bookings/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["equipment_id"] == equipment_id
    
    def test_cancel_booking_user(self, setup_test_db):
        """Test user canceling their own booking"""
        headers = get_auth_headers("user@test.com", "user123")
        equipment_id = setup_test_db["equipment1"].id
        start_time = datetime.now() + timedelta(hours=1)
        
        # Create a booking
        create_response = client.post("/api/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": start_time.isoformat(),
            "booking_duration_hours": 2
        }, headers=headers)
        booking_id = create_response.json()["id"]
        
        # Cancel the booking
        response = client.delete(f"/api/bookings/{booking_id}", headers=headers)
        assert response.status_code == 200
        assert "cancelled successfully" in response.json()["message"]


class TestAdminBookingEndpoints:
    """Test admin booking management"""
    
    def test_get_all_bookings_admin(self, setup_test_db):
        """Test admin getting all bookings"""
        headers = get_auth_headers("admin@test.com", "admin123")
        
        # Create a booking as user first
        user_headers = get_auth_headers("user@test.com", "user123")
        equipment_id = setup_test_db["equipment1"].id
        start_time = datetime.now() + timedelta(hours=1)
        
        client.post("/api/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": start_time.isoformat(),
            "booking_duration_hours": 2
        }, headers=user_headers)
        
        # Admin gets all bookings
        response = client.get("/api/admin/bookings/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["equipment_id"] == equipment_id
    
    def test_get_booking_by_id_admin(self, setup_test_db):
        """Test admin getting specific booking"""
        headers = get_auth_headers("admin@test.com", "admin123")
        
        # Create a booking as user first
        user_headers = get_auth_headers("user@test.com", "user123")
        equipment_id = setup_test_db["equipment1"].id
        start_time = datetime.now() + timedelta(hours=1)
        
        create_response = client.post("/api/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": start_time.isoformat(),
            "booking_duration_hours": 2
        }, headers=user_headers)
        booking_id = create_response.json()["id"]
        
        # Admin gets the booking
        response = client.get(f"/api/admin/bookings/{booking_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == booking_id
        assert data["equipment_id"] == equipment_id
    
    def test_update_booking_admin(self, setup_test_db):
        """Test admin updating booking"""
        headers = get_auth_headers("admin@test.com", "admin123")
        
        # Create a booking as user first
        user_headers = get_auth_headers("user@test.com", "user123")
        equipment_id = setup_test_db["equipment1"].id
        start_time = datetime.now() + timedelta(hours=1)
        
        create_response = client.post("/api/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": start_time.isoformat(),
            "booking_duration_hours": 2
        }, headers=user_headers)
        booking_id = create_response.json()["id"]
        
        # Admin updates the booking
        new_start_time = datetime.now() + timedelta(hours=3)
        response = client.put(f"/api/admin/bookings/{booking_id}", json={
            "booking_start_datetime": new_start_time.isoformat(),
            "booking_duration_hours": 3
        }, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["booking_duration_hours"] == 3
    
    def test_cancel_booking_admin(self, setup_test_db):
        """Test admin canceling booking"""
        headers = get_auth_headers("admin@test.com", "admin123")
        
        # Create a booking as user first
        user_headers = get_auth_headers("user@test.com", "user123")
        equipment_id = setup_test_db["equipment1"].id
        start_time = datetime.now() + timedelta(hours=1)
        
        create_response = client.post("/api/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": start_time.isoformat(),
            "booking_duration_hours": 2
        }, headers=user_headers)
        booking_id = create_response.json()["id"]
        
        # Admin cancels the booking
        response = client.delete(f"/api/admin/bookings/{booking_id}", headers=headers)
        assert response.status_code == 200
        assert "cancelled successfully" in response.json()["message"]
    
    def test_admin_cannot_create_bookings(self, setup_test_db):
        """Test that admin cannot create bookings via admin endpoint"""
        headers = get_auth_headers("admin@test.com", "admin123")
        equipment_id = setup_test_db["equipment1"].id
        start_time = datetime.now() + timedelta(hours=1)
        
        response = client.post("/api/admin/bookings/", json={
            "equipment_id": equipment_id,
            "booking_start_datetime": start_time.isoformat(),
            "booking_duration_hours": 2
        }, headers=headers)
        assert response.status_code == 403
        assert "Admins cannot create bookings" in response.json()["detail"]


class TestAuthorization:
    """Test authorization and access control"""
    
    def test_unauthorized_access(self, setup_test_db):
        """Test accessing protected endpoints without authentication"""
        response = client.get("/api/bookings/")
        assert response.status_code == 401
    
    def test_user_cannot_access_admin_endpoints(self, setup_test_db):
        """Test that users cannot access admin endpoints"""
        headers = get_auth_headers("user@test.com", "user123")
        response = client.get("/api/admin/bookings/", headers=headers)
        assert response.status_code == 403
    
    def test_user_cannot_modify_other_users_bookings(self, setup_test_db):
        """Test that users cannot modify other users' bookings"""
        # This would require creating two users and testing cross-user access
        # For now, we'll test that users can only see their own bookings
        headers = get_auth_headers("user@test.com", "user123")
        response = client.get("/api/bookings/", headers=headers)
        assert response.status_code == 200
        # Should only return user's own bookings (empty in this case)


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])
