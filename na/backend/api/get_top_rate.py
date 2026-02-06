from fastapi import APIRouter, Query
from bson import ObjectId
from math import radians, cos, sin, asin, sqrt
from common_urldb import db
from translator import en_to_ta
# phonetic_tamil மற்றும் translate_text_en_to_ta சரியாக இம்போர்ட் செய்யப்பட்டுள்ளதா என உறுதிப்படுத்தவும்
from search_shops import translate_text_en_to_ta, phonetic_tamil

router = APIRouter()

col_shop = db["shop"]
col_reviews = db["reviews"]
col_city = db["city"]
col_category = db["category"]

GLOBAL_DEFAULT_IMAGE = "media/category_images/default_images/shop.jpeg"


# ---------------- HAVERSINE (Distance Calculation) ----------------
def calculate_distance(lat1, lon1, lat2, lon2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371 * 2 * asin(sqrt(a))


# ---------------- IMAGE RESOLVER ----------------
def resolve_shop_image(shop, cat_obj):
    # 1️⃣ main_image
    if shop.get("main_image"):
        return shop["main_image"]

    # 2️⃣ media image
    media = shop.get("media")
    if isinstance(media, list):
        for m in media:
            if isinstance(m, dict) and m.get("type") == "image" and m.get("path"):
                return m["path"]

    # 3️⃣ category default_shop_image
    if cat_obj:
        if cat_obj.get("default_shop_image"):
            return cat_obj["default_shop_image"]
        if cat_obj.get("category_image"):
            return cat_obj["category_image"]

    # 4️⃣ global fallback
    return GLOBAL_DEFAULT_IMAGE


# ---------------- TOP RATED (Fixed for Tamil Search) ----------------
@router.get("/shops/top-rated", operation_id="getTopRatedShops")
def get_top_rated_shops(
        lang: str = Query("en"),
        city: str | None = Query(None),
        lat: float | None = Query(None),
        lon: float | None = Query(None),
        radius: int = Query(25),
        limit: int = Query(6)
):
    shops = list(col_shop.find({"status": "approved"}))
    results = []

    # பயனர் தமிழில் தேடினால், ஒப்பிடுவதற்கு வசதியாக lowercase செய்யவும்
    input_city_lower = city.lower().strip() if city else ""

    for s in shops:
        sid = str(s["_id"])

        # ---- LOCATION LOGIC ----
        is_nearby = False

        # 1. GPS வழி தேடல் (lat/lon இருந்தால்)
        if lat is not None and lon is not None:
            try:
                if s.get("latitude") and s.get("longitude"):
                    d = calculate_distance(
                        lat, lon,
                        float(s["latitude"]),
                        float(s["longitude"])
                    )
                    if d <= radius:
                        is_nearby = True
            except:
                pass

        # 2. City பெயர் வழி தேடல் (GPS இல்லை என்றால்)
        if not is_nearby and city:
            cid = s.get("city_id")
            if ObjectId.is_valid(str(cid)):
                c = col_city.find_one({"_id": ObjectId(cid)})
                if c:
                    db_city_name = c.get("city_name", "").lower()

                    # ஆங்கிலத்தில் நேரடி பொருத்தம்
                    if db_city_name == input_city_lower:
                        is_nearby = True

                    # தமிழுக்கான மாற்றம் (Fix applied here)
                    # Database-ல் உள்ள ஆங்கில பெயரை தமிழுக்கு மாற்றி, பயனர் தந்த தமிழ் பெயரோடு ஒப்பிடுதல்
                    elif lang == "ta":
                        translated_db_city = translate_text_en_to_ta(c.get("city_name", "")).lower()
                        if translated_db_city == input_city_lower:
                            is_nearby = True

        # 3. எதுவும் கொடுக்கவில்லை என்றால் அனைத்தையும் காட்டு
        if not city and lat is None:
            is_nearby = True

        if not is_nearby:
            continue

        # ---- RATINGS ----
        reviews = list(col_reviews.find({"shop_id": sid}))
        count = len(reviews)
        avg_rating = round(
            sum(r.get("rating", 0) for r in reviews) / count, 1
        ) if count else 0

        # ---- CATEGORY ----
        cat_obj = None
        cat_name = ""
        cats = s.get("category", [])
        if cats:
            first = cats[0]
            if ObjectId.is_valid(str(first)):
                cat_obj = col_category.find_one({"_id": ObjectId(first)})
            else:
                cat_obj = col_category.find_one({"name": first})
            if cat_obj:
                cat_name = cat_obj.get("name", "")

        # ---- IMAGE ----
        final_image = resolve_shop_image(s, cat_obj)

        # ---- CITY NAME RESOLVE ----
        city_name = ""
        cid = s.get("city_id")
        if ObjectId.is_valid(str(cid)):
            c = col_city.find_one({"_id": ObjectId(cid)})
            if c:
                city_name = c.get("city_name", "")

        results.append({
            "shop_id": sid,
            "shop_name": s.get("shop_name", ""),
            "description": s.get("description", ""),
            "address": s.get("address", ""),
            "landmark": s.get("landmark", ""),
            "phone_number": s.get("phone_number", ""),
            "email": s.get("email", ""),
            "image": final_image,
            "city": city_name,
            "category_name": cat_name,
            "average_rating": avg_rating,
            "review_count": count
        })

    # Rating அடிப்படையில் வரிசைப்படுத்துதல்
    results.sort(key=lambda x: (x["average_rating"], x["review_count"]), reverse=True)
    results = results[:limit]

    # ---- TRANSLATION FOR OUTPUT ----
    if lang == "ta":
        for r in results:
            t = translate_text_en_to_ta(r["shop_name"])
            # Phonetic conversion if translation matches English (meaning translation failed or kept same)
            r["shop_name"] = phonetic_tamil(r["shop_name"]) if t.lower() == r["shop_name"].lower() else t
            r["city"] = translate_text_en_to_ta(r["city"])
            r["category_name"] = translate_text_en_to_ta(r["category_name"])

    return {"status": True, "data": results}


# ---------------- SHOP DETAILS ----------------
@router.get("/shop/{shop_id}", operation_id="getShopDetails")
def get_shop_details(shop_id: str, lang: str = Query("en")):
    if not ObjectId.is_valid(shop_id):
        return {"status": False, "message": "Invalid Shop ID"}

    shop = col_shop.find_one({"_id": ObjectId(shop_id)})
    if not shop:
        return {"status": False, "message": "Shop not found"}

    sid = str(shop["_id"])

    reviews = list(col_reviews.find({"shop_id": sid}))
    count = len(reviews)
    avg_rating = round(
        sum(r.get("rating", 0) for r in reviews) / count, 1
    ) if count else 0

    # ---- CATEGORY ----
    cat_obj = None
    cat_name = ""
    cats = shop.get("category", [])
    if cats:
        first = cats[0]
        if ObjectId.is_valid(str(first)):
            cat_obj = col_category.find_one({"_id": ObjectId(first)})
        else:
            cat_obj = col_category.find_one({"name": first})
        if cat_obj:
            cat_name = cat_obj.get("name", "")

    # ---- IMAGE ----
    final_image = resolve_shop_image(shop, cat_obj)

    # ---- CITY ----
    city_name = ""
    cid = shop.get("city_id")
    if ObjectId.is_valid(str(cid)):
        c = col_city.find_one({"_id": ObjectId(cid)})
        if c:
            city_name = c.get("city_name", "")

    data = {
        "shop_id": sid,
        "shop_name": shop.get("shop_name", ""),
        "description": shop.get("description", ""),
        "address": shop.get("address", ""),
        "landmark": shop.get("landmark", ""),
        "phone_number": shop.get("phone_number", ""),
        "email": shop.get("email", ""),
        "image": final_image,
        "media": shop.get("media", []),
        "city": city_name,
        "category_name": cat_name,
        "average_rating": avg_rating,
        "review_count": count
    }

    if lang == "ta":
        data["shop_name"] = phonetic_tamil(data["shop_name"])
        data["city"] = translate_text_en_to_ta(data["city"])
        data["category_name"] = translate_text_en_to_ta(data["category_name"])
        data["description"] = translate_text_en_to_ta(data["description"])
        data["address"] = translate_text_en_to_ta(data["address"])
        data["landmark"] = translate_text_en_to_ta(data["landmark"])

    return {"status": True, "data": data}