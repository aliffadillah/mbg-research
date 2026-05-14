"""
Test PERSIS seperti Code tab Ultralytics Platform.
"""
import requests
import os
import io
from dotenv import load_dotenv
from PIL import Image

# Load .env global
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"), override=True)

# Deployment URL and API key — persis dari Code tab
url = "https://predict-6a04246ee8cd77cae9a7-dproatj77a-et.a.run.app/predict"
api_key = os.getenv("API_KEY_ULTRALYTICS", "").strip().strip("\"'")

print(f"URL    : {url}")
print(f"API Key: {api_key}")
print(f"Key len: {len(api_key)}")
print()

# Buat gambar test
img = Image.new("RGB", (100, 100), color=(200, 100, 50))
buf = io.BytesIO()
img.save(buf, format="JPEG")
buf.seek(0)

# Optional inference parameters (conf, iou, imgsz) — persis dari Code tab
args = {"conf": 0.25, "iou": 0.7, "imgsz": 640}

print("Mengirim request ke Ultralytics...")
response = requests.post(
    url,
    headers={"Authorization": f"Bearer {api_key}"},
    data=args,
    files={"file": buf},
)

print(f"Status : {response.status_code}")
print(f"Response: {response.text[:1000]}")
