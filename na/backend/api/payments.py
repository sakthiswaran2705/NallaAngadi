from fastapi import APIRouter, Depends, Body, HTTPException, Request
from datetime import datetime, timedelta
from common_urldb import db
from auth_jwt import verify_token
from dotenv import load_dotenv
from bson import ObjectId

import razorpay
import os
import hmac
import hashlib

from plan_expiry_mail import send_payment_success_mail
from plan_config import PLAN_CONFIG
from notifications_setting import send_user_notification

load_dotenv(override=True)

# RAZORPAY CONFIG
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    raise RuntimeError("Razorpay keys not configured")

client = razorpay.Client(
    auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
)

router = APIRouter()

col_payments = db["payments"]
col_shop = db["shop"]
col_offer = db["offers"]
col_notifications = db["notifications"]

ALLOWED_STATUS = ["success", "failed", "pending"]


def normalize_user_id(user_id):
    if isinstance(user_id, ObjectId):
        return user_id
    return ObjectId(user_id)


def get_active_plan(user_id: str):
    payment = col_payments.find_one(
        {
            "user_id": user_id,
            "status": "success",
            "expiry_date": {"$gt": datetime.utcnow()}
        },
        sort=[("created_at", -1)]
    )
    return payment


def calculate_expiry(plan_name):
    if plan_name not in PLAN_CONFIG:
        return datetime.utcnow() + timedelta(days=30)  # Default fallback
    return datetime.utcnow() + timedelta(days=PLAN_CONFIG[plan_name]["days"])


# ==================================================
# PAYMENT API ENDPOINTS
# ==================================================

@router.post("/payment/create-order/")
def create_order(
        user_id: str = Depends(verify_token),
        data: dict = Body(...)
):
    try:
        amount = int(data.get("amount", 0))
        plan_name = data.get("plan_name")

        if amount <= 0:
            raise HTTPException(400, "Invalid amount")

        if not plan_name:
            raise HTTPException(400, "Plan name required")

        # Pass user_id and plan_name in notes for Webhook retrieval
        order_data = {
            "amount": amount * 100,  # paise
            "currency": "INR",
            "receipt": f"rcpt_{user_id[:6]}",
            "payment_capture": 1,
            "notes": {
                "user_id": user_id,
                "plan_name": plan_name
            }
        }

        order = client.order.create(order_data)

        return {
            "status": True,
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": "INR",
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
    """
    Frontend calls this for immediate UI updates.
    NOTE: Email sending logic removed from here. Webhook is the source of truth for emails.
    """
    status = data.get("status")
    payment_id = data.get("payment_id")
    order_id = data.get("order_id")
    plan = data.get("plan_name")
    amount = int(data.get("amount", 0))

    if status not in ALLOWED_STATUS:
        raise HTTPException(status_code=400, detail="Invalid payment status")

    if not payment_id or not order_id:
        raise HTTPException(status_code=400, detail="payment_id & order_id required")

    if plan not in PLAN_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid plan")

    expiry_date = calculate_expiry(plan)

    # Upsert payment: If webhook ran first, this updates it. If this runs first, it inserts.
    # We do NOT set 'payment_success_mail_sent' to True here, ensuring Webhook handles it.
    col_payments.update_one(
        {"payment_id": payment_id},
        {
            "$set": {
                "user_id": user_id,
                "order_id": order_id,
                "plan_id": data.get("plan_id"),
                "plan_name": plan,
                "amount": amount,
                "currency": "INR",
                "status": status,
                "message": data.get("message"),
                "expiry_date": expiry_date,
                "updated_at": datetime.utcnow()
            },
            "$setOnInsert": {
                "created_at": datetime.utcnow(),
                "payment_success_mail_sent": False,  # Webhook will check this
                "expiry_mail_2days_sent": False,
                "expiry_mail_today_sent": False,
            }
        },
        upsert=True
    )

    # In-App Notification (Safe to duplicate as lists usually handle latest, or acceptable)
    if status == "success":
        uid = normalize_user_id(user_id)
        send_user_notification(
            user_id=uid,
            notif_type="payment_success",
            title="Payment Successful",
            message=f"Your {plan.upper()} plan is active.",
            related_id=payment_id
        )

    return {
        "status": True,
        "message": "Plan activated",
        "plan": plan,
        "expiry_date": expiry_date
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

        # Extract critical data from notes (Robusy against frontend failure)
        user_id = notes.get("user_id")
        plan_name = notes.get("plan_name")

        if not user_id or not plan_name:
            print(f"⚠️ Webhook: Missing user_id/plan in notes for {payment_id}")
            return {"status": "ignored_missing_meta"}

        expiry_date = calculate_expiry(plan_name)

        # 3. Check/Lock for processing
        existing = col_payments.find_one({"payment_id": payment_id})
        mail_already_sent = existing and existing.get("payment_success_mail_sent", False)

        # 4. Upsert Payment Record
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

        # 5. Send Email Only If Not Sent Yet
        if not mail_already_sent:
            uid = normalize_user_id(user_id)

            # Send Email
            try:
                send_payment_success_mail(
                    user_id=uid,
                    plan_name=plan_name,
                    amount=amount,
                    expiry_date=expiry_date
                )

                # Mark as sent immediately
                col_payments.update_one(
                    {"payment_id": payment_id},
                    {"$set": {"payment_success_mail_sent": True}}
                )
            except Exception as e:
                print(f"❌ Webhook mail error: {e}")

            # Send Notification (Idempotent-ish, or okay to double trigger with frontend)
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

        if user_id and plan:
            col_payments.update_one(
                {"subscription_id": sub["id"]},
                {
                    "$set": {
                        "user_id": user_id,
                        "autopay": True,
                        "subscription_id": sub["id"],
                        "subscription_status": "active",
                        "plan_name": plan,
                        "expiry_date": calculate_expiry(plan),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            # Notification
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
            new_expiry = calculate_expiry(plan)

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
                # Notification
                send_user_notification(
                    user_id=uid,
                    notif_type="subscription_renewed",
                    title="Plan Renewed",
                    message=f"Your {plan} plan renewed. Amount: ₹{amount_paid}",
                    related_id=invoice["id"]
                )
                # Email for Renewal
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


# ==================================================
# USER & STATUS CHECKS
# ==================================================

@router.get("/my-plan/")
def my_plan(user_id: str = Depends(verify_token)):
    payment = get_active_plan(user_id)
    if not payment:
        return {"status": True, "subscribed": False}

    plan = payment["plan_name"]
    # Fallback if config changed
    if plan not in PLAN_CONFIG:
        return {"status": True, "subscribed": False, "message": "Plan config missing"}

    limits = PLAN_CONFIG[plan]
    shop_used = col_shop.count_documents({"user_id": user_id})
    offer_used = col_offer.count_documents({"user_id": user_id})

    return {
        "status": True,
        "subscribed": True,
        "plan": plan,
        "limits": limits,
        "usage": {
            "shops_used": shop_used,
            "offers_used": offer_used,
            "shops_left": max(0, limits["shops"] - shop_used),
            "offers_left": max(0, limits["offers"] - offer_used)
        },
        "expiry_date": payment.get("expiry_date")
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
# AUTOPAY SETUP & HELPERS
# ==================================================

def check_shop_limit(user_id: str):
    payment = get_active_plan(user_id)
    if not payment:
        raise HTTPException(403, "Please subscribe to add shops")
    plan = payment["plan_name"]
    limit = PLAN_CONFIG[plan]["shops"]
    if col_shop.count_documents({"user_id": user_id}) >= limit:
        raise HTTPException(403, f"{plan.capitalize()} plan allows only {limit} shops")


def check_offer_limit(user_id: str):
    payment = get_active_plan(user_id)
    if not payment:
        raise HTTPException(403, "Please subscribe to add offers")
    plan = payment["plan_name"]
    limit = PLAN_CONFIG[plan]["offers"]
    if col_offer.count_documents({"user_id": user_id}) >= limit:
        raise HTTPException(403, f"{plan.capitalize()} plan allows only {limit} offers")


@router.post("/autopay/create/")
def create_autopay(
        user_id: str = Depends(verify_token),
        data: dict = Body(...)
):
    plan = data.get("plan_name")
    if plan not in PLAN_CONFIG:
        raise HTTPException(400, "Invalid plan")

    sub = client.subscription.create({
        "plan_id": PLAN_CONFIG[plan]["autopay"]["razorpay_plan_id"],
        "customer_notify": 1,
        "total_count": 12,
        "notes": {"user_id": user_id, "plan": plan}
    })

    return {"status": True, "subscription_id": sub["id"]}


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
            print("Razorpay cancel error:", e)

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
        "notes": {"user_id": user_id, "plan": new_plan}
    })

    col_payments.insert_one({
        "user_id": user_id,
        "subscription_id": sub["id"],
        "plan_name": new_plan,
        "autopay": True,
        "subscription_status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })

    # Notification ONLY (Change event)
    uid = normalize_user_id(user_id)
    send_user_notification(
        user_id=uid,
        notif_type="plan_changed",
        title="Plan Changed",
        message=f"Switched to {new_plan}. Next bill will reflect this.",
        related_id=sub["id"]
    )

    return {
        "status": True,
        "message": f"Plan changed successfully. Next billing will use {new_plan} plan.",
        "subscription_id": sub["id"]
    }