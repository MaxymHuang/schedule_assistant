# Equipment Lending System

A simple web-based system for lending professional equipment with user authentication, equipment browsing, borrowing workflow, and admin management.

## Features

### Core Features
- **User Authentication**: Registration and login with JWT tokens
- **Equipment Browsing**: View available equipment with search and filtering
- **Booking System**: Book equipment with date validation and conflict detection
- **User Dashboard**: View personal bookings and manage reservations
- **Admin Panel**: Manage equipment inventory (add, edit, delete)

### Business Rules
- Users can only have one active booking per day
- Equipment cannot be double-booked for overlapping dates
- Admins have full CRUD access to equipment
- Users can only view/cancel their own bookings
- No return workflow - booking auto-completes after return date

## Tech Stack

### Backend
- **FastAPI** (Python) - Web framework
- **SQLAlchemy** - ORM
- **SQLite** - Database
- **JWT** - Authentication
- **Pydantic** - Data validation

### Frontend
- **React** with **TypeScript**
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Context API** - State management

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 16+
- uv (Python package manager)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
uv sync
```

3. Run the development server:
```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Equipment
- `GET /api/equipment` - List equipment (with filters)
- `GET /api/equipment/{id}` - Get equipment details
- `POST /api/equipment` - Create equipment (admin only)
- `PUT /api/equipment/{id}` - Update equipment (admin only)
- `DELETE /api/equipment/{id}` - Delete equipment (admin only)
- `GET /api/equipment/{id}/availability` - Check availability

### Bookings
- `GET /api/bookings` - List all bookings (admin only)
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/{id}` - Get booking details
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/{id}` - Cancel booking

## Usage

### Sample Accounts
- **Admin**: admin@example.com / admin
- **User**: user@example.com / user

### User Flow
1. **Register/Login**: Create an account or sign in with sample credentials
2. **Browse Equipment**: View available equipment with search and filters
3. **Book Equipment**: Select equipment and choose borrow/return dates
4. **Manage Bookings**: View and cancel your bookings from the dashboard
5. **Admin Functions**: Admins can manage equipment inventory

## Database Schema

### Users
- id, email, name, password_hash, role, created_at

### Equipment
- id, name, model, description, category, status, image_url, created_at

### Bookings
- id, equipment_id, user_id, borrow_date, return_date, status, created_at

## Development

### Backend Development
- The database is automatically created on first run
- Use `uv run uvicorn main:app --reload` for development
- API documentation available at `http://localhost:8000/docs`

### Frontend Development
- Uses Vite for fast development
- Hot reload enabled
- TypeScript for type safety
- Tailwind CSS for styling

## License

This project is licensed under the MIT License.
