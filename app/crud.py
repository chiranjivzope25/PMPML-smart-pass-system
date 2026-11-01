import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app import model, schema, auth

def get_user_by_email(db: Session, email: str):
    return db.query(model.User).filter(model.User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(model.User).filter(model.User.id == user_id).first()

def create_user(db: Session, user: schema.UserCreate):
    hashed_password = auth.hash_password(user.password)
    db_user = model.User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role or "passenger",
        conductor_badge=user.conductor_badge
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_all_passes(db: Session):
    return db.query(model.Pass).all()

def get_pass_by_id(db: Session, pass_id: int):
    return db.query(model.Pass).filter(model.Pass.id == pass_id).first()

def create_booking(db: Session, booking: schema.BookingCreate, user_id: int):
    # Generate unique booking ID PMPL-XXXXXXXX
    unique_id = uuid.uuid4().hex[:8].upper()
    booking_id = f"PMPL-{unique_id}"
    
    # Calculate validity
    now = datetime.utcnow()
    bus_pass = get_pass_by_id(db, booking.pass_id)
    valid_until = now + timedelta(days=30)
    if bus_pass:
        val_str = bus_pass.validity.lower()
        if "1 day" in val_str:
            valid_until = now + timedelta(days=1)
        elif "7 day" in val_str:
            valid_until = now + timedelta(days=7)
        elif "30 day" in val_str:
            valid_until = now + timedelta(days=30)
    
    clean_aadhar = booking.aadhar_number.strip().replace(" ", "").replace("-", "")
    clean_pan = booking.pan_number.strip().upper()

    db_booking = model.Booking(
        booking_id=booking_id,
        user_id=user_id,
        pass_id=booking.pass_id,
        passenger_name=booking.passenger_name.strip(),
        age=booking.age,
        gender=booking.gender,
        phone=booking.phone.strip(),
        aadhar_number=clean_aadhar,
        pan_number=clean_pan,
        passenger_photo=booking.passenger_photo,
        source=booking.source.strip(),
        destination=booking.destination.strip(),
        booking_date=now,
        valid_until=valid_until,
        status="Booked"
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def get_user_bookings(db: Session, user_id: int):
    return (
        db.query(model.Booking)
        .filter(model.Booking.user_id == user_id)
        .order_by(model.Booking.booking_date.desc())
        .all()
    )

def get_user_booking_by_booking_id(db: Session, booking_id: str):
    return db.query(model.Booking).filter(model.Booking.booking_id == booking_id).first()

def cancel_booking(db: Session, booking: model.Booking):
    booking.status = "Cancelled"
    db.commit()
    db.refresh(booking)
    return booking

def find_booking_by_identifier(db: Session, identifier: str):
    """
    Finds a booking by booking_id, or by aadhar_number (supports raw or clean search).
    """
    raw = identifier.strip().upper()
    digits_only = "".join(filter(str.isdigit, raw))
    
    # 1. Direct or partial booking_id match
    booking = db.query(model.Booking).filter(
        or_(
            model.Booking.booking_id == raw,
            model.Booking.booking_id.ilike(f"%{raw}%")
        )
    ).first()
    if booking:
        return booking

    # 2. If digits present (e.g. 12-digit Aadhaar or 10-digit phone)
    if digits_only:
        booking = db.query(model.Booking).filter(
            or_(
                model.Booking.aadhar_number == digits_only,
                model.Booking.phone == digits_only
            )
        ).first()
        if booking:
            return booking

    # 3. Fallback: match clean alphanumeric
    clean_id = raw.replace(" ", "").replace("-", "")
    booking = db.query(model.Booking).filter(
        or_(
            model.Booking.booking_id.ilike(f"%{clean_id}%"),
            model.Booking.aadhar_number.ilike(f"%{clean_id}%")
        )
    ).first()

    return booking

def get_today_validation(db: Session, booking_id: str, date_str: str):
    return db.query(model.PassValidation).filter(
        model.PassValidation.booking_id == booking_id,
        model.PassValidation.validation_date == date_str
    ).first()

def approve_pass_for_today(db: Session, booking: model.Booking, conductor: model.User, bus_number: str = "PMPL Express Bus"):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    existing = get_today_validation(db, booking.booking_id, today_str)
    if existing:
        return existing
    
    validation = model.PassValidation(
        booking_id=booking.booking_id,
        conductor_id=conductor.id,
        conductor_name=conductor.name,
        validation_date=today_str,
        validated_at=datetime.utcnow(),
        bus_number=bus_number or "PMPL Express Bus",
        status="Approved"
    )
    db.add(validation)
    db.commit()
    db.refresh(validation)
    return validation

def get_conductor_validations_today(db: Session, conductor_id: int, date_str: str):
    return (
        db.query(model.PassValidation)
        .filter(
            model.PassValidation.conductor_id == conductor_id,
            model.PassValidation.validation_date == date_str
        )
        .order_by(model.PassValidation.validated_at.desc())
        .all()
    )
