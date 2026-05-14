import base64
import io
import json
import os
import time
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import numpy as np
import requests

try:
	from PIL import Image, ImageDraw, ImageFont, ImageOps
except Exception:
	Image = None
	ImageDraw = None
	ImageFont = None
	ImageOps = None

try:
	import cv2
except Exception:
	cv2 = None

from fuzzy import compute_doneness_score_from_rgb, infer_doneness, infer_doneness_from_score


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

ALIASES: Dict[str, str] = {
	"rice": "nasi",
	"fried rice": "nasi goreng",
	"fried_rice": "nasi goreng",
	"fried chicken": "ayam goreng",
	"grilled chicken": "ayam bakar",
	"egg": "telur",
	"tofu": "tahu",
	"tempeh": "tempe",
	"noodle": "mie",
	"meatball": "bakso",
	"fish": "ikan",
	"vegetable": "sayur",
	"potato": "kentang",
	"bread": "roti",
	"banana": "pisang",
	"apple": "apel",
}

TYPO_FIXES: Dict[str, str] = {
	"koll": "kol",
}

DESCRIPTOR_WORDS = {
	"crispy",
	"krispi",
	"semur",
	"tumis",
	"goreng",
	"bakar",
	"rebus",
	"panggang",
	"balado",
	"kuah",
	"sambal",
}

COOKED_STAPLES = {
	"nasi",
	"telur",
	"tahu",
	"tempe",
	"ayam",
	"ikan",
	"daging",
	"mie",
	"bakso",
}

RAW_FOODS = {
	"buah",
	"fruit",
	"salad",
	"pisang",
	"apel",
	"jeruk",
	"mangga",
	"anggur",
	"semangka",
	"melon",
	"pepaya",
	"nanas",
	"stroberi",
	"jambu",
	"salak",
	"kelengkeng",
	"leci",
	"rambutan",
	"sirsak",
}

LOW_BROWN_HINTS = {
	"rebus",
	"kukus",
	"kuah",
	"sop",
	"soto",
	"sayur",
	"tumis",
	"semur",
}

HIGH_BROWN_HINTS = {
	"goreng",
	"bakar",
	"panggang",
	"crispy",
	"krispi",
	"grill",
	"roast",
}


def load_canonical_menu_names() -> Dict[str, str]:
	path = os.path.join(ROOT_DIR, "frontend", "data_gizi", "components.json")
	try:
		with open(path, "r", encoding="utf-8") as handle:
			data = json.load(handle)
	except Exception:
		return {}

	names: List[str] = []
	if isinstance(data, dict):
		names = [key for key in data.keys() if isinstance(key, str)]
	elif isinstance(data, list):
		for item in data:
			if isinstance(item, str):
				names.append(item)
			elif isinstance(item, dict) and "name" in item and isinstance(item["name"], str):
				names.append(item["name"])

	mapping: Dict[str, str] = {}
	for name in names:
		key = normalize_label(name)
		if key and key not in mapping:
			mapping[key] = name
	return mapping


NUTRITION_CACHE: Dict[str, Optional[Dict[str, float]]] = {}


def get_api_config() -> Tuple[Optional[str], Optional[str]]:
	api_url = (
		os.getenv("API_MENU")
		or os.getenv("ULTRALYTICS_API_URL")
		or os.getenv("ULTRALYTICS_API")
	)
	api_key = (
		os.getenv("API_KEY_ULTRALYTICS")
		or os.getenv("ULTRALYTICS_API_PRIMARY")
		or os.getenv("API_MAIN_KEY")
		or os.getenv("ULTRALYTICS_API_KEY")
	)
	
	if api_url:
		api_url = api_url.strip().strip("\"'")
		if not api_url.rstrip("/").endswith("/predict"):
			api_url = api_url.rstrip("/") + "/predict"
	if api_key:
		api_key = api_key.strip().strip("\"'")
	return api_url, api_key


def build_supabase_base_url(raw_url: str) -> str:
	base = raw_url.strip()
	if not base.startswith("http://") and not base.startswith("https://"):
		base = f"https://{base}"
	base = base.rstrip("/")
	try:
		parsed = urlparse(base)
		host = parsed.netloc
		if host.startswith("db."):
			host = host[3:]
			base = f"{parsed.scheme}://{host}"
	except Exception:
		return base
	return base


def get_supabase_config() -> Tuple[Optional[str], Optional[str]]:
	url = os.getenv("SUPABASE_URL") or os.getenv("SUPABASE_REST_URL")
	key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
	if url:
		url = build_supabase_base_url(url)
	return url, key


def normalize_label(label: str) -> str:
	key = label.strip().lower().replace("_", " ").replace("-", " ")
	words = [TYPO_FIXES.get(word, word) for word in key.split()]
	return " ".join(words)


def get_label_bias(label: str) -> float:
	if os.getenv("DONENESS_LABEL_BIAS", "1") != "1":
		return 0.0
	words = normalize_label(label).split()
	bias_hint = float(os.getenv("DONENESS_LABEL_BIAS_HINT", "0.2"))
	bias_staple = float(os.getenv("DONENESS_LABEL_BIAS_STAPLE", "0.15"))
	if any(word in DESCRIPTOR_WORDS for word in words):
		return bias_hint
	if any(word in COOKED_STAPLES for word in words):
		return bias_staple
	return 0.0


def get_env_float(env_key: str, default: float) -> float:
	value = os.getenv(env_key)
	if value is None or value == "":
		return default
	try:
		return float(value)
	except Exception:
		return default


def get_env_json_map(env_key: str) -> Dict[str, float]:
	raw = os.getenv(env_key)
	if not raw:
		return {}
	try:
		data = json.loads(raw)
	except Exception:
		return {}
	if not isinstance(data, dict):
		return {}
	mapping: Dict[str, float] = {}
	for key, value in data.items():
		if not isinstance(key, str):
			continue
		try:
			mapping[normalize_label(key)] = float(value)
		except Exception:
			continue
	return mapping


def get_label_value(label: str, mapping: Dict[str, float], default: float) -> float:
	if not mapping:
		return default
	key = normalize_label(label)
	return mapping.get(key, default)


def get_doneness_profile(label: str) -> str:
	words = normalize_label(label).split()
	if any(word in RAW_FOODS for word in words):
		return "raw_ok"
	if any(word in HIGH_BROWN_HINTS for word in words):
		return "high_brown"
	if any(word in LOW_BROWN_HINTS for word in words):
		return "light_cooked"
	if any(word in COOKED_STAPLES for word in words):
		return "light_cooked"
	return "default"


def adjust_score_for_profile(score: float, profile: str) -> float:
	try:
		value = float(score)
	except Exception:
		return 0.0
	if value < 0.0:
		value = 0.0
	if value > 1.0:
		value = 1.0

	if profile == "raw_ok":
		raw_max = get_env_float("DONENESS_RAW_MAX_SCORE", 0.35)
		return min(value, raw_max)
	if profile == "light_cooked" and value < 0.45:
		bias = get_env_float("DONENESS_LIGHT_COOKED_BIAS", 0.08)
		return min(1.0, value + bias)
	if profile == "high_brown" and value < 0.55:
		bias = get_env_float("DONENESS_HIGH_BROWN_BIAS", 0.04)
		return min(1.0, value + bias)
	return value


CANONICAL_NAME_MAP = load_canonical_menu_names()


def log_nutrition(message: str) -> None:
	if os.getenv("NUTRITION_DEBUG", "0") == "1":
		print(message)


def round_value(value: float, digits: int = 2) -> float:
	rounded = round(float(value), digits)
	if abs(rounded) < 1e-12:
		return 0.0
	return rounded


def get_max_candidates() -> int:
	return int(os.getenv("NUTRITION_CANDIDATE_LIMIT", "8"))


def request_nutrition(
	base_url: str,
	api_key: str,
	name: str,
) -> Optional[Dict[str, float]]:
	cache_key = normalize_label(name)
	if cache_key in NUTRITION_CACHE:
		return NUTRITION_CACHE[cache_key]

	headers = {
		"apikey": api_key,
		"Authorization": f"Bearer {api_key}",
		"Accept": "application/json",
	}

	endpoint = f"{base_url}/rest/v1/nutritions"
	select_fields = "name,calories,protein,fat,carbs"

	try:
		r_exact = requests.get(
			endpoint,
			headers=headers,
			params={"select": select_fields, "name": f"eq.{name}", "limit": "1"},
			timeout=10,
		)
		if r_exact.ok:
			data = r_exact.json()
			if isinstance(data, list) and data:
				row = data[0]
				NUTRITION_CACHE[cache_key] = row
				return row
			log_nutrition(f"[nutrition] exact no match: {name}")
		else:
			log_nutrition(f"[nutrition] exact query failed: {r_exact.status_code} {r_exact.text[:200]}")

		r_ilike = requests.get(
			endpoint,
			headers=headers,
			params={"select": select_fields, "name": f"ilike.*{name}*", "limit": "1"},
			timeout=10,
		)
		if r_ilike.ok:
			data = r_ilike.json()
			if isinstance(data, list) and data:
				row = data[0]
				NUTRITION_CACHE[cache_key] = row
				return row
			log_nutrition(f"[nutrition] ilike no match: {name}")
		else:
			log_nutrition(f"[nutrition] ilike query failed: {r_ilike.status_code} {r_ilike.text[:200]}")
	except Exception:
		log_nutrition(f"[nutrition] query error for {name}")
		NUTRITION_CACHE[cache_key] = None
		return None

	NUTRITION_CACHE[cache_key] = None
	return None


def generate_label_candidates(label: str) -> List[str]:
	base = normalize_label(label)
	candidates: List[str] = []

	def add(value: str) -> None:
		if value and value not in candidates:
			candidates.append(value)

	canonical = CANONICAL_NAME_MAP.get(base)
	if canonical:
		add(canonical)
	add(base)
	alias = ALIASES.get(base)
	if alias:
		add(alias)

	words = base.split()
	core_words = [word for word in words if word not in DESCRIPTOR_WORDS]
	leading = list(words)
	while leading and leading[0] in DESCRIPTOR_WORDS:
		leading = leading[1:]
		add(" ".join(leading))

	trailing = list(words)
	while trailing and trailing[-1] in DESCRIPTOR_WORDS:
		trailing = trailing[:-1]
		add(" ".join(trailing))

	if core_words:
		add(" ".join(core_words))
		if len(core_words) > 1:
			for i in range(len(core_words) - 1):
				add(" ".join(core_words[i : i + 2]))

	for word in sorted(set(core_words), key=len, reverse=True):
		if len(word) >= 3:
			add(word)

	for value in list(candidates):
		alias_value = ALIASES.get(value)
		if alias_value:
			add(alias_value)
		canonical_value = CANONICAL_NAME_MAP.get(normalize_label(value))
		if canonical_value:
			add(canonical_value)

	max_candidates = get_max_candidates()
	if max_candidates > 0 and len(candidates) > max_candidates:
		return candidates[:max_candidates]

	return [value for value in candidates if value]


def find_nutrition(
	label: str,
	base_url: str,
	api_key: str,
) -> Tuple[str, Optional[Dict[str, float]]]:
	candidates = generate_label_candidates(label)
	for name in candidates:
		row = request_nutrition(base_url, api_key, name)
		if row:
			return row.get("name", name), row

	log_nutrition(f"[nutrition] no match for '{label}' candidates={candidates}")
	return label, None


def polygon_area(coords: List[float]) -> float:
	if len(coords) < 6 or len(coords) % 2 != 0:
		return 0.0
	xs = coords[0::2]
	ys = coords[1::2]
	area = 0.0
	n = len(xs)
	for i in range(n - 1):
		area += xs[i] * ys[i + 1] - xs[i + 1] * ys[i]
	area += xs[-1] * ys[0] - xs[0] * ys[-1]
	return abs(area) * 0.5


def rle_area(counts: Any, size: Any) -> float:
	if not isinstance(counts, list) or not isinstance(size, list) or len(size) != 2:
		return 0.0
	total = 0.0
	value = 0
	for run in counts:
		if value == 1:
			total += float(run)
		value = 1 - value
	return total


def area_from_base64(data_str: str) -> float:
	if Image is None:
		return 0.0
	try:
		if data_str.startswith("data:"):
			data_str = data_str.split(",", 1)[-1]
		raw = base64.b64decode(data_str)
		img = Image.open(io.BytesIO(raw)).convert("L")
		arr = np.array(img)
		return float(np.sum(arr > 0))
	except Exception:
		return 0.0


def area_from_mask(mask: Any) -> float:
	if mask is None:
		return 0.0
	if isinstance(mask, dict):
		if "counts" in mask and "size" in mask:
			return rle_area(mask["counts"], mask["size"])
		if "data" in mask and ("width" in mask or "height" in mask):
			width = mask.get("width")
			height = mask.get("height")
			data = mask.get("data", [])
			if isinstance(width, int) and isinstance(height, int) and len(data) == width * height:
				arr = np.array(data).reshape((height, width))
				return float(np.sum(arr > 0))
		if "base64" in mask and isinstance(mask["base64"], str):
			return area_from_base64(mask["base64"])
	if isinstance(mask, str):
		return area_from_base64(mask)
	if isinstance(mask, list):
		if mask and isinstance(mask[0], list):
			if mask and mask[0] and isinstance(mask[0][0], (int, float, bool)):
				arr = np.array(mask)
				return float(np.sum(arr > 0))
			if all(isinstance(poly, list) for poly in mask):
				areas = [polygon_area(poly) for poly in mask if poly]
				if areas:
					return float(sum(areas))
		if mask and all(isinstance(x, (int, float)) for x in mask):
			return polygon_area(mask)
	return 0.0


def area_from_bbox(item: Dict[str, Any]) -> float:
	box = item.get("box") or item.get("bbox") or item.get("boxes")
	if isinstance(box, dict):
		if all(k in box for k in ("x1", "y1", "x2", "y2")):
			x1, y1, x2, y2 = box["x1"], box["y1"], box["x2"], box["y2"]
			return max(0.0, float(x2 - x1) * float(y2 - y1))
		if all(k in box for k in ("left", "top", "width", "height")):
			return max(0.0, float(box["width"]) * float(box["height"]))
		if all(k in box for k in ("x", "y", "w", "h")):
			return max(0.0, float(box["w"]) * float(box["h"]))
		if all(k in box for k in ("width", "height")):
			return max(0.0, float(box["width"]) * float(box["height"]))
		if "xyxy" in box and isinstance(box["xyxy"], list) and len(box["xyxy"]) == 4:
			x1, y1, x2, y2 = box["xyxy"]
			return max(0.0, float(x2 - x1) * float(y2 - y1))
		if "xywh" in box and isinstance(box["xywh"], list) and len(box["xywh"]) == 4:
			_, _, w, h = box["xywh"]
			return max(0.0, float(w) * float(h))
	if isinstance(box, list) and len(box) == 4:
		x1, y1, x2, y2 = box
		area_xyxy = float(x2 - x1) * float(y2 - y1)
		if area_xyxy > 0:
			return area_xyxy
		_, _, w, h = box
		return max(0.0, float(w) * float(h))
	return 0.0


def decode_image_array(image_bytes: Optional[bytes]) -> Optional[np.ndarray]:
	if Image is None or not image_bytes:
		return None
	try:
		img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
		return np.asarray(img, dtype=np.float32)
	except Exception:
		return None


def mask_from_base64(data_str: str) -> Optional[np.ndarray]:
	if Image is None:
		return None
	try:
		if data_str.startswith("data:"):
			data_str = data_str.split(",", 1)[-1]
		raw = base64.b64decode(data_str)
		img = Image.open(io.BytesIO(raw)).convert("L")
		return np.asarray(img)
	except Exception:
		return None


def resize_mask(mask_arr: np.ndarray, target_shape: Tuple[int, int]) -> Optional[np.ndarray]:
	if mask_arr.shape[:2] == target_shape:
		return mask_arr > 0
	if Image is None:
		return None
	try:
		mask_img = Image.fromarray((mask_arr > 0).astype("uint8") * 255)
		mask_img = mask_img.resize((target_shape[1], target_shape[0]), resample=Image.NEAREST)
		return np.asarray(mask_img) > 0
	except Exception:
		return None


def mask_to_bool_array(mask: Any, target_shape: Tuple[int, int]) -> Optional[np.ndarray]:
	mask_arr: Optional[np.ndarray] = None
	if mask is None:
		return None
	if isinstance(mask, dict):
		if "data" in mask and ("width" in mask or "height" in mask):
			width = mask.get("width")
			height = mask.get("height")
			data = mask.get("data", [])
			if isinstance(width, int) and isinstance(height, int) and len(data) == width * height:
				mask_arr = np.array(data, dtype="uint8").reshape((height, width))
		elif "base64" in mask and isinstance(mask["base64"], str):
			mask_arr = mask_from_base64(mask["base64"])
	elif isinstance(mask, str):
		mask_arr = mask_from_base64(mask)
	elif isinstance(mask, list):
		if mask and isinstance(mask[0], list) and mask[0] and isinstance(mask[0][0], (int, float, bool)):
			if len(mask) <= 10 and len(mask[0]) <= 4:
				return None
			mask_arr = np.array(mask)

	if mask_arr is None:
		return None
	return resize_mask(mask_arr, target_shape)


def order_points(pts: np.ndarray) -> np.ndarray:
	rect = np.zeros((4, 2), dtype="float32")
	s = pts.sum(axis=1)
	rect[0] = pts[np.argmin(s)]
	rect[2] = pts[np.argmax(s)]
	diff = np.diff(pts, axis=1)
	rect[1] = pts[np.argmin(diff)]
	rect[3] = pts[np.argmax(diff)]
	return rect


def find_tray_corners(
	image_arr: np.ndarray,
	min_area_ratio: float,
	approx_eps_ratio: float,
) -> Optional[np.ndarray]:
	if cv2 is None:
		return None
	if image_arr is None or image_arr.size == 0:
		return None
	gray = cv2.cvtColor(image_arr, cv2.COLOR_RGB2GRAY)
	if gray.dtype != np.uint8:
		gray = np.clip(gray, 0, 255).astype("uint8")
	blur = cv2.GaussianBlur(gray, (5, 5), 0)
	edges = cv2.Canny(blur, 50, 150)
	contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
	if not contours:
		return None
	image_area = float(image_arr.shape[0] * image_arr.shape[1])
	min_area = image_area * max(min_area_ratio, 0.0)
	for contour in sorted(contours, key=cv2.contourArea, reverse=True):
		area = cv2.contourArea(contour)
		if area < min_area:
			break
		peri = cv2.arcLength(contour, True)
		approx = cv2.approxPolyDP(contour, approx_eps_ratio * peri, True)
		if len(approx) == 4:
			pts = approx.reshape(4, 2).astype("float32")
			return order_points(pts)
	return None


def get_tray_warp_size(tray_length_cm: float, tray_width_cm: float) -> Tuple[int, int]:
	width_override = int(get_env_float("TRAY_WARP_WIDTH", 0.0))
	height_override = int(get_env_float("TRAY_WARP_HEIGHT", 0.0))
	if width_override > 0 and height_override > 0:
		return width_override, height_override
	scale = get_env_float("TRAY_WARP_SCALE", 20.0)
	width = int(round(max(tray_width_cm, 1e-6) * scale))
	height = int(round(max(tray_length_cm, 1e-6) * scale))
	return max(width, 1), max(height, 1)


def area_from_mask_warp(
	mask: Any,
	image_shape: Tuple[int, int],
	warp_matrix: np.ndarray,
	warp_size: Tuple[int, int],
) -> float:
	if cv2 is None:
		return 0.0
	mask_arr = mask_to_bool_array(mask, image_shape)
	if mask_arr is None:
		return 0.0
	mask_img = (mask_arr.astype("uint8") * 255)
	warped = cv2.warpPerspective(mask_img, warp_matrix, warp_size, flags=cv2.INTER_NEAREST)
	return float(np.sum(warped > 0))


def area_from_bbox_warp(
	item: Dict[str, Any],
	image_shape: Tuple[int, int],
	warp_matrix: np.ndarray,
) -> float:
	if cv2 is None:
		return 0.0
	bbox = bbox_from_item(item, image_shape)
	if not bbox:
		return 0.0
	x1, y1, x2, y2 = bbox
	pts = np.array([[[x1, y1], [x2, y1], [x2, y2], [x1, y2]]], dtype="float32")
	warped = cv2.perspectiveTransform(pts, warp_matrix)[0]
	coords = warped.reshape(-1).tolist()
	return polygon_area(coords)


def clamp_bbox(
	x1: float,
	y1: float,
	x2: float,
	y2: float,
	image_shape: Optional[Tuple[int, int]],
) -> Optional[Tuple[int, int, int, int]]:
	if x2 < x1:
		x1, x2 = x2, x1
	if y2 < y1:
		y1, y2 = y2, y1

	if image_shape:
		height, width = image_shape
		x1 = max(0.0, min(float(x1), float(width)))
		x2 = max(0.0, min(float(x2), float(width)))
		y1 = max(0.0, min(float(y1), float(height)))
		y2 = max(0.0, min(float(y2), float(height)))

	ix1, ix2 = int(round(x1)), int(round(x2))
	iy1, iy2 = int(round(y1)), int(round(y2))
	if ix2 - ix1 <= 1 or iy2 - iy1 <= 1:
		return None
	return ix1, iy1, ix2, iy2


def bbox_from_item(
	item: Dict[str, Any],
	image_shape: Optional[Tuple[int, int]],
) -> Optional[Tuple[int, int, int, int]]:
	box = item.get("box") or item.get("bbox") or item.get("boxes")
	if isinstance(box, dict):
		if all(k in box for k in ("x1", "y1", "x2", "y2")):
			return clamp_bbox(box["x1"], box["y1"], box["x2"], box["y2"], image_shape)
		if all(k in box for k in ("left", "top", "width", "height")):
			x1, y1 = box["left"], box["top"]
			return clamp_bbox(x1, y1, x1 + box["width"], y1 + box["height"], image_shape)
		if all(k in box for k in ("x", "y", "w", "h")):
			x1, y1 = box["x"], box["y"]
			return clamp_bbox(x1, y1, x1 + box["w"], y1 + box["h"], image_shape)
		if "xyxy" in box and isinstance(box["xyxy"], list) and len(box["xyxy"]) == 4:
			x1, y1, x2, y2 = box["xyxy"]
			return clamp_bbox(x1, y1, x2, y2, image_shape)
		if "xywh" in box and isinstance(box["xywh"], list) and len(box["xywh"]) == 4:
			x1, y1, w, h = box["xywh"]
			return clamp_bbox(x1, y1, x1 + w, y1 + h, image_shape)
	if isinstance(box, list) and len(box) == 4:
		x1, y1, x2, y2 = box
		if float(x2) > float(x1) and float(y2) > float(y1):
			return clamp_bbox(x1, y1, x2, y2, image_shape)
		return clamp_bbox(x1, y1, x1 + x2, y1 + y2, image_shape)
	return None


def get_overlay_palette() -> List[Tuple[int, int, int]]:
	return [
		(67, 97, 238),
		(34, 197, 94),
		(245, 158, 11),
		(239, 68, 68),
		(6, 182, 212),
		(168, 85, 247),
		(249, 115, 22),
	]


def _find_truetype_font(font_size: int) -> Optional[Any]:
	"""Try to find a usable TrueType font from common system locations."""
	if ImageFont is None:
		return None

	# User-specified font takes priority
	font_path = os.getenv("OVERLAY_FONT_PATH")
	if font_path:
		try:
			return ImageFont.truetype(font_path, font_size)
		except Exception:
			pass

	# Common TrueType font candidates across OS
	candidates = [
		# Windows
		"C:/Windows/Fonts/arial.ttf",
		"C:/Windows/Fonts/arialbd.ttf",
		"C:/Windows/Fonts/segoeui.ttf",
		"C:/Windows/Fonts/calibri.ttf",
		# Linux / Docker
		"/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
		"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
		"/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
		"/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
		"/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
		"/usr/share/fonts/truetype/ubuntu/Ubuntu-Bold.ttf",
		# macOS
		"/System/Library/Fonts/Helvetica.ttc",
		"/Library/Fonts/Arial.ttf",
	]
	for path in candidates:
		if os.path.isfile(path):
			try:
				return ImageFont.truetype(path, font_size)
			except Exception:
				continue

	# Last resort: PIL default (very small bitmap)
	try:
		return ImageFont.load_default()
	except Exception:
		return None


def _normalize_image_orientation(file_bytes: bytes) -> bytes:
	"""Apply EXIF rotation to raw image bytes and return corrected bytes.

	Phone cameras store images in landscape pixel layout with an EXIF
	tag that tells viewers how to rotate.  By baking the rotation into
	the actual pixels we ensure every downstream consumer (Ultralytics
	model, overlay drawing, doneness analysis) sees the image in the
	same orientation the user sees on their phone / browser.
	"""
	if Image is None or ImageOps is None:
		return file_bytes
	try:
		img = Image.open(io.BytesIO(file_bytes))
		original_format = img.format or "JPEG"
		transposed = ImageOps.exif_transpose(img)
		# exif_transpose returns a NEW image only if rotation was needed
		if transposed is img:
			return file_bytes  # no rotation needed
		buf = io.BytesIO()
		save_kwargs: Dict[str, Any] = {}
		if original_format.upper() in ("JPEG", "JPG"):
			save_kwargs["quality"] = 95
			save_kwargs["exif"] = b""  # strip old EXIF to avoid double-rotation
		transposed.save(buf, format=original_format, **save_kwargs)
		return buf.getvalue()
	except Exception:
		return file_bytes


def draw_overlay_image(
	image_bytes: bytes,
	foods: List[Dict[str, Any]],
) -> Optional[str]:
	"""Draw bounding-box overlay.  Expects already-orientation-corrected bytes."""
	if Image is None or ImageDraw is None:
		return None
	try:
		img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
	except Exception:
		return None

	image_shape = (img.height, img.width)
	# Scale visual parameters based on image size so overlays are
	# clearly visible regardless of resolution.
	short_side = min(img.width, img.height)
	scale_factor = max(short_side / 640.0, 1.0)

	font_size_env = int(get_env_float("OVERLAY_LABEL_FONT_SIZE", 0.0))
	font_size = font_size_env if font_size_env > 0 else max(int(18 * scale_factor), 16)
	font = _find_truetype_font(font_size)

	box_thickness = max(int(3 * scale_factor), 3)
	pad = max(int(6 * scale_factor), 6)
	fill_alpha = int(get_env_float("OVERLAY_FILL_ALPHA", 40.0))

	palette = get_overlay_palette()

	# Create a transparent overlay layer for the semi-transparent box fills
	overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
	overlay_draw = ImageDraw.Draw(overlay)

	# Draw on the main image
	draw = ImageDraw.Draw(img)

	for idx, food in enumerate(foods):
		label = str(food.get("label") or "Unknown")
		confidence = food.get("confidence")
		if isinstance(confidence, (int, float)):
			label_text = f"{label} {confidence * 100:.0f}%"
		else:
			label_text = label

		color = palette[idx % len(palette)]
		color_with_alpha = color + (fill_alpha,)

		geometries = food.get("raw_geometry") or []
		if not isinstance(geometries, list):
			continue

		for geometry in geometries:
			box_value = None
			if isinstance(geometry, dict):
				box_value = geometry.get("box") or geometry.get("bbox") or geometry.get("boxes")
			bbox = bbox_from_item({"box": box_value}, image_shape)
			if not bbox:
				continue
			x1, y1, x2, y2 = bbox

			# Semi-transparent fill inside the bounding box
			overlay_draw.rectangle([x1, y1, x2, y2], fill=color_with_alpha)

			# Thick bounding box outline
			draw.rectangle([x1, y1, x2, y2], outline=color, width=box_thickness)

			if font is None:
				continue

			text_bbox = draw.textbbox((0, 0), label_text, font=font)
			text_w = text_bbox[2] - text_bbox[0]
			text_h = text_bbox[3] - text_bbox[1]

			# Position the label background above the box; if no room, place inside
			label_x1 = x1
			label_y1 = y1 - text_h - pad * 2
			if label_y1 < 0:
				label_y1 = y1 + box_thickness
			label_x2 = min(img.width, label_x1 + text_w + pad * 2)
			label_y2 = label_y1 + text_h + pad * 2

			# Filled label background
			draw.rectangle([label_x1, label_y1, label_x2, label_y2], fill=color)
			draw.text(
				(label_x1 + pad, label_y1 + pad),
				label_text,
				fill=(255, 255, 255),
				font=font,
			)

	# Composite the semi-transparent overlay onto the image
	img = Image.alpha_composite(img, overlay)
	# Convert back to RGB for PNG encoding
	img = img.convert("RGB")

	buffer = io.BytesIO()
	img.save(buffer, format="PNG", optimize=False)
	encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
	return f"data:image/png;base64,{encoded}"


def render_overlay_image(image_bytes: bytes, foods: List[Dict[str, Any]]) -> Optional[bytes]:
	if cv2 is None:
		return None
	if not image_bytes:
		return None
	img_array = np.frombuffer(image_bytes, np.uint8)
	image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
	if image is None:
		return None

	height, width = image.shape[:2]
	colors = [
		(238, 97, 67),
		(92, 197, 34),
		(11, 158, 245),
		(68, 68, 239),
		(212, 182, 6),
		(87, 88, 168),
		(22, 115, 246),
	]
	font = cv2.FONT_HERSHEY_SIMPLEX
	font_scale = get_env_float("OVERLAY_FONT_SCALE", 0.7)
	thickness = max(1, int(get_env_float("OVERLAY_FONT_THICKNESS", 2)))
	padding = max(2, int(get_env_float("OVERLAY_LABEL_PADDING", 4)))

	for index, food in enumerate(foods or []):
		color = colors[index % len(colors)]
		label = str(food.get("label") or "Unknown")
		ratio = food.get("portion_ratio")
		if isinstance(ratio, (int, float)):
			label_text = f"{label} {ratio * 100:.1f}%"
		else:
			label_text = label

		geometries = food.get("raw_geometry")
		if not isinstance(geometries, list):
			geometries = [geometries] if geometries else []

		for geometry in geometries:
			if not isinstance(geometry, dict):
				continue
			bbox = bbox_from_item(geometry, (height, width))
			if not bbox:
				continue
			x1, y1, x2, y2 = bbox
			if x2 <= x1 or y2 <= y1:
				continue

			cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
			(text_w, text_h), baseline = cv2.getTextSize(label_text, font, font_scale, thickness)
			label_x = max(0, min(x1, width - text_w - padding * 2))
			label_y = y1 - text_h - baseline - padding * 2
			if label_y < 0:
				label_y = min(height - text_h - baseline - padding * 2, y1 + 1)
			cv2.rectangle(
				image,
				(label_x, label_y),
				(label_x + text_w + padding * 2, label_y + text_h + baseline + padding * 2),
				color,
				-1,
			)
			cv2.putText(
				image,
				label_text,
				(label_x + padding, label_y + text_h + padding),
				font,
				font_scale,
				(255, 255, 255),
				thickness,
				cv2.LINE_AA,
			)

	ok, encoded = cv2.imencode(".png", image)
	if not ok:
		return None
	return encoded.tobytes()


def compute_item_doneness_score(
	item: Dict[str, Any],
	image_arr: Optional[np.ndarray],
) -> Optional[float]:
	if image_arr is None:
		return None
	shape = image_arr.shape[:2]
	mask = (
		item.get("mask")
		or item.get("segmentation")
		or item.get("segments")
		or item.get("masks")
	)
	mask_arr = mask_to_bool_array(mask, shape)
	if mask_arr is not None and mask_arr.any():
		pixels = image_arr[mask_arr]
		return compute_doneness_score_from_rgb(pixels)
	bbox = bbox_from_item(item, shape)
	if bbox:
		x1, y1, x2, y2 = bbox
		roi = image_arr[y1:y2, x1:x2]
		return compute_doneness_score_from_rgb(roi)
	return None


def extract_items(result: Dict[str, Any]) -> List[Dict[str, Any]]:
	if not isinstance(result, dict):
		return []
	images = result.get("images")
	if isinstance(images, list) and images:
		image0 = images[0] or {}
		for key in ("results", "predictions", "detections", "objects"):
			items = image0.get(key)
			if isinstance(items, list):
				return items
	for key in ("results", "predictions", "detections", "objects", "data"):
		items = result.get(key)
		if isinstance(items, list):
			return items
	return []


def estimate_from_file(
	file: Any,
	api_url: str,
	api_key: str,
	supabase_url: str,
	supabase_key: str,
	conf: str,
	iou: str,
	imgsz: str,
	timeout_s: int,
	total_food_grams: float,
	file_bytes_override: Optional[bytes] = None,
	doneness_label: Optional[str] = None,
	doneness_score: Optional[float] = None,
	doneness_per_class: Optional[bool] = None,
	doneness_from_image: Optional[bool] = None,
) -> Tuple[Dict[str, Any], int]:
	start_time = time.time()

	use_image_doneness = os.getenv("DONENESS_FROM_IMAGE", "1") == "1"
	per_class_enabled = os.getenv("DONENESS_PER_CLASS", "1") == "1"
	tray_warp_enabled = os.getenv("TRAY_WARP_ENABLE", "1") == "1"
	if doneness_from_image is not None:
		use_image_doneness = doneness_from_image
	if doneness_per_class is not None:
		per_class_enabled = doneness_per_class
	should_read_image = (
		(use_image_doneness and (per_class_enabled or (doneness_label is None and doneness_score is None)))
		or tray_warp_enabled
	)
	file_bytes: Optional[bytes] = file_bytes_override
	if should_read_image and file_bytes is None:
		try:
			file_bytes = file.read()
		except Exception:
			file_bytes = None

	# ── Normalize orientation ONCE so every downstream consumer
	#    (Ultralytics, overlay, doneness) sees the correctly-oriented image.
	if file_bytes:
		file_bytes = _normalize_image_orientation(file_bytes)

	image_arr = None
	if file_bytes and ((per_class_enabled and use_image_doneness) or tray_warp_enabled):
		image_arr = decode_image_array(file_bytes)

	try:
		file_payload = io.BytesIO(file_bytes) if file_bytes is not None else file.stream
		files = {
			"file": (
				file.filename,
				file_payload,
				file.mimetype or "application/octet-stream",
			)
		}
		data = {"conf": conf, "iou": iou, "imgsz": imgsz}
		response = requests.post(
			api_url,
			headers={"Authorization": f"Bearer {api_key}"},
			files=files,
			data=data,
			timeout=timeout_s,
		)
	except Exception as exc:
		return {"error": "Gagal menghubungi Ultralytics API", "details": str(exc)}, 502

	if not response.ok:
		return {"error": "Ultralytics API error", "details": response.text}, 502

	try:
		result = response.json()
	except Exception:
		return {"error": "Response Ultralytics tidak valid"}, 502

	items = extract_items(result)

	doneness_result = infer_doneness(
		doneness_label=doneness_label,
		doneness_score=doneness_score,
		image_bytes=file_bytes if use_image_doneness else None,
		enable_image=use_image_doneness,
	)
	cook_factor = 1.0
	if doneness_result:
		cook_factor = float(doneness_result.get("cook_factor", 1.0))

	tray_warp_matrix = None
	tray_warp_size: Optional[Tuple[int, int]] = None
	image_shape = image_arr.shape[:2] if image_arr is not None else None
	if tray_warp_enabled and cv2 is not None and image_shape is not None:
		tray_length_cm = get_env_float("TRAY_LENGTH_CM", 28.0)
		tray_width_cm = get_env_float("TRAY_WIDTH_CM", 22.0)
		warp_w, warp_h = get_tray_warp_size(tray_length_cm, tray_width_cm)
		tray_warp_size = (warp_w, warp_h)
		min_area_ratio = get_env_float("TRAY_CONTOUR_MIN_AREA_RATIO", 0.2)
		approx_eps_ratio = get_env_float("TRAY_CONTOUR_EPS_RATIO", 0.02)
		tray_corners = find_tray_corners(image_arr, min_area_ratio, approx_eps_ratio)
		if tray_corners is not None:
			dst = np.array(
				[[0.0, 0.0], [warp_w - 1.0, 0.0], [warp_w - 1.0, warp_h - 1.0], [0.0, warp_h - 1.0]],
				dtype="float32",
			)
			tray_warp_matrix = cv2.getPerspectiveTransform(tray_corners, dst)

	parsed: List[Dict[str, Any]] = []
	total_area = 0.0
	for item in items:
		mask = (
			item.get("mask")
			or item.get("segmentation")
			or item.get("segments")
			or item.get("masks")
		)
		box = item.get("box") or item.get("bbox") or item.get("boxes")
		raw_geometry: Dict[str, Any] = {}
		if box is not None:
			raw_geometry["box"] = box
		if mask is not None:
			raw_geometry["mask"] = mask
		if tray_warp_matrix is not None and tray_warp_size and image_shape is not None:
			area = area_from_mask_warp(mask, image_shape, tray_warp_matrix, tray_warp_size)
			area_source = "mask_warp"
		else:
			area = area_from_mask(mask)
			area_source = "mask"
		if area <= 0:
			if tray_warp_matrix is not None and image_shape is not None:
				bbox_area = area_from_bbox_warp(item, image_shape, tray_warp_matrix)
				if bbox_area > 0:
					area = bbox_area
					area_source = "bbox_warp"
			if area <= 0:
				bbox_area = area_from_bbox(item)
				if bbox_area > 0:
					area = bbox_area
					area_source = "bbox"
		item_doneness_score = None
		if per_class_enabled and use_image_doneness:
			item_doneness_score = compute_item_doneness_score(item, image_arr)
		total_area += area
		parsed.append(
			{
				"item": item,
				"area": area,
				"area_source": area_source,
				"doneness_score": item_doneness_score,
				"raw_geometry": raw_geometry if raw_geometry else None,
			}
		)

	if parsed and total_area <= 0:
		for row in parsed:
			row["area"] = 1.0
			row["area_source"] = "fallback"
		total_area = float(len(parsed))

	foods: List[Dict[str, Any]] = []
	total_nutrition = {"calories": 0.0, "protein": 0.0, "fat": 0.0, "carbs": 0.0}
	weight_mode = os.getenv("WEIGHT_MODE", "tray_volume").strip().lower()
	tray_length_cm = get_env_float("TRAY_LENGTH_CM", 28.0)
	tray_width_cm = get_env_float("TRAY_WIDTH_CM", 22.0)
	tray_height_cm = get_env_float("TRAY_HEIGHT_CM", 4.5)
	tray_coverage_ratio = max(0.0, get_env_float("TRAY_COVERAGE_RATIO", 1.0))
	default_fill_ratio = get_env_float("FOOD_FILL_RATIO", 0.18)
	default_density = get_env_float("FOOD_DENSITY_G_CM3", 1.0)
	default_height_cm = get_env_float("FOOD_HEIGHT_CM", 0.0)
	fill_ratio_by_label = get_env_json_map("FOOD_FILL_RATIO_BY_LABEL")
	density_by_label = get_env_json_map("FOOD_DENSITY_BY_LABEL")
	height_by_label = get_env_json_map("FOOD_HEIGHT_CM_BY_LABEL")
	tray_area_cm2 = max(0.0, tray_length_cm) * max(0.0, tray_width_cm)
	effective_tray_area_cm2 = tray_area_cm2 * tray_coverage_ratio
	total_weight_g = 0.0

	grouped: Dict[str, Dict[str, Any]] = {}
	for row in parsed:
		item = row["item"]
		area = float(row["area"])
		area_source = row.get("area_source", "mask")
		label = (
			item.get("name")
			or item.get("class_name")
			or item.get("class")
			or item.get("label")
			or "unknown"
		)
		confidence = float(item.get("confidence") or item.get("conf") or item.get("score") or 0.0)

		food_name, nutrition = find_nutrition(str(label), supabase_url, supabase_key)
		group_key = normalize_label(food_name)
		entry = grouped.get(group_key)
		if not entry:
			entry = {
				"label": food_name,
				"area": area,
				"confidence": confidence,
				"area_sources": {area_source},
				"nutrition": nutrition,
				"geometries": [],
				"doneness_score_sum": 0.0,
				"doneness_weight_sum": 0.0,
			}
			grouped[group_key] = entry
		else:
			entry["area"] += area
			entry["confidence"] = max(entry["confidence"], confidence)
			entry["area_sources"].add(area_source)
			if entry["nutrition"] is None and nutrition is not None:
				entry["nutrition"] = nutrition
				entry["label"] = food_name

		doneness_score = row.get("doneness_score")
		if doneness_score is not None and area > 0:
			entry["doneness_score_sum"] += float(doneness_score) * area
			entry["doneness_weight_sum"] += area
		raw_geometry = row.get("raw_geometry")
		if raw_geometry:
			entry["geometries"].append(raw_geometry)

	for entry in grouped.values():
		area = float(entry["area"])
		ratio = area / total_area if total_area > 0 else 0.0
		if weight_mode == "ratio_total":
			weight_g = ratio * total_food_grams
		else:
			area_cm2 = ratio * effective_tray_area_cm2
			height_cm = get_label_value(entry["label"], height_by_label, -1.0)
			if height_cm <= 0:
				if default_height_cm > 0:
					height_cm = default_height_cm
				else:
					fill_ratio = get_label_value(
						entry["label"],
						fill_ratio_by_label,
						default_fill_ratio,
					)
					fill_ratio = min(max(fill_ratio, 0.0), 1.0)
					height_cm = tray_height_cm * fill_ratio
			density = get_label_value(entry["label"], density_by_label, default_density)
			if density < 0:
				density = 0.0
			weight_g = area_cm2 * height_cm * density
		total_weight_g += weight_g
		entry_doneness = None
		entry_cook_factor = cook_factor
		if per_class_enabled:
			profile = get_doneness_profile(entry["label"])
			if profile == "raw_ok":
				raw_score = get_env_float("DONENESS_RAW_SCORE", 0.12)
				entry_doneness = infer_doneness_from_score(raw_score, source="label", profile=profile)
				entry_cook_factor = 1.0
			else:
				doneness_weight = float(entry.get("doneness_weight_sum", 0.0))
				if doneness_weight > 0:
					avg_score = float(entry.get("doneness_score_sum", 0.0)) / doneness_weight
					avg_score = adjust_score_for_profile(avg_score, profile)
					label_bias = get_label_bias(entry["label"])
					if label_bias > 0 and avg_score < 0.45:
						avg_score = min(1.0, avg_score + label_bias)
					entry_doneness = infer_doneness_from_score(avg_score, source="image", profile=profile)
				elif doneness_result:
					entry_doneness = doneness_result
				if entry_doneness:
					entry_cook_factor = float(entry_doneness.get("cook_factor", cook_factor))
		nutrition = entry["nutrition"]
		nutrition_per_100g = None
		if nutrition:
			nutrition_per_100g = {
				"calories": round_value(nutrition["calories"], 2),
				"protein": round_value(nutrition["protein"], 2),
				"fat": round_value(nutrition["fat"], 2),
				"carbs": round_value(nutrition["carbs"], 2),
			}
			factor = weight_g / 100.0
			calories = nutrition["calories"] * factor
			protein = nutrition["protein"] * factor
			fat = nutrition["fat"] * factor
			carbs = nutrition["carbs"] * factor
			if entry_cook_factor != 1.0:
				calories *= entry_cook_factor
				protein *= entry_cook_factor
				fat *= entry_cook_factor
				carbs *= entry_cook_factor
		else:
			calories = protein = fat = carbs = 0.0

		total_nutrition["calories"] += calories
		total_nutrition["protein"] += protein
		total_nutrition["fat"] += fat
		total_nutrition["carbs"] += carbs

		sources = entry["area_sources"]
		if len(sources) == 1:
			area_source = next(iter(sources))
		else:
			area_source = "mixed"

		food_entry = {
			"label": entry["label"],
			"portion_ratio": round_value(ratio, 4),
			"estimated_weight_g": round_value(weight_g, 2),
			"nutrition": {
				"calories": round_value(calories, 2),
				"protein": round_value(protein, 2),
				"fat": round_value(fat, 2),
				"carbs": round_value(carbs, 2),
			},
			"nutrition_per_100g": nutrition_per_100g,
			"confidence": round_value(entry["confidence"], 4),
			"mask_area": round_value(area, 2),
			"area_source": area_source,
			"raw_geometry": entry.get("geometries", []),
		}
		if per_class_enabled and entry_doneness:
			weight_sum = float(entry.get("doneness_weight_sum", 0.0))
			if weight_sum > 0 or entry_doneness.get("source") == "label":
				food_entry["doneness"] = entry_doneness
		foods.append(food_entry)

	foods.sort(key=lambda item: item["portion_ratio"], reverse=True)
	if weight_mode == "ratio_total":
		total_food_grams_value = total_food_grams
	else:
		total_food_grams_value = total_weight_g

	processing_time = time.time() - start_time
	overlay_image = None
	if os.getenv("RETURN_OVERLAY_IMAGE", "1") == "1" and file_bytes:
		overlay_image = draw_overlay_image(file_bytes, foods)

	response_body = {
		"success": True,
		"model": result.get("model_id") or result.get("model") or "ultralytics-rtdetr",
		"total_food_grams": round_value(total_food_grams_value, 2),
		"foods": foods,
		"total_nutrition": {
			"calories": round_value(total_nutrition["calories"], 2),
			"protein": round_value(total_nutrition["protein"], 2),
			"fat": round_value(total_nutrition["fat"], 2),
			"carbs": round_value(total_nutrition["carbs"], 2),
		},
		"processing_time_s": round(processing_time, 3),
	}
	if overlay_image:
		response_body["overlay_image"] = overlay_image

	if doneness_result:
		response_body["doneness"] = doneness_result

	return response_body, 200
