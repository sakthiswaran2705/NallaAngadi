from fastapi import APIRouter, Query
from bson import ObjectId
from math import radians, cos, sin, asin, sqrt
from common_urldb import db
from translator import en_to_ta
from cache import get_cached, set_cache
from search_shops import translate_text_en_to_ta,phonetic_tamil
# Reuse your existing helper functions
# (safe, translate_dict, translate_text_en_to_ta, phonetic_tamil - assumed available in scope)

router = APIRouter()

col_shop = db["shop"]
col_reviews = db["reviews"]
col_city = db["city"]
col_category = db["category"]


# ---------------- HAVERSINE DISTANCE FUNCTION ----------------
def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r


# ---------------- TOP RATED API ----------------
# ---------------- TOP RATED API (FIXED) ----------------
@router.get("/shops/top-rated", operation_id="getTopRatedShops")
def get_top_rated_shops(
        lang: str = Query("en"),
        city: str | None = Query(None),
        lat: float | None = Query(None),
        lon: float | None = Query(None),
        radius: int = Query(25),  # Default 25km radius
        limit: int = Query(6)  # ✅ Default Limit set to 6
):
    # Only fetch active/approved shops
    query = {"status": "approved"}

    raw_shops = list(col_shop.find(query))
    valid_candidates = []

    for s in raw_shops:
        sid = str(s["_id"])

        # --- A. LOCATION FILTERING (25km Radius) ---
        is_nearby = False

        # 1. GPS Coordinates (Highest Priority)
        if lat is not None and lon is not None:
            shop_lat = s.get("latitude")
            shop_lon = s.get("longitude")

            if shop_lat and shop_lon:
                try:
                    dist = calculate_distance(lat, lon, float(shop_lat), float(shop_lon))
                    if dist <= radius:
                        is_nearby = True
                except:
                    pass

                    # 2. City Name Fallback
        if not is_nearby and city:
            shop_city_id = s.get("city_id")
            if shop_city_id:
                # Resolve City Name from ID
                if ObjectId.is_valid(str(shop_city_id)):
                    shop_city_obj = col_city.find_one({"_id": ObjectId(shop_city_id)})
                    if shop_city_obj:
                        shop_city_name = shop_city_obj.get("city_name", "").lower()
                        if shop_city_name == city.lower():
                            is_nearby = True

        # 3. No Location Filter (Global)
        if not city and lat is None:
            is_nearby = True

        if not is_nearby:
            continue

        # --- B. RATING CALCULATION ---
        shop_reviews = list(col_reviews.find({"shop_id": sid}))

        if not shop_reviews:
            avg_rating = 0
            count = 0
        else:
            avg_rating = sum(r.get("rating", 0) for r in shop_reviews) / len(shop_reviews)
            count = len(shop_reviews)

        # ✅ OPTIONAL: Only show shops that have at least 1 review?
        # Uncomment the next line if you want strictly "Rated" shops only.
        # if count == 0: continue

        # --- C. IMAGE EXTRACTION (FIXED) ---
        final_image = ""

        # 1. Check 'main_image' first
        if s.get("main_image"):
            final_image = s.get("main_image")

        # 2. If no main_image, check 'media' array for the first image
        elif s.get("media") and isinstance(s["media"], list):
            for m in s["media"]:
                if m.get("type") == "image" and m.get("path"):
                    final_image = m.get("path")
                    break

        # --- D. METADATA ---
        # Fetch City Name
        city_name = ""
        cid = s.get("city_id")
        if ObjectId.is_valid(str(cid)):
            c_obj = col_city.find_one({"_id": ObjectId(cid)})
            if c_obj: city_name = c_obj.get("city_name", "")

        # Fetch First Category Name
        cat_name = ""
        cats = s.get("category", [])
        if cats:
            first_cat = cats[0]
            if ObjectId.is_valid(str(first_cat)):
                cat_obj = col_category.find_one({"_id": ObjectId(first_cat)})
            else:
                cat_obj = col_category.find_one({"name": first_cat})

            if cat_obj: cat_name = cat_obj.get("name", "")

        valid_candidates.append({
            "shop_id": sid,
            "shop_name": s.get("shop_name", ""),
            "image": final_image,  # ✅ This now holds the correct path
            "city": city_name,
            "category_name": cat_name,
            "average_rating": avg_rating,
            "review_count": count
        })

    # --- SORTING ---
    # Sort by Rating (High -> Low), then Review Count
    valid_candidates.sort(key=lambda x: (x["average_rating"], x["review_count"]), reverse=True)

    # --- LIMITING ---
    final_output = valid_candidates[:limit]

    # --- TRANSLATION ---
    if lang == "ta":
        translated_output = []
        for item in final_output:
            t_shop_name = translate_text_en_to_ta(item["shop_name"])
            t_city = translate_text_en_to_ta(item["city"])
            t_cat = translate_text_en_to_ta(item["category_name"])

            # Phonetic logic
            if t_shop_name.strip().lower() == item["shop_name"].strip().lower():
                t_shop_name = phonetic_tamil(item["shop_name"])

            item["shop_name"] = t_shop_name
            item["city"] = t_city
            item["category_name"] = t_cat
            translated_output.append(item)
        final_output = translated_output

    return {"status": True, "data": final_output}