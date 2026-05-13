import io
import os
from typing import Any, Dict, Optional

import numpy as np

try:
	from PIL import Image
except Exception:
	Image = None


def clamp(value: Any, min_value: float = 0.0, max_value: float = 1.0) -> float:
	try:
		v = float(value)
	except Exception:
		return min_value
	if v < min_value:
		return min_value
	if v > max_value:
		return max_value
	return v


def triangle(x: float, a: float, b: float, c: float) -> float:
	if x <= a or x >= c:
		return 0.0
	if x == b:
		return 1.0
	if x < b:
		return (x - a) / (b - a)
	return (c - x) / (c - b)


def trapezoid(x: float, a: float, b: float, c: float, d: float) -> float:
	if x <= a or x >= d:
		return 0.0
	if b <= x <= c:
		return 1.0
	if x < b:
		return (x - a) / (b - a)
	return (d - x) / (d - c)


def parse_doneness_score(value: Any) -> Optional[float]:
	if value is None:
		return None
	try:
		return clamp(float(value))
	except Exception:
		return None


def parse_doneness_label(value: Any) -> Optional[float]:
	if value is None:
		return None
	key = str(value).strip().lower()
	if not key:
		return None

	mapping = {
		"mentah": 0.1,
		"raw": 0.1,
		"kurang matang": 0.3,
		"setengah matang": 0.4,
		"medium": 0.45,
		"matang": 0.6,
		"pas": 0.5,
		"matang pas": 0.5,
		"normal": 0.5,
		"well done": 0.75,
		"terlalu matang": 0.85,
		"gosong": 0.9,
		"overcooked": 0.9,
		"burnt": 0.95,
	}

	if key in mapping:
		return mapping[key]
	return parse_doneness_score(key)


def _get_factor(env_key: str, default: float) -> float:
	value = os.getenv(env_key)
	if value is None or value == "":
		return default
	try:
		return float(value)
	except Exception:
		return default


def _get_factors() -> Dict[str, float]:
	return {
		"raw": _get_factor("DONENESS_FACTOR_RAW", 0.98),
		"normal": _get_factor("DONENESS_FACTOR_NORMAL", 1.0),
		"overcooked": _get_factor("DONENESS_FACTOR_OVERCOOKED", 0.96),
	}


def _get_score_calibration() -> Dict[str, float]:
	return {
		"offset": _get_factor("DONENESS_SCORE_OFFSET", 0.08),
		"scale": _get_factor("DONENESS_SCORE_SCALE", 1.8),
		"gamma": _get_factor("DONENESS_SCORE_GAMMA", 1.0),
	}


def calibrate_image_score(score: float) -> float:
	config = _get_score_calibration()
	adjusted = clamp((score + config["offset"]) * config["scale"])
	gamma = config["gamma"]
	if gamma and gamma != 1.0:
		adjusted = clamp(adjusted ** gamma)
	return adjusted




def compute_brownness_from_rgb(arr: Optional[np.ndarray]) -> Optional[float]:
	if arr is None:
		return None
	try:
		arr = np.asarray(arr, dtype=np.float32)
	except Exception:
		return None

	if arr.size == 0:
		return None

	if arr.ndim == 3 and arr.shape[2] >= 3:
		r = arr[:, :, 0] / 255.0
		g = arr[:, :, 1] / 255.0
		b = arr[:, :, 2] / 255.0
	elif arr.ndim == 2 and arr.shape[1] >= 3:
		r = arr[:, 0] / 255.0
		g = arr[:, 1] / 255.0
		b = arr[:, 2] / 255.0
	else:
		return None

	maxc = np.maximum(np.maximum(r, g), b)
	minc = np.minimum(np.minimum(r, g), b)
	sat = maxc - minc

	brown_raw = ((r + g) * 0.5 - b)
	brown = np.clip(brown_raw, 0.0, 1.0)
	score = float(np.mean(brown * (0.4 + 0.6 * sat)))
	# Calibrate image-derived score so cooked items do not collapse to raw.
	return calibrate_image_score(score)


def compute_luminance_from_rgb(arr: Optional[np.ndarray]) -> Optional[float]:
	if arr is None:
		return None
	try:
		arr = np.asarray(arr, dtype=np.float32)
	except Exception:
		return None

	if arr.size == 0:
		return None

	if arr.ndim == 3 and arr.shape[2] >= 3:
		r = arr[:, :, 0] / 255.0
		g = arr[:, :, 1] / 255.0
		b = arr[:, :, 2] / 255.0
	elif arr.ndim == 2 and arr.shape[1] >= 3:
		r = arr[:, 0] / 255.0
		g = arr[:, 1] / 255.0
		b = arr[:, 2] / 255.0
	else:
		return None

	gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
	return float(np.mean(gray))


def compute_texture_from_rgb(arr: Optional[np.ndarray]) -> Optional[float]:
	if arr is None:
		return None
	try:
		arr = np.asarray(arr, dtype=np.float32)
	except Exception:
		return None

	if arr.size == 0:
		return None

	if arr.ndim == 3 and arr.shape[2] >= 3:
		r = arr[:, :, 0] / 255.0
		g = arr[:, :, 1] / 255.0
		b = arr[:, :, 2] / 255.0
	elif arr.ndim == 2 and arr.shape[1] >= 3:
		r = arr[:, 0] / 255.0
		g = arr[:, 1] / 255.0
		b = arr[:, 2] / 255.0
	else:
		return None

	gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
	if gray.size < 4:
		return None
	if gray.ndim == 1:
		return clamp(float(np.std(gray)) * 2.5)

	dx = np.abs(gray[:, 1:] - gray[:, :-1])
	dy = np.abs(gray[1:, :] - gray[:-1, :])
	edge = float((np.mean(dx) + np.mean(dy)) * 0.5)
	return clamp(edge * 4.0)


def compute_doneness_score_from_rgb(arr: Optional[np.ndarray]) -> Optional[float]:
	brownness = compute_brownness_from_rgb(arr)
	if brownness is None:
		return None
	texture = compute_texture_from_rgb(arr)
	luminance = compute_luminance_from_rgb(arr)
	if texture is None or luminance is None:
		return brownness

	darkness = 1.0 - luminance
	score = brownness * 0.6 + texture * 0.25 + darkness * 0.15
	return clamp(score)


def compute_brownness(image_bytes: Optional[bytes]) -> Optional[float]:
	if Image is None or not image_bytes:
		return None
	try:
		img = Image.open(io.BytesIO(image_bytes))
		img = img.convert("RGB")
		img.thumbnail((256, 256))
		arr = np.asarray(img, dtype=np.float32)
	except Exception:
		return None

	return compute_brownness_from_rgb(arr)


def evaluate_memberships(score: float, profile: str = "default") -> Dict[str, float]:
	score = clamp(score)
	if profile == "light_cooked":
		return {
			"raw": trapezoid(score, 0.0, 0.0, 0.2, 0.4),
			"normal": triangle(score, 0.2, 0.45, 0.7),
			"overcooked": trapezoid(score, 0.6, 0.8, 1.0, 1.0),
		}
	if profile == "high_brown":
		return {
			"raw": trapezoid(score, 0.0, 0.0, 0.3, 0.5),
			"normal": triangle(score, 0.35, 0.6, 0.85),
			"overcooked": trapezoid(score, 0.7, 0.85, 1.0, 1.0),
		}
	if profile == "raw_ok":
		return {
			"raw": trapezoid(score, 0.0, 0.0, 0.35, 0.6),
			"normal": triangle(score, 0.35, 0.6, 0.85),
			"overcooked": trapezoid(score, 0.75, 0.9, 1.0, 1.0),
		}
	return {
		"raw": trapezoid(score, 0.0, 0.0, 0.25, 0.45),
		"normal": triangle(score, 0.25, 0.5, 0.75),
		"overcooked": trapezoid(score, 0.55, 0.75, 1.0, 1.0),
	}


def defuzzify_factor(memberships: Dict[str, float]) -> float:
	if not memberships:
		return 1.0
	factors = _get_factors()
	denom = sum(memberships.values())
	if denom <= 0:
		return 1.0
	numer = sum(memberships.get(key, 0.0) * factors[key] for key in factors)
	return clamp(numer / denom, 0.85, 1.1)


def infer_doneness(
	doneness_label: Optional[str] = None,
	doneness_score: Optional[float] = None,
	image_bytes: Optional[bytes] = None,
	enable_image: bool = False,
	profile: str = "default",
) -> Optional[Dict[str, Any]]:
	score = parse_doneness_score(doneness_score)
	source = "manual"
	if score is None:
		score = parse_doneness_label(doneness_label)
		if score is None and enable_image:
			score = compute_brownness(image_bytes)
			source = "image"

	if score is None:
		return None

	memberships = evaluate_memberships(score, profile=profile)
	label = max(memberships, key=memberships.get)
	cook_factor = defuzzify_factor(memberships)
	return {
		"label": label,
		"score": round(clamp(score), 4),
		"memberships": {key: round(value, 4) for key, value in memberships.items()},
		"cook_factor": round(cook_factor, 4),
		"source": source,
	}


def infer_doneness_from_score(
	score: Optional[float],
	source: str = "manual",
	profile: str = "default",
) -> Optional[Dict[str, Any]]:
	score = parse_doneness_score(score)
	if score is None:
		return None

	memberships = evaluate_memberships(score, profile=profile)
	label = max(memberships, key=memberships.get)
	cook_factor = defuzzify_factor(memberships)
	return {
		"label": label,
		"score": round(clamp(score), 4),
		"memberships": {key: round(value, 4) for key, value in memberships.items()},
		"cook_factor": round(cook_factor, 4),
		"source": source,
	}
