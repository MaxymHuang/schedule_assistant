from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import engine, Base
from app.routes import auth, equipment, booking_auth, booking, category, admin
from app.core.scheduler import start_scheduler, stop_scheduler
from sqlalchemy import text

# Create database tables with proper enum handling
def create_tables_safely():
    """Create database tables, handling existing enum types gracefully."""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        # If there's an enum conflict, the enum types already exist
        if "duplicate key value violates unique constraint" in str(e) and "pg_type_typname_nsp_index" in str(e):
            print("Database enum types already exist, skipping enum creation...")
            # Just create the tables, the enums are already there
            with engine.connect() as conn:
                for table in Base.metadata.tables.values():
                    table.create(conn, checkfirst=True)
        else:
            raise e

create_tables_safely()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()


app = FastAPI(title="Equipment Lending System", version="1.0.0", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "http://localhost", "http://localhost:80"],  # Vite and React dev servers + production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(equipment.router)
app.include_router(booking_auth.router)  # User booking routes
app.include_router(booking.router)       # Admin booking routes
app.include_router(category.router)      # Category management routes
app.include_router(admin.router)         # Admin database management routes


@app.get("/")
def read_root():
    return {"message": "Equipment Lending System API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
