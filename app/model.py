from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="passenger")  # "passenger" or "conductor"
    conductor_badge = Column(String, nullable=True)  # e.g., "PMPL-C102"

    bookings = relationship("Booking", back_populates="user")
    validations = relationship("PassValidation", back_populates="conductor")

class Pass(Base):
    __tablename__ = "passes"
    id = Column(Integer, primary_key=True, index=True)
    pass_name = Column(String, nullable=False)
    pass_type = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    validity = Column(String, nullable=False)

    bookings = relationship("Booking", back_populates="bus_pass")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    booking_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pass_id = Column(Integer, ForeignKey("passes.id"), nullable=False)
    passenger_name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    aadhar_number = Column(String, nullable=False)
    pan_number = Column(String, nullable=False)
    passenger_photo = Column(String, nullable=True)  # Base64 image data URL or image path
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    booking_date = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime, nullable=True)
    status = Column(String, default="Booked")

    user = relationship("User", back_populates="bookings")
    bus_pass = relationship("Pass", back_populates="bookings")
    validations = relationship("PassValidation", back_populates="booking", order_by="desc(PassValidation.validated_at)")

class PassValidation(Base):
    __tablename__ = "pass_validations"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String, ForeignKey("bookings.booking_id"), nullable=False, index=True)
    conductor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conductor_name = Column(String, nullable=False)
    validation_date = Column(String, nullable=False, index=True)  # e.g. "2026-10-14"
    validated_at = Column(DateTime, default=datetime.utcnow)
    bus_number = Column(String, nullable=True, default="PMPL City Bus")
    status = Column(String, default="Approved")  # "Approved", "Flagged"

    booking = relationship("Booking", back_populates="validations")
    conductor = relationship("User", back_populates="validations")