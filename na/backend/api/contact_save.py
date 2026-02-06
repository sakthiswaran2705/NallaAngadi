from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime
from common_urldb import db

router = APIRouter()

# MongoDB collection
col_contact = db["contact"]


# -------- Schema --------
class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    message: str


# -------- API --------
@router.post("/contact/")
async def create_contact(data: ContactCreate):
    try:
        col_contact.insert_one({
            "name": data.name,
            "email": data.email,
            "mobile": data.mobile,
            "message": data.message,
            "created_at": datetime.utcnow()
        })

        return {
            "success": True,
            "message": "Contact details saved successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save contact")
