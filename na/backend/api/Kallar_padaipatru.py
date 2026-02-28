from fastapi import APIRouter, Form, File, UploadFile, HTTPException, Query
from pydantic import BaseModel, model_validator
from typing import List, Optional, Literal
from datetime import datetime
from common_urldb import db
from translator import en_to_ta
from pydantic import BaseModel, model_validator
from typing import List, Optional, Literal
import os
from bson import ObjectId
MEDIA_BASE = "media/kallarpadaipatru"
router = APIRouter()

uravulgal_collection = db["uravugal"]
os.makedirs(MEDIA_BASE, exist_ok=True)

# ----------------------------
# INPUT MODEL
# ----------------------------

class PadaipatruInput(BaseModel):
    lang: str = "en"

    name: str
    pattapaiyar: str
    native_place: str

    marital_status: Literal[
        "unmarried",
        "married",
        "widowed",
        "divorced",
        "ready_for_next_marriage"
    ]

    children_count: Optional[int] = None

    photo_url: Optional[str] = None

    Educational_qualification: str
    address: str
    work: List[str]

    contact_number: str
    email: str

    # ✅ Pydantic v2 style validator
    @model_validator(mode="after")
    def validate_married_fields(self):
        if self.marital_status == "married":
            if self.children_count is None:
                raise ValueError("children_count is required if married")
            if self.photo_url is None:
                raise ValueError("photo_url is required if married")
        return self


# ----------------------------
# TRANSLATION MAPS
# ----------------------------
WORK_TA = {
    "Business": "வியாபாரம்",
    "vivasayam": "விவசாயம்",
    "veylai": "வேலை",
    "ethara": "இதர",
}

MARITAL_STATUS_TA = {
    "unmarried": "திருமணமாகாதவர்",
    "married": "திருமணமானவர்",
    "widowed": "விதவை",
    "divorced": "விவாகரத்து பெற்றவர்",
    "ready_for_next_marriage": "மீண்டும் திருமணம் செய்ய தயாராக உள்ளவர்"
}


# ----------------------------
# TRANSLATION HELPERS
# ----------------------------
def translate_text(text: str, lang: str):
    if not text:
        return ""
    if lang == "ta":
        return en_to_ta(text)
    return text


def translate_marital_status(status: str, lang: str):
    if lang == "ta":
        return MARITAL_STATUS_TA.get(status, status)
    return status


def translate_work(work_list: List[str], lang: str):
    if lang == "ta":
        return [WORK_TA.get(w.lower(), w) for w in work_list]
    return work_list


# ----------------------------
# ADD API
# ----------------------------
@router.post("/kallar-padaipatru/add/", operation_id="addKallarPadaipatru")
def add_kallar_padaipatru(
        name: str = Form(...),
        pattapaiyar: str = Form(...),
        native_place: str = Form(...),
        marital_status: str = Form(...),
        children_count: int = Form(None),
        Educational_qualification: str = Form(...),
        address: str = Form(...),
        work: str = Form(...),   # comma separated
        contact_number: str = Form(...),
        email: str = Form(...),
        photo: UploadFile = File(None),
        lang: str = Query("en")
):

    # ---------------- VALIDATION ----------------
    if marital_status == "married":
        if children_count is None:
            raise HTTPException(status_code=400, detail="Children count required")
        if photo is None:
            raise HTTPException(status_code=400, detail="Photo required")

    # ---------------- INSERT BASIC DATA ----------------
    inserted = uravulgal_collection.insert_one({
        "name": name,
        "pattapaiyar": pattapaiyar,
        "native_place": native_place,
        "marital_status": marital_status,
        "children_count": children_count,
        "Educational_qualification": Educational_qualification,
        "address": address,
        "work": [w.strip() for w in work.split(",") if w.strip()],
        "contact_number": contact_number,
        "email": email,
        "photo": None,
        "created_at": datetime.utcnow()
    })

    padaipatru_id = str(inserted.inserted_id)

    # ---------------- SAVE IMAGE ----------------
    # ---------------- SAVE IMAGE ----------------
    if photo:
        if not photo.content_type.startswith("image"):
            raise HTTPException(status_code=400, detail="Only image allowed")

        ext = photo.filename.split(".")[-1].lower()
        filename = f"{padaipatru_id}.{ext}"

        full_path = os.path.join(MEDIA_BASE, filename)

        with open(full_path, "wb") as f:
            f.write(photo.file.read())

        db_path = f"{MEDIA_BASE}/{filename}"

        uravulgal_collection.update_one(
            {"_id": ObjectId(padaipatru_id)},
            {"$set": {"photo": db_path}}
        )

    return {
        "status": "success",
        "padaipatru_id": padaipatru_id,
        "message": "Kallar Padaipatru added successfully"
    }