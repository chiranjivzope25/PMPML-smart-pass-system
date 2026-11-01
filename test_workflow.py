import os
import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_workflow():
    print("--- 1. Testing Passenger Registration & Login ---")
    passenger_email = f"passenger_test_{os.urandom(3).hex()}@example.com"
    r = client.post("/register", json={
        "name": "Chiranjiv Zope",
        "email": passenger_email,
        "password": "Password123",
        "role": "passenger"
    })
    assert r.status_code == 200, f"Passenger register failed: {r.text}"
    print("Passenger registered successfully.")

    r = client.post("/login", data={
        "username": passenger_email,
        "password": "Password123"
    })
    assert r.status_code == 200, f"Passenger login failed: {r.text}"
    pass_data = r.json()
    passenger_token = pass_data["access_token"]
    assert pass_data["role"] == "passenger"
    print("Passenger login successful. Token acquired.")

    print("\n--- 2. Testing Conductor Registration & Login ---")
    conductor_email = f"conductor_test_{os.urandom(3).hex()}@pmpl.org"
    r = client.post("/conductor/register", json={
        "name": "Ramesh Conductor",
        "email": conductor_email,
        "password": "Password123",
        "role": "conductor",
        "conductor_badge": "PMPL-C555"
    })
    assert r.status_code == 200, f"Conductor register failed: {r.text}"
    print("Conductor registered successfully.")

    r = client.post("/conductor/login", data={
        "username": conductor_email,
        "password": "Password123"
    })
    assert r.status_code == 200, f"Conductor login failed: {r.text}"
    cond_data = r.json()
    conductor_token = cond_data["access_token"]
    assert cond_data["role"] == "conductor"
    print(f"Conductor login successful. Badge: {cond_data['conductor_badge']}")

    print("\n--- 3. Testing Passes List & Booking with Aadhaar and PAN ---")
    pass_headers = {"Authorization": f"Bearer {passenger_token}"}
    r = client.get("/passes", headers=pass_headers)
    assert r.status_code == 200
    passes = r.json()
    assert len(passes) > 0
    selected_pass = passes[0]
    print(f"Selected Pass: {selected_pass['pass_name']} (ID: {selected_pass['id']})")

    # Book pass with Aadhaar, PAN & Passenger Photo
    booking_payload = {
        "pass_id": selected_pass["id"],
        "passenger_name": "Chiranjiv Zope",
        "age": 24,
        "gender": "Male",
        "phone": "9876543210",
        "aadhar_number": "541289012345",
        "pan_number": "ABCDE1234F",
        "passenger_photo": "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "source": "Swargate",
        "destination": "Pune Station"
    }
    r = client.post("/book-pass", json=booking_payload, headers=pass_headers)
    assert r.status_code == 200, f"Booking pass failed: {r.text}"
    booking = r.json()
    booking_id = booking["booking_id"]
    print(f"Pass booked! Booking ID: {booking_id}")
    print(f"Aadhaar stored on Pass: {booking['aadhar_number']}")
    print(f"PAN stored on Pass: {booking['pan_number']}")
    print(f"Photo attached to Pass: {bool(booking['passenger_photo'])}")
    assert booking["aadhar_number"] == "541289012345"
    assert booking["pan_number"] == "ABCDE1234F"
    assert booking["passenger_photo"] is not None

    print("\n--- 4. Conductor Scans/Verifies Pass via QR ID or Aadhaar ---")
    cond_headers = {"Authorization": f"Bearer {conductor_token}"}
    
    # Verification using Booking ID
    r = client.get(f"/conductor/verify/{booking_id}", headers=cond_headers)
    assert r.status_code == 200, f"Verification failed: {r.text}"
    verify_data = r.json()
    assert verify_data["valid"] is True
    assert verify_data["is_today_approved"] is False
    assert verify_data["booking"]["aadhar_number"] == "541289012345"
    print("Pass verified by booking ID: Active, not yet approved today.")

    # Verification using Aadhaar Number
    r = client.get("/conductor/verify/541289012345", headers=cond_headers)
    assert r.status_code == 200
    print("Pass verified by Aadhaar Number successfully!")

    print("\n--- 5. Conductor Approves Pass for Today ---")
    r = client.post("/conductor/approve-today", json={
        "booking_id": booking_id,
        "bus_number": "Bus #42 - Swargate Special",
        "notes": "Verified Aadhaar Card"
    }, headers=cond_headers)
    assert r.status_code == 200, f"Approval failed: {r.text}"
    approve_data = r.json()
    print(f"Approval Success: {approve_data['message']}")
    print(f"Approved on Date: {approve_data['validation_date']} by {approve_data['conductor_name']}")

    print("\n--- 6. Re-Verification Confirms 'Already Approved Today' ---")
    r = client.get(f"/conductor/verify/{booking_id}", headers=cond_headers)
    assert r.status_code == 200
    reverify_data = r.json()
    assert reverify_data["is_today_approved"] is True
    print(f"Re-verification confirmed: {reverify_data['status_message']}")

    print("\n--- 7. Checking Today's Validations for Conductor ---")
    r = client.get("/conductor/today-validations", headers=cond_headers)
    assert r.status_code == 200
    today_validations = r.json()
    assert len(today_validations) > 0
    print(f"Today's validation logs count: {len(today_validations)}")
    print(f"Latest log booking ID: {today_validations[0]['booking_id']}, Bus: {today_validations[0]['bus_number']}")

    print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_full_workflow()
