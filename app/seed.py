from sqlalchemy.orm import Session
from app import model

def seed_passes(db: Session):
    passes_data = [
        {"pass_name": "Daily Pass", "pass_type": "Daily", "price": 50, "validity": "1 Day"},
        {"pass_name": "Weekly Pass", "pass_type": "Weekly", "price": 250, "validity": "7 Days"},
        {"pass_name": "Monthly Pass", "pass_type": "Monthly", "price": 800, "validity": "30 Days"},
        {"pass_name": "Student Monthly Pass", "pass_type": "Student", "price": 400, "validity": "30 Days"}
    ]

    for p in passes_data:
        existing_pass = db.query(model.Pass).filter(model.Pass.pass_name == p["pass_name"]).first()
        if not existing_pass:
            new_pass = model.Pass(**p)
            db.add(new_pass)
    
    db.commit()