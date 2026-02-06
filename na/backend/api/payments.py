import os
import hmac
import hashlib
import razorpay
from fastapi import APIRouter, Depends, Body, HTTPException, Request
from datetime import datetime, timedelta
from bson import ObjectId
from dotenv import load_dotenv

# Database & Auth Imports
from common_urldb import db
from auth_jwt import verify_token

# Business Logic Imports
from plan_config import PLAN_CONFIG
from notifications_setting import send_user_notification
from plan_expiry_mail import (
    send_payment_success_mail,
    send_addon_payment_success_mail,
    check_offer_expiry_and_send_mail
)

load_dotenv(override=True)

# ==================================================
# CONFIGURATION & SETUP
# ==================================================

# Razorpay Config
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    raise RuntimeError("Razorpay keys not configured")

client = razorpay.Client(
    auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
)

# Router Setup
router = APIRouter()

# Database Collections
col_payments = db["payments"]
col_shop = db["shop"]
col_offer = db["offers"]
col_notifications = db["notifications"]
col_addons = db["addons"]

# Constants
ADDON_PRICE = 50
ALLOWED_STATUS = ["success", "failed", "pending"]


# ==================================================
# HELPER FUNCTIONS (OFFER LOGIC PRESERVED)
# ==================================================

def get_month_range():
    """
    STRICTLY PRESERVED: Determines the start and end of the current month.
    """
    now = datetime.utcnow()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)

    return start, end


def normalize_user_id(user_id):
    return str(user_id)


def get_active_plan(user_id: str):
    payment = col_payments.find_one(
        {
            "user_id": user_id,
            "expiry_date": {"$gt": datetime.utcnow()},
            "$or": [
                {"status": "success"},
                {"autopay": True, "subscription_status": "active"}
            ]
        },
        sort=[("updated_at", -1)]
    )

    if payment:
        return payment

    return {"plan_name": "starter", "is_default": True}


def calculate_expiry(plan_name):
    if plan_name not in PLAN_CONFIG:
        return datetime.utcnow() + timedelta(days=30)  # Default fallback
    return datetime.utcnow() + timedelta(days=PLAN_CONFIG[plan_name]["days"])


def get_total_addon_offers(user_id: str) -> int:
    """
    STRICTLY PRESERVED: Calculates total extra offers purchased.
    """
    pipeline = [
        {"$match": {"user_id": user_id, "status": "success", "type": "extra_offer"}},
        {"$group": {"_id": None, "total": {"$sum": "$quantity"}}}
    ]
    result = list(col_addons.aggregate(pipeline))
    return result[0]["total"] if result else 0


def check_shop_limit(user_id: str):
    payment = get_active_plan(user_id)
    plan_name = payment["plan_name"]
    shop_limit = PLAN_CONFIG[plan_name]["shops"]

    current_shops = col_shop.count_documents({"user_id": user_id})

    if current_shops >= shop_limit:
        if plan_name == "starter":
            raise HTTPException(
                403,
                "Starter plan allows only 1 shop. Upgrade to add more shops."
            )
        else:
            raise HTTPException(
                403,
                f"{plan_name.capitalize()} plan allows only {shop_limit} shops."
            )


def check_offer_limit(user_id: str):
    payment = get_active_plan(user_id)
    if not payment:
        raise HTTPException(403, "Please subscribe to add offers")

    plan_name = payment["plan_name"]
    base_limit = PLAN_CONFIG[plan_name]["offers"]
    addon_limit = get_total_addon_offers(user_id)
    total_limit = base_limit + addon_limit

    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$unwind": "$offers"},
    ]

    # ✅ Monthly logic MUST filter offers.uploaded_at
    if PLAN_CONFIG[plan_name].get("offers_period") == "monthly":
        start, end = get_month_range()
        pipeline.append({
            "$match": {
                "offers.uploaded_at": {"$gte": start, "$lt": end}
            }
        })

    pipeline.append({"$count": "total"})

    result = list(col_offer.aggregate(pipeline))
    used = result[0]["total"] if result else 0

    if used >= total_limit:
        raise HTTPException(
            403,
            f"Offer limit reached ({used}/{total_limit})"
        )

# ==================================================
# STANDARD PAYMENT API ENDPOINTS
# ==================================================

@router.post("/payment/create-order/")
def create_order(
        user_id: str = Depends(verify_token),
        data: dict = Body(...)
):
    try:
        plan_id = data.get("plan_id")

        if not plan_id or plan_id not in PLAN_CONFIG:
            raise HTTPException(400, "Invalid plan")

        plan = PLAN_CONFIG[plan_id]
        amount = int(plan.get("amount", 0))  # ✅ paise

        if amount <= 0:
            raise HTTPException(400, "Invalid amount")

        order = client.order.create({
            "amount": amount,
            "currency": "INR",
            "receipt": f"plan_{plan_id}_{int(datetime.utcnow().timestamp())}",
            "payment_capture": 1,
            "notes": {
                "user_id": user_id,
                "plan_name": plan_id
            }
        })

        return {
            "status": True,
            "order_id": order["id"],
            "amount": order["amount"],
            "key_id": RAZORPAY_KEY_ID
        }

    except Exception as e:
        print("Razorpay create order failed:", e)
        raise HTTPException(500, "Razorpay order failed")


@router.post("/payment/verify/")
def verify_payment(
        user_id: str = Depends(verify_token),
        data: dict = Body(...)
):
    order_id = data.get("razorpay_order_id")
    payment_id = data.get("razorpay_payment_id")
    signature = data.get("razorpay_signature")

    if not order_id or not payment_id or not signature:
        raise HTTPException(status_code=400, detail="Missing payment data")

    body = f"{order_id}|{payment_id}"

    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        body.encode(),
        hashlib.sha256
    ).hexdigest()

    if expected_signature != signature:
        raise HTTPException(status_code=400, detail="Signature verification failed")

    return {"status": True}


@router.post("/payment/save/")
def save_payment(
        user_id: str = Depends(verify_token),
        data: dict = Body(...)
):
    status = data.get("status")
    payment_id = data.get("payment_id")
    order_id = data.get("order_id")
    plan = data.get("plan_name") or data.get("plan_id")

    if status not in ALLOWED_STATUS:
        raise HTTPException(400, "Invalid payment status")

    if not payment_id or not order_id:
        raise HTTPException(400, "payment_id & order_id required")

    if plan not in PLAN_CONFIG:
        raise HTTPException(400, "Invalid plan")

    amount = PLAN_CONFIG[plan]["price"]
    expiry_date = calculate_expiry(plan)

    col_payments.update_one(
        {"payment_id": payment_id},
        {
            "$set": {
                "user_id": user_id,
                "order_id": order_id,
                "plan_name": plan,
                "amount": amount,
                "currency": "INR",
                "status": status,
                "expiry_date": expiry_date,
                "updated_at": datetime.utcnow()
            },
            "$setOnInsert": {
                "created_at": datetime.utcnow(),
                "payment_success_mail_sent": False,
                "expiry_mail_2days_sent": False,
                "expiry_mail_today_sent": False
            }
        },
        upsert=True
    )

    payment = col_payments.find_one({"payment_id": payment_id})

    if status == "success" and payment and not payment.get("payment_success_mail_sent"):
        send_payment_success_mail(
            user_id=user_id,
            plan_name=plan,
            amount=amount,
            expiry_date=expiry_date
        )

        col_payments.update_one(
            {"payment_id": payment_id},
            {"$set": {"payment_success_mail_sent": True}}
        )

    return {
        "status": True,
        "message": "Payment stored",
        "plan": plan,
        "amount": amount,
        "expiry_date": expiry_date
    }


@router.post("/payment/check-order/")
def check_order_payment(
        user_id: str = Depends(verify_token),
        data: dict = Body(...)
):
    order_id = data.get("order_id")
    if not order_id:
        raise HTTPException(status_code=400, detail="order_id required")

    try:
        payments = client.order.payments(order_id)
        if not payments["items"]:
            return {"status": False, "message": "No payment found"}

        payment = payments["items"][-1]
        return {
            "status": True,
            "payment_id": payment["id"],
            "payment_status": payment["status"],
            "amount": payment["amount"] // 100
        }
    except Exception:
        return {"status": False, "message": "Error fetching order"}


# ==================================================
# ADD-ON ENDPOINTS
# ==================================================

@router.post("/payment/addon/create-order/")
def create_addon_order(
        user_id: str = Depends(verify_token),
        data: dict = Body(...)
):
    quantity = int(data.get("quantity", 0))
    if quantity < 1:
        raise HTTPException(400, "Minimum quantity is 1")

    amount_paise = quantity * ADDON_PRICE * 100

    order = client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"addon_{user_id[:6]}_{int(datetime.utcnow().timestamp())}",
        "notes": {
            "user_id": user_id,
            "type": "extra_offer",
            "quantity": quantity
        }
    })

    return {
        "status": True,
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID
    }


@router.post("/payment/addon/verify/")
def verify_addon_payment(
        user_id: str = Depends(verify_token),
        data: dict = Body(...)
):
    order_id = data.get("razorpay_order_id")
    payment_id = data.get("razorpay_payment_id")
    signature = data.get("razorpay_signature")

    if not all([order_id, payment_id, signature]):
        raise HTTPException(400, "Missing payment details")

    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        })
    except Exception:
        raise HTTPException(400, "Payment verification failed")

    try:
        order_details = client.order.fetch(order_id)
        notes = order_details.get("notes", {})

        if notes.get("type") != "extra_offer":
            raise HTTPException(400, "Invalid order type")

        quantity = int(notes.get("quantity", 0))
        amount = order_details["amount"] // 100
    except Exception:
        raise HTTPException(500, "Failed to fetch order details")

    addon_record = {
        "user_id": user_id,
        "type": "extra_offer",
        "quantity": quantity,
        "amount": amount,
        "payment_id": payment_id,
        "order_id": order_id,
        "status": "success",
        "mail_sent": False,
        "created_at": datetime.utcnow()
    }

    col_addons.update_one(
        {"payment_id": payment_id},
        {"$setOnInsert": addon_record},
        upsert=True
    )

    existing = col_addons.find_one({"payment_id": payment_id})

    if existing and not existing.get("mail_sent", False):
        # ✅ Credits ONLY ONCE (Legacy support if needed)
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"credits": quantity}}
        )

        send_addon_payment_success_mail(
            user_id=user_id,
            quantity=quantity,
            amount=amount
        )

        col_addons.update_one(
            {"payment_id": payment_id},
            {"$set": {"mail_sent": True}}
        )

        try:
            send_user_notification(
                user_id=user_id,
                notif_type="addon_purchase",
                title="Add-on Successful",
                message=f"You have purchased {quantity} extra offers.",
                related_id=payment_id
            )
        except Exception as e:
            print("Notification failed:", e)

    return {
        "status": True,
        "message": f"Successfully added {quantity} offers!"
    }


# ==================================================
# AUTOPAY ENDPOINTS
# ==================================================

@router.post("/autopay/create/")
def create_autopay(user_id: str = Depends(verify_token), data: dict = Body(...)):
    plan = data.get("plan_name")
    if plan not in PLAN_CONFIG:
        raise HTTPException(400, "Invalid plan")

    sub = client.subscription.create({
        "plan_id": PLAN_CONFIG[plan]["autopay"]["razorpay_plan_id"],
        "customer_notify": 1,
        "total_count": 12,
        "notes": {"user_id": user_id, "plan": plan}
    })

    col_payments.insert_one({
        "user_id": user_id,
        "subscription_id": sub["id"],
        "plan_name": plan,
        "autopay": True,
        "subscription_status": "created",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })

    return {
        "status": True,
        "subscription_id": sub["id"],
        "key_id": RAZORPAY_KEY_ID
    }


@router.post("/autopay/change-plan/")
def change_autopay_plan(
        user_id: str = Depends(verify_token),
        data: dict = Body(...)
):
    new_plan = data.get("plan_name")

    if new_plan not in PLAN_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid plan")

    active = col_payments.find_one({
        "user_id": user_id,
        "autopay": True,
        "subscription_status": "active"
    })

    if active:
        try:
            client.subscription.cancel(active["subscription_id"])
        except Exception as e:
            print("❌ Razorpay cancel error:", e)

        col_payments.update_one(
            {"_id": active["_id"]},
            {
                "$set": {
                    "autopay": False,
                    "subscription_status": "cancelled",
                    "updated_at": datetime.utcnow()
                }
            }
        )

    sub = client.subscription.create({
        "plan_id": PLAN_CONFIG[new_plan]["autopay"]["razorpay_plan_id"],
        "customer_notify": 1,
        "total_count": 12,
        "notes": {
            "user_id": user_id,
            "plan": new_plan
        }
    })

    col_payments.insert_one({
        "user_id": user_id,
        "subscription_id": sub["id"],
        "plan_name": new_plan,
        "autopay": True,
        "subscription_status": "created",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })

    uid = normalize_user_id(user_id)
    send_user_notification(
        user_id=uid,
        notif_type="plan_changed",
        title="Plan Change Initiated",
        message=f"Your plan change to {new_plan} is in progress.",
        related_id=sub["id"]
    )

    return {
        "status": True,
        "message": "Plan change initiated successfully",
        "subscription_id": sub["id"],
        "key_id": RAZORPAY_KEY_ID
    }


# ==================================================
# USER PLAN & LIMITS
# ==================================================

@router.get("/my-plan/")
def my_plan(user_id: str = Depends(verify_token)):
    payment = get_active_plan(user_id)
    if not payment:
        return {"status": True, "subscribed": False}

    plan = payment["plan_name"]
    limits = PLAN_CONFIG[plan]

    shops_used = col_shop.count_documents({"user_id": user_id})

    # STACKING LOGIC: Base + Addons
    addon_offers = get_total_addon_offers(user_id)
    total_offers_allowed = limits["offers"] + addon_offers

    # Build Match Query
    match_query = {"user_id": user_id}
    if limits.get("offers_period") == "monthly":
        start, end = get_month_range()
        match_query["created_at"] = {"$gte": start, "$lt": end}

    # Aggregation: Count array size
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$unwind": "$offers"},
    ]

    if limits.get("offers_period") == "monthly":
        start, end = get_month_range()
        pipeline.append({
            "$match": {
                "offers.uploaded_at": {"$gte": start, "$lt": end}
            }
        })

    pipeline.append({"$count": "total"})

    result = list(col_offer.aggregate(pipeline))
    offers_used = result[0]["total"] if result else 0

    return {
        "status": True,
        "subscribed": True,
        "plan": plan,
        "limits": {
            **limits,
            "addon_offers": addon_offers,
            "total_offers": total_offers_allowed
        },
        "usage": {
            "shops_used": shops_used,
            "offers_used": offers_used,
            "shops_left": max(0, limits["shops"] - shops_used),
            "offers_left": max(0, total_offers_allowed - offers_used)
        },
        "expiry_date": payment.get("expiry_date")
    }


# ==================================================
# WEBHOOK HANDLER (SINGLE SOURCE OF TRUTH)
# ==================================================

@router.post("/payment/webhook/")
async def razorpay_webhook(request: Request):
    payload = await request.body()
    received_signature = request.headers.get("X-Razorpay-Signature")

    # 1. Verify Signature
    try:
        expected_signature = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        if received_signature != expected_signature:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    except Exception:
        raise HTTPException(status_code=400, detail="Signature verification error")

    data = await request.json()
    event = data.get("event")

    # 2. Handle Payment Captured (One-time payments)
    if event == "payment.captured":
        payment_entity = data["payload"]["payment"]["entity"]
        payment_id = payment_entity["id"]
        order_id = payment_entity["order_id"]
        amount = payment_entity["amount"] // 100
        notes = payment_entity.get("notes", {})

        user_id = notes.get("user_id")
        plan_name = notes.get("plan_name")

        if not user_id or not plan_name:
            return {"status": "ignored_missing_meta"}

        expiry_date = calculate_expiry(plan_name)
        existing = col_payments.find_one({"payment_id": payment_id})
        mail_already_sent = existing and existing.get("payment_success_mail_sent", False)

        col_payments.update_one(
            {"payment_id": payment_id},
            {
                "$set": {
                    "user_id": user_id,
                    "order_id": order_id,
                    "plan_name": plan_name,
                    "amount": amount,
                    "currency": "INR",
                    "status": "success",
                    "expiry_date": expiry_date,
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "created_at": datetime.utcnow(),
                    "payment_success_mail_sent": False,
                    "expiry_mail_2days_sent": False,
                    "expiry_mail_today_sent": False,
                }
            },
            upsert=True
        )

        if not mail_already_sent:
            uid = normalize_user_id(user_id)
            try:
                send_payment_success_mail(
                    user_id=uid,
                    plan_name=plan_name,
                    amount=amount,
                    expiry_date=expiry_date
                )
                col_payments.update_one(
                    {"payment_id": payment_id},
                    {"$set": {"payment_success_mail_sent": True}}
                )
            except Exception as e:
                print(f"❌ Webhook mail error: {e}")

            try:
                send_user_notification(
                    user_id=uid,
                    notif_type="payment_success",
                    title="Payment Received",
                    message=f"Your {plan_name} plan has been confirmed via bank.",
                    related_id=payment_id
                )
            except Exception as e:
                print(f"❌ Webhook notification error: {e}")

    # 3. Handle Subscription Events (Autopay)
    elif event == "subscription.activated":
        sub = data["payload"]["subscription"]["entity"]
        user_id = sub["notes"].get("user_id")
        plan = sub["notes"].get("plan")

        if not user_id or not plan:
            return {"status": "ignored_missing_meta"}

        col_payments.update_one(
            {"subscription_id": sub["id"]},
            {"$set": {
                "user_id": user_id,
                "autopay": True,
                "subscription_status": "active",
                "plan_name": plan,
                "expiry_date": calculate_expiry(plan),
                "updated_at": datetime.utcnow()
            }}
        )

        uid = normalize_user_id(user_id)
        send_user_notification(
            user_id=uid,
            notif_type="subscription_active",
            title="Autopay Activated",
            message=f"Autopay for {plan} is now active.",
            related_id=sub["id"]
        )

    elif event == "invoice.paid":
        invoice = data["payload"]["invoice"]["entity"]
        sub_id = invoice["subscription_id"]
        amount_paid = invoice["amount_paid"] // 100

        payment = col_payments.find_one({"subscription_id": sub_id})

        if payment:
            plan = payment.get("plan_name")
            user_id = payment.get("user_id")

            # ✅ LOGIC PRESERVED FROM INPUT
            old_expiry = payment.get("expiry_date")
            base_date = (
                old_expiry
                if old_expiry and old_expiry > datetime.utcnow()
                else datetime.utcnow()
            )
            new_expiry = base_date + timedelta(days=PLAN_CONFIG[plan]["days"])

            col_payments.update_one(
                {"subscription_id": sub_id},
                {
                    "$set": {
                        "status": "success",
                        "expiry_date": new_expiry,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            if user_id:
                uid = normalize_user_id(user_id)
                send_user_notification(
                    user_id=uid,
                    notif_type="subscription_renewed",
                    title="Plan Renewed",
                    message=f"Your {plan} plan renewed. Amount: ₹{amount_paid}",
                    related_id=invoice["id"]
                )
                try:
                    send_payment_success_mail(
                        user_id=uid,
                        plan_name=plan,
                        amount=amount_paid,
                        expiry_date=new_expiry
                    )
                except Exception as e:
                    print(f"❌ Renewal mail error: {e}")

    elif event == "subscription.cancelled":
        sub = data["payload"]["subscription"]["entity"]
        payment = col_payments.find_one({"subscription_id": sub["id"]})

        col_payments.update_one(
            {"subscription_id": sub["id"]},
            {
                "$set": {
                    "autopay": False,
                    "subscription_status": "cancelled",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        if payment and payment.get("user_id"):
            uid = normalize_user_id(payment["user_id"])
            send_user_notification(
                user_id=uid,
                notif_type="subscription_cancelled",
                title="Autopay Cancelled",
                message="Your subscription has been cancelled.",
                related_id=sub["id"]
            )

    return {"status": "ok"}