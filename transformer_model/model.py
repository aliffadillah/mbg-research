import os
from typing import Any, Optional

from dotenv import load_dotenv
from flask import Flask, jsonify, request

from nutrition_estimator import (
	estimate_from_file,
	get_api_config,
	get_supabase_config,
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
load_dotenv(os.path.join(ROOT_DIR, "backend", ".env"), override=False)
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = os.getenv("JSON_PRETTY", "1") == "1"


@app.after_request
def add_cors_headers(response: Any) -> Any:
	origin = os.getenv("CORS_ORIGIN", "*")
	response.headers["Access-Control-Allow-Origin"] = origin
	response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
	response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
	return response


def parse_bool(value: Any) -> Optional[bool]:
	if value is None:
		return None
	key = str(value).strip().lower()
	if key in ("1", "true", "yes", "y", "on"):
		return True
	if key in ("0", "false", "no", "n", "off"):
		return False
	return None


@app.route("/health", methods=["GET", "OPTIONS"])
def health() -> Any:
	if request.method == "OPTIONS":
		return "", 204
	return jsonify({"status": "ok"})


@app.route("/estimate", methods=["POST", "OPTIONS"])
def estimate() -> Any:
	if request.method == "OPTIONS":
		return "", 204
	api_url, api_key = get_api_config()
	if not api_url or not api_key:
		return jsonify({"error": "Konfigurasi API Ultralytics belum lengkap"}), 500

	supabase_url, supabase_key = get_supabase_config()
	if not supabase_url or not supabase_key:
		return jsonify({"error": "Konfigurasi Supabase belum lengkap"}), 500

	file = request.files.get("file") or request.files.get("image")
	if file is None or file.filename == "":
		return jsonify({"error": "File tidak ditemukan. Gunakan field 'file' atau 'image'."}), 400
	file_bytes = None
	try:
		file_bytes = file.read()
	except Exception:
		file_bytes = None
	if not file_bytes:
		return jsonify({"error": "File tidak dapat dibaca."}), 400

	doneness_label = request.form.get("doneness") or request.form.get("doneness_label")
	doneness_score_raw = request.form.get("doneness_score")
	doneness_per_class = parse_bool(request.form.get("doneness_per_class"))
	doneness_from_image = parse_bool(request.form.get("doneness_from_image"))
	if doneness_score_raw is not None and doneness_score_raw != "":
		try:
			doneness_score = float(doneness_score_raw)
		except Exception:
			doneness_score = None
	else:
		doneness_score = None

	if request.is_json:
		payload = request.get_json(silent=True) or {}
		doneness_label = (
			doneness_label
			or payload.get("doneness")
			or payload.get("doneness_label")
		)
		if doneness_score is None and payload.get("doneness_score") is not None:
			try:
				doneness_score = float(payload.get("doneness_score"))
			except Exception:
				doneness_score = None
		if doneness_per_class is None and payload.get("doneness_per_class") is not None:
			doneness_per_class = parse_bool(payload.get("doneness_per_class"))
		if doneness_from_image is None and payload.get("doneness_from_image") is not None:
			doneness_from_image = parse_bool(payload.get("doneness_from_image"))

	conf = os.getenv("ULTRALYTICS_CONF", "0.25")
	iou = os.getenv("ULTRALYTICS_IOU", "0.7")
	imgsz = os.getenv("ULTRALYTICS_IMGSZ", "640")
	timeout_s = int(os.getenv("ULTRALYTICS_TIMEOUT", "60"))
	total_food_grams = float(os.getenv("TOTAL_FOOD_GRAMS", "500"))

	response_body, status_code = estimate_from_file(
		file=file,
		api_url=api_url,
		api_key=api_key,
		supabase_url=supabase_url,
		supabase_key=supabase_key,
		conf=conf,
		iou=iou,
		imgsz=imgsz,
		timeout_s=timeout_s,
		total_food_grams=total_food_grams,
		file_bytes_override=file_bytes,
		doneness_label=doneness_label,
		doneness_score=doneness_score,
		doneness_per_class=doneness_per_class,
		doneness_from_image=doneness_from_image,
	)
	return jsonify(response_body), status_code



if __name__ == "__main__":
	port = int(os.getenv("TRANSFORMER_PORT", "3002"))
	debug = os.getenv("FLASK_DEBUG", "0") == "1"
	app.run(host="0.0.0.0", port=port, debug=debug)
