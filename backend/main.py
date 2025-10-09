from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routes import auth, equipment, booking_auth, booking, category, admin

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Equipment Lending System", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],  # Vite and React dev servers
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
