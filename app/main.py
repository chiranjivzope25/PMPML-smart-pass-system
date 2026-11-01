from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import subprocess
import os

from app import model, schema, auth, crud, database, seed, migrate

# Run database migrations first to ensure columns exist
migrate.run_migrations()

# Create database tables
model.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="PMPL Online Bus Pass Management System",
    description="Backend API for PMPL Online Bus Pass Booking & Conductor QR Verification",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StripAPIPrefixMiddleware:
    """Allows endpoints prefixed with /api (from Vercel rewrites or frontend proxy) to map seamlessly to backend routes."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            path = scope.get("path", "")
            if path == "/api":
                scope["path"] = "/"
            elif path.startswith("/api/"):
                scope["path"] = path[4:]
        await self.app(scope, receive, send)

app.add_middleware(StripAPIPrefixMiddleware)

frontend_process = None

@app.on_event("startup")
def on_startup():
    db = database.SessionLocal()
    try:
        seed.seed_passes(db)
    finally:
        db.close()
    
    # Only spawn frontend if running locally outside run.py and not on Vercel/production
    if not os.getenv("VERCEL") and os.getenv("ENV") != "production" and os.getenv("RUNNING_VIA_RUN_PY") != "1":
        global frontend_process
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
        if os.path.exists(os.path.join(frontend_dir, "package.json")):
            try:
                frontend_process = subprocess.Popen(
                    [npm_cmd, "run", "dev"],
                    cwd=frontend_dir
                )
            except Exception as e:
                print(f"Frontend auto-launch skipped/failed: {e}")

@app.on_event("shutdown")
def on_shutdown():
    global frontend_process
    if frontend_process:
        print("Stopping frontend server...")
        frontend_process.terminate()
        try:
            frontend_process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            frontend_process.kill()

@app.get("/")
def read_root():
    return {
        "message": "Welcome to PMPL Online Bus Pass Management System",
        "version": "2.0.0",
        "status": "online"
    }

# ----------------- AUTHENTICATION -----------------

@app.post("/register", response_model=schema.UserResponse)
def register(user: schema.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/conductor/register", response_model=schema.UserResponse)
def conductor_register(user: schema.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user.role = "conductor"
    if not user.conductor_badge:
        user.conductor_badge = f"PMPL-C{user.email[:3].upper()}"
    return crud.create_user(db=db, user=user)

@app.post("/login", response_model=schema.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role or "passenger",
        "name": user.name,
        "email": user.email,
        "conductor_badge": user.conductor_badge
    }

@app.post("/conductor/login", response_model=schema.Token)
def conductor_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.role != "conductor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is registered as a Passenger. Please login through the Passenger portal.",
        )
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "email": user.email,
        "conductor_badge": user.conductor_badge
    }

@app.get("/me", response_model=schema.UserResponse)
def read_users_me(current_user: model.User = Depends(auth.get_current_user)):
    return current_user

# ----------------- PASSES -----------------

@app.get("/passes", response_model=List[schema.PassResponse])
def get_passes(current_user: model.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return crud.get_all_passes(db)

# ----------------- PASSENGER BOOKING -----------------

@app.post("/book-pass", response_model=schema.BookingResponse)
def book_pass(booking: schema.BookingCreate, current_user: model.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if booking.source.lower().strip() == booking.destination.lower().strip():
        raise HTTPException(status_code=400, detail="Source and destination cannot be the same")
    
    # Aadhaar validation
    clean_aadhar = booking.aadhar_number.replace(" ", "").replace("-", "")
    if not clean_aadhar.isdigit() or len(clean_aadhar) != 12:
        raise HTTPException(status_code=400, detail="Aadhaar number must be exactly 12 digits")

    # PAN validation
    clean_pan = booking.pan_number.strip().upper()
    if len(clean_pan) != 10:
        raise HTTPException(status_code=400, detail="PAN card number must be 10 characters")

    bus_pass = crud.get_pass_by_id(db, pass_id=booking.pass_id)
    if not bus_pass:
        raise HTTPException(status_code=404, detail="Pass not found")
    
    return crud.create_booking(db=db, booking=booking, user_id=current_user.id)

@app.get("/my-bookings", response_model=List[schema.BookingResponse])
def get_my_bookings(current_user: model.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return crud.get_user_bookings(db, user_id=current_user.id)

@app.get("/booking/{booking_id}", response_model=schema.BookingResponse)
def get_booking(booking_id: str, current_user: model.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    booking = crud.get_user_booking_by_booking_id(db, booking_id=booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != "conductor":
        raise HTTPException(status_code=403, detail="Not authorized to view this booking")
    return booking

@app.delete("/booking/{booking_id}", response_model=schema.BookingCancelResponse)
def cancel_booking(booking_id: str, current_user: model.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    booking = crud.get_user_booking_by_booking_id(db, booking_id=booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
    if booking.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")
    
    crud.cancel_booking(db=db, booking=booking)
    return {"message": "Booking cancelled successfully", "booking_id": booking.booking_id, "status": "Cancelled"}

# ----------------- CONDUCTOR VERIFICATION & PASS APPROVAL -----------------

@app.get("/conductor/verify/{identifier}", response_model=schema.PassVerifyResponse)
def verify_passenger_pass(
    identifier: str,
    current_conductor: model.User = Depends(auth.get_current_conductor),
    db: Session = Depends(database.get_db)
):
    booking = crud.find_booking_by_identifier(db, identifier=identifier)
    if not booking:
        raise HTTPException(status_code=404, detail=f"No pass found for identifier '{identifier}'. Please check the QR code or Aadhaar.")

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    today_validation = crud.get_today_validation(db, booking.booking_id, today_str)

    now = datetime.utcnow()
    is_valid = True
    status_msg = "Pass is Active and Valid for Travel."

    if booking.status == "Cancelled":
        is_valid = False
        status_msg = "This pass has been CANCELLED."
    elif booking.valid_until and booking.valid_until < now:
        is_valid = False
        status_msg = f"This pass EXPIRED on {booking.valid_until.strftime('%d-%b-%Y')}."
    elif today_validation:
        status_msg = f"Already APPROVED for today at {today_validation.validated_at.strftime('%I:%M %p')} by Conductor {today_validation.conductor_name}."

    return {
        "valid": is_valid,
        "status_message": status_msg,
        "is_today_approved": today_validation is not None,
        "today_validation": today_validation,
        "booking": booking
    }

@app.post("/conductor/approve-today", response_model=schema.PassApproveResponse)
def approve_passenger_pass(
    payload: schema.PassApproveRequest,
    current_conductor: model.User = Depends(auth.get_current_conductor),
    db: Session = Depends(database.get_db)
):
    booking = crud.get_user_booking_by_booking_id(db, booking_id=payload.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Cannot approve: Pass has been cancelled.")

    now = datetime.utcnow()
    if booking.valid_until and booking.valid_until < now:
        raise HTTPException(status_code=400, detail="Cannot approve: Pass has expired.")

    validation = crud.approve_pass_for_today(
        db=db,
        booking=booking,
        conductor=current_conductor,
        bus_number=payload.bus_number
    )

    return {
        "message": f"Pass successfully validated and allowed for today ({validation.validation_date})!",
        "booking_id": booking.booking_id,
        "passenger_name": booking.passenger_name,
        "aadhar_number": booking.aadhar_number,
        "validation_date": validation.validation_date,
        "status": validation.status,
        "validated_at": validation.validated_at,
        "conductor_name": current_conductor.name
    }

@app.get("/conductor/today-validations", response_model=List[schema.ValidationResponse])
def get_today_validations(
    current_conductor: model.User = Depends(auth.get_current_conductor),
    db: Session = Depends(database.get_db)
):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    return crud.get_conductor_validations_today(db, conductor_id=current_conductor.id, date_str=today_str)