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

### Development Setup

#### Prerequisites
- Python 3.11+
- Node.js 16+
- uv (Python package manager)

#### Backend Setup

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

#### Frontend Setup

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

The frontend will be available at `http://localhost:5173`

### Production Deployment

For production deployment using Docker Compose with PostgreSQL, see the [DEPLOYMENT.md](DEPLOYMENT.md) guide.

#### Quick Production Start

```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment files with your settings
# Then deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

The application will be available at `http://your-server-ip`

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

### Default Admin Account
- **Email**: admin@admin.com
- **Password**: admin123

**Important**: Change the admin password after first login in production.

### User Flow
1. **Login**: Sign in with admin credentials or register a new account
2. **Browse Equipment**: View available equipment with search and filters
3. **Book Equipment**: Select equipment and choose borrow/return dates
4. **Manage Bookings**: View and cancel your bookings from the dashboard
5. **Admin Functions**: Admins can manage equipment inventory and users

## Database Schema

### Users
- id, email, name, password_hash, role, created_at

### Equipment
- id, name, model, description, category, status, image_url, created_at

### Bookings
- id, equipment_id, user_id, borrow_date, return_date, status, created_at

## Development

### Backend Development
- PostgreSQL database with automatic initialization
- Use `uv run uvicorn main:app --reload` for development
- API documentation available at `http://localhost:8000/docs`
- Environment variables configured via `.env` file

### Frontend Development
- Uses Vite for fast development
- Hot reload enabled
- TypeScript for type safety
- Tailwind CSS for styling
- Environment variables via `.env` file

### Production Features
- Docker containerization for both frontend and backend
- PostgreSQL database with persistent storage
- Nginx reverse proxy with static file serving
- Health checks and restart policies
- Environment-based configuration
- Security headers and optimizations

## License

This project is licensed under the MIT License.
