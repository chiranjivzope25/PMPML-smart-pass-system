"""
SQLite to Cloud PostgreSQL Migration Utility for PMPL Bus Pass System.

Usage:
    python migrate_sqlite_to_cloud.py "postgresql://user:password@host/dbname?sslmode=require"
Or:
    set TARGET_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
    python migrate_sqlite_to_cloud.py
"""

import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure project root is in sys.path
root_dir = os.path.dirname(os.path.abspath(__file__))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app import model

def migrate():
    # 1. Resolve Target Cloud Database URL
    target_url = None
    if len(sys.argv) > 1 and sys.argv[1].strip():
        target_url = sys.argv[1].strip()
    else:
        target_url = os.getenv("TARGET_DATABASE_URL") or os.getenv("POSTGRES_URL")

    if not target_url:
        print("\n[ERROR] No target PostgreSQL database URL provided.")
        print("Please provide your cloud database URL as an argument, for example:")
        print("  python migrate_sqlite_to_cloud.py \"postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require\"")
        print("\nOr set TARGET_DATABASE_URL environment variable.")
        sys.exit(1)

    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql://", 1)

    # 2. Source SQLite DB
    sqlite_path = os.path.join(root_dir, "pmpl.db")
    if not os.path.exists(sqlite_path):
        print(f"[ERROR] Local SQLite database not found at {sqlite_path}")
        sys.exit(1)

    sqlite_url = f"sqlite:///{sqlite_path}"
    print(f"Connecting to source SQLite DB: {sqlite_path}")
    source_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    SourceSession = sessionmaker(bind=source_engine)
    source_db = SourceSession()

    print(f"Connecting to target Cloud Postgres DB...")
    target_engine = create_engine(target_url, pool_pre_ping=True)
    TargetSession = sessionmaker(bind=target_engine)
    target_db = TargetSession()

    # 3. Create tables in target if not present
    print("Ensuring target database tables exist...")
    model.Base.metadata.create_all(bind=target_engine)

    # 4. Migrate Users
    users = source_db.query(model.User).all()
    user_id_map = {}
    users_migrated = 0
    for u in users:
        existing = target_db.query(model.User).filter(model.User.email == u.email).first()
        if not existing:
            new_u = model.User(
                name=u.name,
                email=u.email,
                password=u.password,
                role=u.role,
                conductor_badge=u.conductor_badge
            )
            target_db.add(new_u)
            target_db.flush()
            user_id_map[u.id] = new_u.id
            users_migrated += 1
        else:
            user_id_map[u.id] = existing.id

    # 5. Migrate Passes
    passes = source_db.query(model.Pass).all()
    pass_id_map = {}
    passes_migrated = 0
    for p in passes:
        existing = target_db.query(model.Pass).filter(model.Pass.pass_name == p.pass_name).first()
        if not existing:
            new_p = model.Pass(
                pass_name=p.pass_name,
                pass_type=p.pass_type,
                price=p.price,
                validity=p.validity
            )
            target_db.add(new_p)
            target_db.flush()
            pass_id_map[p.id] = new_p.id
            passes_migrated += 1
        else:
            pass_id_map[p.id] = existing.id

    # 6. Migrate Bookings
    bookings = source_db.query(model.Booking).all()
    bookings_migrated = 0
    for b in bookings:
        existing = target_db.query(model.Booking).filter(model.Booking.booking_id == b.booking_id).first()
        if not existing:
            target_user_id = user_id_map.get(b.user_id)
            target_pass_id = pass_id_map.get(b.pass_id)
            if not target_user_id or not target_pass_id:
                continue
            new_b = model.Booking(
                booking_id=b.booking_id,
                user_id=target_user_id,
                pass_id=target_pass_id,
                passenger_name=b.passenger_name,
                age=b.age,
                gender=b.gender,
                phone=b.phone,
                aadhar_number=b.aadhar_number,
                pan_number=b.pan_number,
                passenger_photo=b.passenger_photo,
                source=b.source,
                destination=b.destination,
                booking_date=b.booking_date,
                valid_until=b.valid_until,
                status=b.status
            )
            target_db.add(new_b)
            bookings_migrated += 1

    target_db.flush()

    # 7. Migrate Pass Validations
    validations = source_db.query(model.PassValidation).all()
    validations_migrated = 0
    for v in validations:
        target_cond_id = user_id_map.get(v.conductor_id)
        if not target_cond_id:
            continue
        new_v = model.PassValidation(
            booking_id=v.booking_id,
            conductor_id=target_cond_id,
            conductor_name=v.conductor_name,
            validation_date=v.validation_date,
            validated_at=v.validated_at,
            bus_number=v.bus_number,
            status=v.status
        )
        target_db.add(new_v)
        validations_migrated += 1

    target_db.commit()
    source_db.close()
    target_db.close()

    print("\n--- MIGRATION COMPLETED SUCCESSFULLY ---")
    print(f"Users migrated: {users_migrated}")
    print(f"Passes migrated: {passes_migrated}")
    print(f"Bookings migrated: {bookings_migrated}")
    print(f"Validation logs migrated: {validations_migrated}")
    print("----------------------------------------\n")

if __name__ == "__main__":
    migrate()
