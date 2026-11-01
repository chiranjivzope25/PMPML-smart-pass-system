"""
PMPL SmartPass - Public Cloudflare Tunnel Launcher
Launches backend, frontend, and a public Cloudflare tunnel in one single step.
"""
import subprocess
import sys
import os
import re
import time

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # Prefer virtual environment python
    venv_python = os.path.join(base_dir, ".venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = os.path.join(base_dir, ".venv", "bin", "python")
    python_exe = venv_python if os.path.exists(venv_python) else sys.executable

    print("\n" + "=" * 65)
    print("  🚀 STARTING PMPL SMARTPASS WITH PUBLIC CLOUDFLARE TUNNEL")
    print("=" * 65)

    env = os.environ.copy()
    env["RUNNING_VIA_RUN_PY"] = "1"

    # 1. Start Backend
    print("[1/3] Starting FastAPI backend on port 8000...")
    backend_proc = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=base_dir,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    # 2. Start Frontend
    print("[2/3] Starting Vite frontend on port 5173...")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=os.path.join(base_dir, "frontend"),
        shell=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    time.sleep(3)

    # 3. Start Cloudflare Tunnel
    print("[3/3] Creating public Cloudflare tunnel (no sign-up required)...")
    cloudflared_proc = subprocess.Popen(
        ["npx", "-y", "cloudflared", "tunnel", "--url", "http://localhost:5173"],
        cwd=base_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    tunnel_url = None
    url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")

    for line in cloudflared_proc.stdout:
        match = url_pattern.search(line)
        if match:
            tunnel_url = match.group(0)
            break

    if tunnel_url:
        print("\n" + "*" * 65)
        print("  🎉 PUBLIC TUNNEL READY! SHARE THIS LINK WITH ANYONE:")
        print(f"  👉 {tunnel_url}")
        print("*" * 65)
        print("\n  ➜ Local PC:      http://localhost:5173")
        print("  ➜ Press Ctrl+C anytime to stop sharing.")
        print("=" * 65 + "\n")
    else:
        print("\n[INFO] Tunnel started. Look for the trycloudflare.com URL above.\n")

    try:
        cloudflared_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down tunnel and servers...")
        try:
            cloudflared_proc.terminate()
            frontend_proc.terminate()
            backend_proc.terminate()
        except Exception:
            pass
        print("All servers stopped.")

if __name__ == "__main__":
    main()
