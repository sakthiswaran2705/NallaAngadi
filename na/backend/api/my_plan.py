from fastapi import APIRouter, Depends
from common_urldb import db
from auth_jwt import verify_token
from datetime import datetime

router = APIRouter()

col_payments = db["payments"]

@router.get("/my-plan/")
def my_plan(user_id: str = Depends(verify_token)):
    payment = col_payments.find_one(
        {
            "user_id": user_id,
            "status": "success"
        },
        sort=[("created_at", -1)]
    )

    if not payment:
        return {
            "status": True,
            "subscribed": False
        }

    # OPTIONAL: expiry check
    if payment.get("expiry_date"):
        if payment["expiry_date"] < datetime.utcnow():
            return {
                "status": True,
                "subscribed": False
            }

    return {
        "status": True,
        "subscribed": True,
        "plan": payment.get("plan_name")  # silver / gold / platinum
    }
