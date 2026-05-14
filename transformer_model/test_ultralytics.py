"""
Script test untuk debug koneksi Ultralytics API.
Mengirim gambar dummy ke API dan mencetak response detail.
"""
import os
import sys
import io
import requests
from dotenv import load_dotenv

# Load .env global
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
load_dotenv(os.path.join(ROOT_DIR, ".env"), override=True)

# Baca variable
api_url_raw = os.getenv("API_MENU", "")
api_key_raw = os.getenv("API_KEY_ULTRALYTICS", "")

# Bersihkan
api_url = api_url_raw.strip().strip("\"'").rstrip("/")
api_key = api_key_raw.strip().strip("\"'")

print("=" * 60)
print("DEBUG: Ultralytics API Connection Test")
print("=" * 60)
print(f"  API_MENU (raw)           : [{api_url_raw}]")
print(f"  API_KEY_ULTRALYTICS (raw): [{api_key_raw}]")
print(f"  API_MENU (cleaned)       : [{api_url}]")
print(f"  API_KEY (cleaned)        : [{api_key}]")
print(f"  API_KEY length           : {len(api_key)}")
print(f"  API_KEY starts with ul_  : {api_key.startswith('ul_')}")
print()

# Buat gambar dummy 1x1 pixel PNG
try:
    from PIL import Image
    img = Image.new("RGB", (100, 100), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    image_bytes = buf.read()
    print(f"  Test image size          : {len(image_bytes)} bytes")
except ImportError:
    print("  PIL not available, using raw bytes")
    image_bytes = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100

# ── Test 1: Authorization: Bearer (sesuai docs)
print()
print("-" * 60)
print("TEST 1: Authorization: Bearer <key>")
print(f"  URL: {api_url}/predict")
try:
    resp = requests.post(
        f"{api_url}/predict",
        headers={"Authorization": f"Bearer {api_key}"},
        files={"file": ("test.png", io.BytesIO(image_bytes), "image/png")},
        data={"conf": "0.25", "iou": "0.7", "imgsz": "640"},
        timeout=30,
    )
    print(f"  Status: {resp.status_code}")
    print(f"  Response: {resp.text[:500]}")
except Exception as e:
    print(f"  ERROR: {e}")

# ── Test 2: x-api-key header (legacy)
print()
print("-" * 60)
print("TEST 2: x-api-key: <key>")
print(f"  URL: {api_url}/predict")
try:
    resp = requests.post(
        f"{api_url}/predict",
        headers={"x-api-key": api_key},
        files={"file": ("test.png", io.BytesIO(image_bytes), "image/png")},
        data={"conf": "0.25", "iou": "0.7", "imgsz": "640"},
        timeout=30,
    )
    print(f"  Status: {resp.status_code}")
    print(f"  Response: {resp.text[:500]}")
except Exception as e:
    print(f"  ERROR: {e}")

# ── Test 3: Tanpa /predict path
print()
print("-" * 60)
print("TEST 3: Authorization: Bearer <key> TANPA /predict")
print(f"  URL: {api_url}")
try:
    resp = requests.post(
        api_url,
        headers={"Authorization": f"Bearer {api_key}"},
        files={"file": ("test.png", io.BytesIO(image_bytes), "image/png")},
        data={"conf": "0.25", "iou": "0.7", "imgsz": "640"},
        timeout=30,
    )
    print(f"  Status: {resp.status_code}")
    print(f"  Response: {resp.text[:500]}")
except Exception as e:
    print(f"  ERROR: {e}")

# ── Test 4: x-api-key TANPA /predict
print()
print("-" * 60)
print("TEST 4: x-api-key: <key> TANPA /predict")
print(f"  URL: {api_url}")
try:
    resp = requests.post(
        api_url,
        headers={"x-api-key": api_key},
        files={"file": ("test.png", io.BytesIO(image_bytes), "image/png")},
        data={"conf": "0.25", "iou": "0.7", "imgsz": "640"},
        timeout=30,
    )
    print(f"  Status: {resp.status_code}")
    print(f"  Response: {resp.text[:500]}")
except Exception as e:
    print(f"  ERROR: {e}")

print()
print("=" * 60)
print("Test selesai. Periksa mana yang status 200.")
print("=" * 60)
