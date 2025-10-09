#!/bin/bash

echo "=== Equipment Lending System - Status Check ==="
echo ""

# Check Backend
echo "1. Checking Backend API (http://localhost:8000)..."
BACKEND_STATUS=$(curl -s http://localhost:8000/health 2>&1)
if echo "$BACKEND_STATUS" | grep -q "healthy"; then
    echo "   ✅ Backend is running and healthy"
else
    echo "   ❌ Backend is not responding properly"
    echo "   Response: $BACKEND_STATUS"
fi
echo ""

# Check Frontend
echo "2. Checking Frontend (http://localhost:5173)..."
FRONTEND_STATUS=$(curl -s http://localhost:5173 2>&1 | grep -o "<title>.*</title>" | head -1)
if [ ! -z "$FRONTEND_STATUS" ]; then
    echo "   ✅ Frontend is serving pages"
    echo "   $FRONTEND_STATUS"
else
    echo "   ❌ Frontend is not responding"
fi
echo ""

# Check CORS
echo "3. Checking CORS configuration..."
CORS_CHECK=$(curl -s -H "Origin: http://localhost:5173" http://localhost:8000/health -v 2>&1 | grep "access-control")
if [ ! -z "$CORS_CHECK" ]; then
    echo "   ✅ CORS is configured"
else
    echo "   ⚠️  CORS headers not detected"
fi
echo ""

# Check Database
echo "4. Checking Database..."
if [ -f "/Users/maxymhuang/schedule_assistant/backend/equipment_lending.db" ]; then
    echo "   ✅ Database file exists"
    DB_SIZE=$(ls -lh /Users/maxymhuang/schedule_assistant/backend/equipment_lending.db | awk '{print $5}')
    echo "   Size: $DB_SIZE"
else
    echo "   ❌ Database file not found"
fi
echo ""

echo "=== Next Steps ==="
echo "1. Open your web browser"
echo "2. Navigate to: http://localhost:5173"
echo "3. Login with:"
echo "   - Admin: admin@example.com / admin"
echo "   - User: user@example.com / user"
echo ""
echo "If you see a blank page, check browser console (F12) for errors."

