from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=1)
    role: Optional[str] = "passenger"  # "passenger" or "conductor"
    conductor_badge: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str = "passenger"
    conductor_badge: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str = "passenger"
    name: str
    email: str
    conductor_badge: Optional[str] = None

class PassResponse(BaseModel):
    id: int
    pass_name: str
    pass_type: str
    price: float
    validity: str

    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    pass_id: int = Field(..., gt=0)
    passenger_name: str = Field(..., min_length=1)
    age: int = Field(..., gt=0, le=120)
    gender: str = Field(..., min_length=1)
    phone: str = Field(..., pattern=r"^\d{10}$")
    aadhar_number: str = Field(..., min_length=10, max_length=16)
    pan_number: str = Field(..., min_length=8, max_length=12)
    passenger_photo: Optional[str] = None
    source: str = Field(..., min_length=1)
    destination: str = Field(..., min_length=1)

class ValidationResponse(BaseModel):
    id: int
    booking_id: str
    conductor_id: int
    conductor_name: str
    validation_date: str
    validated_at: datetime
    bus_number: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

class BookingResponse(BaseModel):
    id: int
    booking_id: str
    passenger_name: str
    age: int
    gender: str
    phone: str
    aadhar_number: str
    pan_number: str
    passenger_photo: Optional[str] = None
    source: str
    destination: str
    status: str
    booking_date: datetime
    valid_until: Optional[datetime] = None
    pass_id: Optional[int] = None
    bus_pass: Optional[PassResponse] = None
    validations: Optional[List[ValidationResponse]] = []

    class Config:
        from_attributes = True

class BookingCancelResponse(BaseModel):
    message: str
    booking_id: str
    status: str

class PassVerifyResponse(BaseModel):
    valid: bool
    status_message: str
    is_today_approved: bool
    today_validation: Optional[ValidationResponse] = None
    booking: BookingResponse

class PassApproveRequest(BaseModel):
    booking_id: str
    bus_number: Optional[str] = "PMPL Express Bus"
    notes: Optional[str] = None

class PassApproveResponse(BaseModel):
    message: str
    booking_id: str
    passenger_name: str
    aadhar_number: str
    validation_date: str
    status: str
    validated_at: datetime
    conductor_name: str