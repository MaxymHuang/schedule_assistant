#!/usr/bin/env python3
"""
API Endpoints Testing Script
Tests the admin equipment management API endpoints
"""

import requests
import json
import sys
from datetime import datetime

API_BASE_URL = "http://localhost:8000"

def test_api_endpoint(method, endpoint, data=None, headers=None, expected_status=200):
    """Test an API endpoint and return the response"""
    url = f"{API_BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        print(f"  {method} {endpoint} -> {response.status_code}")
        
        if response.status_code == expected_status:
            print(f"    ✅ Success")
            if response.content:
                try:
                    return response.json()
                except:
                    return response.text
            return None
        else:
            print(f"    ❌ Expected {expected_status}, got {response.status_code}")
            if response.content:
                try:
                    error_data = response.json()
                    print(f"    Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"    Error: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"    ❌ Request failed: {e}")
        return None

def get_admin_token():
    """Get admin authentication token"""
    print("🔐 Getting admin authentication token...")
    
    login_data = {
        "username": "admin@example.com",
        "password": "admin"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/api/auth/login", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            print(f"  ✅ Admin token obtained")
            return token_data["access_token"]
        else:
            print(f"  ❌ Login failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"  ❌ Login error: {e}")
        return None

def main():
    """Main function to test API endpoints"""
    print("🧪 API Endpoints Testing Script")
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 API Base URL: {API_BASE_URL}")
    
    # Test basic connectivity
    print(f"\n{'='*60}")
    print("📊 Basic Connectivity Test")
    print(f"{'='*60}")
    
    health_response = test_api_endpoint("GET", "/health")
    if not health_response:
        print("❌ API server is not responding. Make sure the backend is running.")
        sys.exit(1)
    
    # Test equipment listing
    print(f"\n{'='*60}")
    print("📦 Equipment Endpoints Test")
    print(f"{'='*60}")
    
    equipment_list = test_api_endpoint("GET", "/api/equipment/")
    if equipment_list:
        print(f"  📊 Found {len(equipment_list)} equipment items")
        if equipment_list:
            first_equipment = equipment_list[0]
            print(f"  📋 Sample equipment: {first_equipment['name']} (ID: {first_equipment['id']})")
    
    # Get admin token
    admin_token = get_admin_token()
    if not admin_token:
        print("❌ Cannot proceed without admin token")
        sys.exit(1)
    
    admin_headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    # Test admin equipment update
    print(f"\n{'='*60}")
    print("🔧 Admin Equipment Management Test")
    print(f"{'='*60}")
    
    if equipment_list and len(equipment_list) > 0:
        test_equipment = equipment_list[0]
        equipment_id = test_equipment["id"]
        
        print(f"📝 Testing update on equipment ID {equipment_id}: {test_equipment['name']}")
        
        # Test equipment update
        update_data = {
            "name": f"{test_equipment['name']} - API Test Update",
            "description": f"Updated via API test at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        }
        
        updated_equipment = test_api_endpoint("PUT", f"/api/equipment/{equipment_id}", 
                                            data=update_data, headers=admin_headers)
        
        if updated_equipment:
            print(f"  ✅ Equipment updated successfully")
            print(f"  📋 New name: {updated_equipment['name']}")
            print(f"  📝 New description: {updated_equipment['description']}")
            
            # Verify the update by fetching the equipment again
            print(f"\n🔍 Verifying update...")
            verify_equipment = test_api_endpoint("GET", f"/api/equipment/{equipment_id}")
            if verify_equipment:
                if verify_equipment['name'] == updated_equipment['name']:
                    print(f"  ✅ Update verified - database is consistent")
                else:
                    print(f"  ❌ Update verification failed - data mismatch")
    
    # Test equipment creation (if we have admin access)
    print(f"\n{'='*60}")
    print("➕ Equipment Creation Test")
    print(f"{'='*60}")
    
    new_equipment_data = {
        "name": "API Test Equipment",
        "model": "Test Model 2024",
        "description": "Equipment created via API test script",
        "category": "other",
        "image_url": "https://via.placeholder.com/400x300?text=Test+Equipment"
    }
    
    created_equipment = test_api_endpoint("POST", "/api/equipment/", 
                                        data=new_equipment_data, headers=admin_headers)
    
    if created_equipment:
        print(f"  ✅ Equipment created successfully")
        print(f"  📋 Created equipment: {created_equipment['name']} (ID: {created_equipment['id']})")
        
        # Test equipment deletion
        print(f"\n🗑️  Testing equipment deletion...")
        delete_result = test_api_endpoint("DELETE", f"/api/equipment/{created_equipment['id']}", 
                                        headers=admin_headers)
        
        if delete_result:
            print(f"  ✅ Equipment deleted successfully")
            
            # Verify deletion
            print(f"  🔍 Verifying deletion...")
            verify_deleted = test_api_endpoint("GET", f"/api/equipment/{created_equipment['id']}", 
                                             expected_status=404)
            if verify_deleted is None:  # 404 means not found, which is expected
                print(f"  ✅ Deletion verified - equipment no longer exists")
            else:
                print(f"  ❌ Deletion verification failed - equipment still exists")
    
    # Final equipment count
    print(f"\n{'='*60}")
    print("📊 Final Status")
    print(f"{'='*60}")
    
    final_equipment_list = test_api_endpoint("GET", "/api/equipment/")
    if final_equipment_list:
        print(f"📦 Final equipment count: {len(final_equipment_list)}")
    
    print(f"\n✅ API endpoints testing completed successfully!")

if __name__ == "__main__":
    main()
