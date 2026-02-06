from fastapi import APIRouter, Depends
from common_urldb import db
from auth_jwt import verify_token
from datetime import datetime

router = APIRouter()

col_payments = db["payments"]

@router.get("/my-plan/")
def my_plan(user_id: str = Depends(verify_token)):
    now = datetime.utcnow()

    payment = col_payments.find_one(
        {
            "user_id": user_id,
            "expiry_date": {"$gt": now},
            "$or": [
                {"status": "success"},  # normal payment
                {"autopay": True, "subscription_status": "active"}  # autopay
            ]
        },
        sort=[("updated_at", -1)]
    )

    if not payment:
        return {
            "status": True,
            "subscribed": False
        }

    return {
        "status": True,
        "subscribed": True,
        "plan": payment.get("plan_name"),
        "expiry_date": payment.get("expiry_date"),
        "autopay": payment.get("autopay", False)
    }
