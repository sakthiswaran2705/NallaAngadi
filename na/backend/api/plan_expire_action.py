from datetime import datetime
from bson import ObjectId
from common_urldb import db

col_payments = db["payments"]
col_shops = db["shop"]
col_offers = db["offers"]


def lock_user_resources(user_id):
    query = {
        "$or": [
            {"user_id": user_id},
            {"user_id": ObjectId(user_id)}
        ]
    }

    col_shops.update_many(
        query,
        {"$set": {"status": "payment_pending"}}
    )

    col_offers.update_many(
        query,
        {"$set": {"status": "payment_pending"}}
    )


def process_expired_plans():
    """
    Run via cron or manual:
    - Detect expired plans
    - Lock shops & offers
    - Mark payment as expired
    """

    now = datetime.utcnow()

    expired_query = {
        "status": "success",
        "expiry_date": {"$lt": now},
        "expired_at": {"$exists": False},
        "$or": [
            {"autopay": {"$exists": False}},
            {"autopay": False}
        ]
    }

    expired_count = col_payments.count_documents(expired_query)
    #print("Expired plans found:", expired_count)

    expired_payments = col_payments.find(expired_query)

    for pay in expired_payments:
        user_id = pay.get("user_id")
        if not user_id:
            continue

        #print(" Plan expired for user:", user_id)

        # 1️⃣ Lock shop & offer resources
        lock_user_resources(user_id)

        # 2️⃣ Mark payment expired
        col_payments.update_one(
            {"_id": pay["_id"]},
            {
                "$set": {
                    "status": "expired",
                    "expired_at": now
                }
            }
        )

        #print("Expiry processed for:", user_id)


if __name__ == "__main__":
    process_expired_plans()
