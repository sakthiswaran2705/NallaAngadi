from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime
from common_urldb import db
from translator import en_to_ta

router = APIRouter()

uravulgal_collection = db["uravugal"]


# ----------------------------
# INPUT MODEL
# ----------------------------
class UravugalInput(BaseModel):
    lang: str = "en"

    name: str
    pattapaiyar: Optional[str] = ""
    native_place: Optional[str] = ""

    father_name: Optional[str] = ""
    father_pattapaiyar: Optional[str] = ""
    father_native_place: Optional[str] = ""

    mother_name: Optional[str] = ""
    mother_pattapaiyar: Optional[str] = ""
    mother_native_place: Optional[str] = ""

    # ✅ MARITAL STATUS
    marital_status: Literal[
        "unmarried",
        "married",
        "widowed",
        "divorced",
        "ready_for_next_marriage"
    ] = "unmarried"

    occupation: List[str] = []
    business_running: str = "no"  # yes / no
    business_name: Optional[str] = ""

    contact_number: Optional[str] = ""
    email: Optional[str] = ""


# ----------------------------
# TRANSLATION HELPERS
# ----------------------------
def translate_text(text: str, lang: str):
    if not text:
        return ""
    if lang == "ta":
        return en_to_ta(text)
    return text


MARITAL_STATUS_TA = {
    "unmarried": "திருமணமாகாதவர்",
    "married": "திருமணமானவர்",
    "widowed": "விதவை்",
    "divorced": "விவாகரத்து பெற்றவர்",
    "ready_for_next_marriage": "மீண்டும் திருமணம் செய்ய தயாராக உள்ளவர்"
}


def translate_marital_status(status: str, lang: str):
    if lang == "ta":
        return MARITAL_STATUS_TA.get(status, status)
    return status


# ----------------------------
# ADD API
# ----------------------------
@router.post("/uravugal/add/", operation_id="addUravugal")
def add_uravulgal(data: UravugalInput):

    # Translate fields
    translated_name = translate_text(data.name, data.lang)
    translated_pattapaiyar = translate_text(data.pattapaiyar, data.lang)
    translated_native = translate_text(data.native_place, data.lang)

    translated_father_name = translate_text(data.father_name, data.lang)
    translated_father_pattapaiyar = translate_text(data.father_pattapaiyar, data.lang)
    translated_father_native = translate_text(data.father_native_place, data.lang)

    translated_mother_name = translate_text(data.mother_name, data.lang)
    translated_mother_pattapaiyar = translate_text(data.mother_pattapaiyar, data.lang)
    translated_mother_native = translate_text(data.mother_native_place, data.lang)

    translated_marital_status = translate_marital_status(
        data.marital_status,
        data.lang
    )

    translated_occupations = [
        translate_text(occ, data.lang) for occ in data.occupation
    ]

    translated_business_name = ""
    if data.business_running == "yes" and data.business_name:
        translated_business_name = translate_text(data.business_name, data.lang)

    # Document
    document = {
        "lang": data.lang,
        "name": translated_name,
        "pattapaiyar": translated_pattapaiyar,
        "native_place": translated_native,

        "father_name": translated_father_name,
        "father_pattapaiyar": translated_father_pattapaiyar,
        "father_native_place": translated_father_native,

        "mother_name": translated_mother_name,
        "mother_pattapaiyar": translated_mother_pattapaiyar,
        "mother_native_place": translated_mother_native,

        # ✅ NEW FIELD
        "marital_status": translated_marital_status,

        "occupation": translated_occupations,
        "business_running": data.business_running,
        "business_name": translated_business_name,

        "contact_number": data.contact_number,
        "email": data.email,

        "created_at": datetime.utcnow()
    }

    uravulgal_collection.insert_one(document)

    return {
        "status": "success",
        "message": "Uravugal details saved successfully"
    }
