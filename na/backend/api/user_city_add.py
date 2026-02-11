from fastapi import APIRouter, Form, Depends
from bson import ObjectId
from common_urldb import db
from auth_jwt import verify_token
import requests

router = APIRouter()
collection = db["city"]
col_user = db["user"]

# ================= JWT =================



# -------------------------------------------------
# HELPER: CITY → LAT / LNG (OpenStreetMap)
# -------------------------------------------------
def get_city_latlng(city_name: str, state: str = None):
    query = city_name
    if state:
        query = f"{city_name}, {state}"

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": query,
        "format": "json",
        "limit": 1
    }

    try:
        res = requests.get(
            url,
            params=params,
            headers={"User-Agent": "rk-dial-app"}
        )
        data = res.json()
        if not data:
            return None, None
        return float(data[0]["lat"]), float(data[0]["lon"])
    except:
        return None, None


# -------------------------------------------------
# CREATE CITY (ADMIN)
# -------------------------------------------------
@router.post("/city/add/")
def add_city(
    city_name: str = Form(...),
    district: str = Form(...),
    pincode: int = Form(...),
    state: str = Form(...),
    user_id: str = Depends(verify_token),
):
    # 🔍 Check by pincode only
    exist = collection.find_one({"pincode": pincode})

    if exist is not None:
        return {
            "inserted": False,
            "message": "City already exists for this pincode",
            "city_id": str(exist["_id"])
        }

    # New city → get lat/lng
    lat, lng = get_city_latlng(city_name, state)

    data = {
        "city_name": city_name,
        "district": district,
        "pincode": pincode,
        "state": state,
        "lat": lat,
        "lng": lng
    }

    res = collection.insert_one(data)

    return {
        "inserted": True,
        "message": "City added successfully",
        "city_id": str(res.inserted_id),
        "lat": lat,
        "lng": lng
    }

