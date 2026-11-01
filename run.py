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

    env = os.environ.copy()
    env["RUNNING_VIA_RUN_PY"] = "1"

    # Start FastAPI backend
    backend_process = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
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
