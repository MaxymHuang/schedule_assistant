# Equipment Lending System - Setup Complete ✅

## System Status

Both backend and frontend servers are now running successfully!

### Backend API
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Status**: ✅ Running

### Frontend Application
- **URL**: http://localhost:5173
- **Status**: ✅ Running

## Test Accounts

Use these pre-configured accounts to test the system:

### Admin Account
- **Email**: admin@example.com
- **Password**: admin
- **Capabilities**: Full access to equipment management, view all bookings

### Regular User Account
- **Email**: user@example.com
- **Password**: user
- **Capabilities**: Browse equipment, create bookings, manage own bookings

## Sample Equipment

The database has been pre-populated with 5 equipment items:
1. **Canon EOS R5** (Camera)
2. **MacBook Pro 16-inch** (Laptop)
3. **Epson PowerLite 1781W** (Projector)
4. **Sony WH-1000XM4** (Audio)
5. **DJI Mavic Air 2** (Camera/Drone)

## Quick Start Guide

### 1. Login
- Open http://localhost:5173
- Use one of the test accounts above
- Or register a new account

### 2. Browse Equipment (All Users)
- Click "Equipment" in the navigation
- Use search and filters to find equipment
- View equipment details

### 3. Book Equipment (Regular Users)
- Click "Book Now" on available equipment
- Select borrow and return dates
- Submit booking (one booking per day limit applies)

### 4. Manage Bookings (All Users)
- View your bookings on the Dashboard
- Cancel active bookings if needed

### 5. Admin Functions (Admin Only)
- Click "Admin" in the navigation
- Add new equipment
- Edit existing equipment
- Delete equipment (only if no active bookings)
- View all user bookings

## Key Features Implemented

✅ User authentication (JWT-based)
✅ Role-based access control (user/admin)
✅ Equipment catalog with search and filters
✅ Booking system with validation
✅ Conflict detection (no double-booking)
✅ One booking per user per day limit
✅ Admin panel for equipment management
✅ Responsive UI with Tailwind CSS
✅ Error handling and loading states

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user info

### Equipment
- `GET /api/equipment` - List equipment (with filters)
- `GET /api/equipment/{id}` - Get equipment details
- `POST /api/equipment` - Create equipment (admin)
- `PUT /api/equipment/{id}` - Update equipment (admin)
- `DELETE /api/equipment/{id}` - Delete equipment (admin)
- `GET /api/equipment/{id}/availability` - Check availability

### Bookings
- `GET /api/bookings` - List all bookings (admin)
- `GET /api/bookings/my-bookings` - Get user's bookings
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/{id}` - Cancel booking

## Stopping the Servers

To stop the running servers:

```bash
# Stop backend
pkill -f "uvicorn main:app"

# Stop frontend
pkill -f "vite"
```

## Restarting the System

### Backend
```bash
cd backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

## Troubleshooting

### Backend not starting?
- Check if port 8000 is already in use
- Ensure database file has proper permissions
- Run `uv sync` to reinstall dependencies

### Frontend not starting?
- Check if port 5173 is already in use
- Run `npm install` to reinstall dependencies
- Clear node_modules and reinstall if needed

### Database issues?
- Delete `equipment_lending.db` and run `uv run python init_db.py` again
- This will reset the database with fresh sample data

## Next Steps

You can now:
1. Test all features with the sample accounts
2. Register new users
3. Add more equipment
4. Create and manage bookings
5. Explore the admin panel

Enjoy using the Equipment Lending System! 🎉
