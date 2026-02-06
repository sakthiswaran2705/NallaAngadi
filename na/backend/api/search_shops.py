from fastapi import APIRouter, Query
from bson import ObjectId
from common_urldb import db
import re

from translator import en_to_ta, ta_to_en
from cache import get_cached, set_cache

router = APIRouter()

col_shop = db["shop"]
col_city = db["city"]
col_category = db["category"]
col_reviews = db["reviews"]


# ---------------- SAFE OBJECT ----------------
def safe(x):
    if isinstance(x, ObjectId):
        return str(x)
    if isinstance(x, list):
        return [safe(i) for i in x]
    if isinstance(x, dict):
        return {k: safe(v) for k, v in x.items()}
    return x


# --------------------------------------------------
# 🔥 IMAGE RESOLVER (ONLY MAIN_IMAGE)
# --------------------------------------------------
def resolve_shop_image_from_search(shop):


    # 1️⃣ main_image
    main_image = shop.get("main_image")
    if main_image and str(main_image).strip() != "":
        return main_image

    # 2️⃣ category default image
    category_ids = shop.get("category", [])
    if category_ids:
        try:
            cat = col_category.find_one(
                {"_id": ObjectId(category_ids[0])},
                {"default_shop_image": 1}
            )
            if cat and cat.get("default_shop_image"):
                return cat["default_shop_image"]
        except:
            pass

    return None


LETTER_MAP = {
    "A": "ஏ", "B": "பி", "C": "சி", "D": "டி", "E": "ஈ",
    "F": "எஃப்", "G": "ஜி", "H": "எச்", "I": "ஐ",
    "J": "ஜே", "K": "கே", "L": "எல்", "M": "எம்",
    "N": "என்", "O": "ஓ", "P": "பி", "Q": "க்யூ",
    "R": "ஆர்", "S": "எஸ்", "T": "டி", "U": "யூ",
    "V": "வி", "W": "டபிள்யூ", "X": "எக்ஸ்",
    "Y": "வை", "Z": "ஸெட்"
}


def phonetic_tamil(text: str):
    if not text:
        return text

    words = text.split()
    out = []

    for w in words:
        if w.isalpha() and len(w) <= 5:
            out.append(" ".join(LETTER_MAP.get(c.upper(), c) for c in w))
        else:
            out.append(w)

    return " ".join(out)


# ---------------- TRANSLATION SAFETY ----------------
def is_base64(text: str) -> bool:
    return len(text) > 200 and re.fullmatch(r"[A-Za-z0-9+/=]+", text) is not None


def should_translate(text: str) -> bool:
    if not text:
        return False
    if len(text) > 500:
        return False
    if is_base64(text):
        return False
    if text.startswith("http"):
        return False
    if text.startswith("media/"):
        return False
    return True


# ---------------- TRANSLATION ----------------
def translate_text_en_to_ta(text: str):
    if not should_translate(text):
        return text

    cached = get_cached(text)
    if cached:
        return cached

    ta = en_to_ta(text)
    set_cache(text, ta)
    return ta


def translate_dict(obj):
    if isinstance(obj, dict):
        new_obj = {}
        for k, v in obj.items():
            if k in ("shop_name", "category_image", "image"):
                new_obj[k] = v
            else:
                new_obj[k] = translate_dict(v)
        return new_obj

    if isinstance(obj, list):
        return [translate_dict(i) for i in obj]

    if isinstance(obj, str):
        return translate_text_en_to_ta(obj)

    return obj


# ---------------- SEARCH API ----------------
@router.get("/shop/search/", operation_id="searchshop")
def get_static(
        place: str | None = Query(None),
        name: str | None = Query(None),
        lang: str = Query("en"),
        page: int = Query(1, ge=1),
        limit: int = Query(5, ge=1, le=100)
):
    if not name:
        return {"data": [], "page": page, "has_more": False}

    search_name = name
    search_place = place

    if lang == "ta":
        search_name = ta_to_en(name)
        if place:
            search_place = ta_to_en(place)

    name_lower = search_name.lower()
    place_lower = search_place.lower() if search_place else None

    matched_categories = list(col_category.find({
        "name": {"$regex": name_lower, "$options": "i"}
    }))
    matched_cat_ids = [c["_id"] for c in matched_categories]

    query = {
        "$and": [
            {"status": "approved"},
            {
                "$or": [
                    {"shop_name": {"$regex": name_lower, "$options": "i"}},
                    {"keywords": {"$regex": name_lower, "$options": "i"}},
                    {"category": {"$in": matched_cat_ids}},
                    {"category": {"$in": [str(x) for x in matched_cat_ids]}},
                ]
            }
        ]
    }

    shops = list(col_shop.find(query))

    valid_candidates = []

    for s in shops:
        sid = str(s["_id"])

        city = None
        cid = s.get("city_id")
        if ObjectId.is_valid(str(cid)):
            city = col_city.find_one({"_id": ObjectId(cid)})

        if place_lower and city:
            if city.get("city_name", "").lower() != place_lower:
                continue

        shop_reviews = list(col_reviews.find({"shop_id": sid}))
        avg_rating = (
            sum(r.get("rating", 0) for r in shop_reviews) / len(shop_reviews)
            if shop_reviews else 0
        )

        valid_candidates.append({
            "shop_raw": s,
            "city_raw": city,
            "avg_rating": avg_rating,
            "reviews_count": len(shop_reviews)
        })

    valid_candidates.sort(
        key=lambda x: (x["avg_rating"], x["reviews_count"]),
        reverse=True
    )

    total_count = len(valid_candidates)
    start_index = (page - 1) * limit
    end_index = start_index + limit

    sliced_candidates = valid_candidates[start_index:end_index]
    has_more = end_index < total_count

    final_output = []

    for item in sliced_candidates:
        s = item["shop_raw"]
        city = item["city_raw"]

        final_categories = []
        for c in s.get("category", []):
            if ObjectId.is_valid(str(c)):
                cat = col_category.find_one({"_id": ObjectId(c)})
            else:
                cat = col_category.find_one({"name": c})

            if cat:
                final_categories.append({
                    "_id": str(cat["_id"]),
                    "name": cat.get("name"),
                    "category_image": cat.get("category_image")
                })

        shop_name = s.get("shop_name") or ""
        if lang == "ta":
            translated = translate_text_en_to_ta(shop_name)
            shop_name = (
                phonetic_tamil(shop_name)
                if translated.strip().lower() == shop_name.strip().lower()
                else translated
            )

        shop_data = safe(s)
        shop_data["shop_name"] = shop_name

        shop_data["main_image"] = resolve_shop_image_from_search(s)

        response_item = {
            "shop": shop_data,
            "categories": final_categories,
            "city": safe(city) if city else None,
            "avg_rating": round(item["avg_rating"], 1),
            "reviews_count": item["reviews_count"],
        }

        if lang == "ta":
            response_item = translate_dict(response_item)

        final_output.append(response_item)

    return {
        "data": final_output,
        "page": page,
        "has_more": has_more
    }
