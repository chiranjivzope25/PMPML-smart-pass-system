import subprocess
import sys
import os

def main():
    print("Starting PMPL Bus Pass Backend and Frontend...")
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # Prefer virtual environment python if available
    venv_python = os.path.join(base_dir, ".venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = os.path.join(base_dir, ".venv", "bin", "python")
    
    python_exe = venv_python if os.path.exists(venv_python) else sys.executable
    print(f"Using Python: {python_exe}")

    # Discover local Wi-Fi / LAN IP
    local_ip = "127.0.0.1"
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    print("\n" + "=" * 58)
    print("  🚌 PMPL SMARTPASS SYSTEM READY FOR LOCAL & NETWORK USE")
    print(f"  ➜ On this PC:     http://localhost:5173")
    print(f"  ➜ On Mobile/Wi-Fi: http://{local_ip}:5173")
    print(f"  ➜ Swagger API:    http://localhost:8000/docs")
    print("=" * 58 + "\n")

    env = os.environ.copy()
    env["RUNNING_VIA_RUN_PY"] = "1"

    # Start FastAPI backend binding to 0.0.0.0
    backend_process = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        cwd=base_dir,
        env=env
    )
    
    # Start Vite frontend
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=os.path.join(base_dir, "frontend"),
        shell=True  # Required on Windows to resolve npm
    )

    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("Shutdown complete.")

if __name__ == "__main__":
    main()
