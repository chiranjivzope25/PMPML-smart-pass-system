import sqlite3
import os
from app.database import is_sqlite

def run_migrations():
    if not is_sqlite:
        return
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "pmpl.db")
    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Check if users table exists
    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    
    if "users" in tables:
        cols = [r[1] for r in cur.execute("PRAGMA table_info(users)").fetchall()]
        if "role" not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'passenger'")
            print("Added 'role' to users table.")
        if "conductor_badge" not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN conductor_badge VARCHAR DEFAULT NULL")
            print("Added 'conductor_badge' to users table.")

    if "bookings" in tables:
        b_cols = [r[1] for r in cur.execute("PRAGMA table_info(bookings)").fetchall()]
        if "aadhar_number" not in b_cols:
            cur.execute("ALTER TABLE bookings ADD COLUMN aadhar_number VARCHAR DEFAULT 'XXXX-XXXX-XXXX'")
            print("Added 'aadhar_number' to bookings table.")
        if "pan_number" not in b_cols:
            cur.execute("ALTER TABLE bookings ADD COLUMN pan_number VARCHAR DEFAULT 'ABCDE1234F'")
            print("Added 'pan_number' to bookings table.")
        if "valid_until" not in b_cols:
            cur.execute("ALTER TABLE bookings ADD COLUMN valid_until TIMESTAMP DEFAULT NULL")
            print("Added 'valid_until' to bookings table.")
        if "passenger_photo" not in b_cols:
            cur.execute("ALTER TABLE bookings ADD COLUMN passenger_photo TEXT DEFAULT NULL")
            print("Added 'passenger_photo' to bookings table.")

    conn.commit()
    conn.close()
    print("Database migration check completed successfully.")

if __name__ == "__main__":
    run_migrations()
