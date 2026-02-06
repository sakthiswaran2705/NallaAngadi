from datetime import datetime, timedelta
from bson import ObjectId
from common_urldb import db
import smtplib
from email.mime.text import MIMEText
from mail_settings import EMAILADDRESS, EMAILPASSWORD


col_payments = db["payments"]
col_users = db["user"]
col_offers = db["offers"]


FROM_EMAIL = EMAILADDRESS
APP_PASSWORD = EMAILPASSWORD

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


def send_mail(to_email: str, subject: str, body: str):
    try:
        msg = MIMEText(body, "html")

        msg["From"] = FROM_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(FROM_EMAIL, APP_PASSWORD)
        server.send_message(msg)
        server.quit()




    except Exception as e:
        print("❌ Mail error:", e)


def is_payment_email_enabled(user: dict) -> bool:
    settings = user.get("notification_settings")

    # DEFAULT LOGIC
    # If settings not present → email is ON
    if not settings:
        return True

    return settings.get("email", True)


def send_payment_success_mail(user_id, plan_name, amount, expiry_date):

    print("📧 PAYMENT MAIL FUNCTION HIT")
    print("👉 RAW user_id:", user_id)

    # ✅ HARD ObjectId FIX
    try:
        uid = user_id if isinstance(user_id, ObjectId) else ObjectId(str(user_id))
    except Exception as e:
        print("❌ Invalid user_id:", e)
        return

    user = col_users.find_one({"_id": uid})
    if not user:
        print("❌ User not found")
        return

    if not user.get("email"):
        print("❌ User email missing")
        return

    # 🚫 TEMPORARILY DISABLE notification block
    # (THIS IS THE MAIN SILENT KILLER)
    # if not is_payment_email_enabled(user):
    #     print("🔕 Email disabled in settings")
    #     return

    if isinstance(expiry_date, str):
        expiry_date = datetime.fromisoformat(expiry_date)

    body = f"""
    <html>
      <body>
        <p><b>Payment Successful 🎉</b></p>
        <p>Plan: {plan_name.upper()}</p>
        <p>Amount: ₹{amount}</p>
        <p>Valid Till: {expiry_date.strftime('%d-%m-%Y')}</p>
        <p>Thank you for choosing <b>NallaAngadi</b></p>
      </body>
    </html>
    """

    send_mail(
        user["email"],
        "Payment Successful - NallaAngadi",
        body
    )

    print("✅ PAYMENT MAIL SENT TO:", user["email"])


def send_expiry_mail(to_email, plan_name, expiry_date, when):
    if when == "2days":
        subject = "Your Plan Will Expire in 2 Days"
        line = "will expire in 2 days"
    else:
        subject = "Your Plan Expires Today"
        line = "expires today"

    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif;">
        <p>Hello,</p>

        <p>
          Your <b>{plan_name.upper()}</b> plan {line}.<br/>
          Expiry Date: <b>{expiry_date.strftime('%d-%m-%Y')}</b>
        </p>

        <p>Please renew your plan to continue uninterrupted service.</p>

        <p>Regards,<br/>NallaAngadi Team</p>
      </body>
    </html>
    """

    send_mail(to_email, subject, body)


def check_plan_expiry_and_send_mail():
    now = datetime.utcnow()

    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_today = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    start_2days = (now + timedelta(days=2)).replace(hour=0, minute=0, second=0, microsecond=0)
    end_2days = (now + timedelta(days=2)).replace(hour=23, minute=59, second=59, microsecond=999999)

    payments = col_payments.find({"status": "success"})

    for pay in payments:
        user_id = pay.get("user_id")
        if not user_id:
            continue

        try:
            uid = ObjectId(user_id) if isinstance(user_id, str) else user_id
        except:
            continue

        user = col_users.find_one({"_id": uid})
        if not user or not user.get("email"):
            continue

        email = user["email"]

        if (
            start_2days <= pay["expiry_date"] <= end_2days
            and not pay.get("expiry_mail_2days_sent")
        ):
            send_expiry_mail(
                email,
                pay["plan_name"],
                pay["expiry_date"],
                "2days"
            )

            col_payments.update_one(
                {"_id": pay["_id"]},
                {"$set": {"expiry_mail_2days_sent": True}}
            )

        # ---------------- EXPIRY DAY ----------------
        if (
            start_today <= pay["expiry_date"] <= end_today
            and not pay.get("expiry_mail_today_sent")
        ):
            send_expiry_mail(
                email,
                pay["plan_name"],
                pay["expiry_date"],
                "today"
            )

            col_payments.update_one(
                {"_id": pay["_id"]},
                {"$set": {"expiry_mail_today_sent": True}}
            )

def send_offer_expiry_mail(user: dict, offer_title: str, expiry_date, when: str):
    # respect notification settings
    if not is_payment_email_enabled(user):
        print("🔕 Offer expiry mail disabled for:", user.get("email"))
        return

    if isinstance(expiry_date, str):
        expiry_date = datetime.fromisoformat(expiry_date)

    if when == "3days":
        subject = "⏰ Your Offer Will Expire in 3 Days"
        line = "will expire in 3 days"
    else:
        subject = "⛔ Your Offer Expires Today"
        line = "expires today"

    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif;">
        <p>Hello,</p>

        <p>
          Your offer <b>{offer_title}</b> {line}.<br/>
          Expiry Date: <b>{expiry_date.strftime('%d-%m-%Y')}</b>
        </p>

        <p>
          Please login to repost or create a new offer.
        </p>

        <p>Regards,<br/>NallaAngadi Team</p>
      </body>
    </html>
    """

    send_mail(
        user["email"],
        subject,
        body
    )

    print("✅ Offer expiry mail sent to:", user["email"])
def check_offer_expiry_and_send_mail():
    now = datetime.utcnow()

    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_today = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    start_3days = (now + timedelta(days=3)).replace(hour=0, minute=0, second=0, microsecond=0)
    end_3days = (now + timedelta(days=3)).replace(hour=23, minute=59, second=59, microsecond=999999)

    shops = col_offers.find({"offers.expiry_date": {"$exists": True}})

    for shop in shops:
        user_id = shop.get("user_id")
        if not user_id:
            continue

        try:
            uid = ObjectId(user_id) if isinstance(user_id, str) else user_id
        except:
            continue

        user = col_users.find_one({"_id": uid})
        if not user or not user.get("email"):
            continue

        for offer in shop.get("offers", []):
            expiry = offer.get("expiry_date")
            if not expiry:
                continue

            # ✅ FORCE datetime
            if isinstance(expiry, str):
                try:
                    expiry = datetime.fromisoformat(expiry)
                except Exception as e:
                    print("❌ Invalid expiry format:", expiry, e)
                    continue

            # -------- 3 DAYS BEFORE --------
            if (
                start_3days <= expiry <= end_3days
                and not offer.get("expiry_mail_3days_sent")
            ):
                send_offer_expiry_mail(
                    user,
                    offer.get("title", "Your Offer"),
                    expiry,
                    "3days"
                )

                col_offers.update_one(
                    {"shop_id": shop["shop_id"], "offers.offer_id": offer["offer_id"]},
                    {"$set": {"offers.$.expiry_mail_3days_sent": True}}
                )

            # -------- EXPIRY DAY --------
            if (
                start_today <= expiry <= end_today
                and not offer.get("expiry_mail_today_sent")
            ):
                send_offer_expiry_mail(
                    user,
                    offer.get("title", "Your Offer"),
                    expiry,
                    "today"
                )

                col_offers.update_one(
                    {"shop_id": shop["shop_id"], "offers.offer_id": offer["offer_id"]},
                    {"$set": {"offers.$.expiry_mail_today_sent": True}}
                )
def send_addon_payment_success_mail(user_id, quantity, amount):


    try:
        uid = ObjectId(user_id) if isinstance(user_id, str) else user_id
    except:
        return

    user = col_users.find_one({"_id": uid})
    if not user or not user.get("email"):
        return

    # Respect notification settings
    if not is_payment_email_enabled(user):
        print("🔕 Addon payment email disabled for:", user.get("email"))
        return

    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hello,</p>

        <p>Your add-on purchase was successful 🎉</p>

        <table cellpadding="6">
          <tr>
            <td><b>Add-on Type</b></td>
            <td>Extra Offers</td>
          </tr>
          <tr>
            <td><b>Quantity</b></td>
            <td>{quantity}</td>
          </tr>
          <tr>
            <td><b>Amount Paid</b></td>
            <td>₹{amount}</td>
          </tr>
        </table>

        <p>
          Your extra offers have been successfully added to your account
          and are ready to use.
        </p>

        <p>
          Thank you for choosing <b>NallaAngadi</b>.
        </p>

        <p>Regards,<br/>NallaAngadi Team</p>
      </body>
    </html>
    """

    send_mail(
        user["email"],
        "Add-on Purchase Successful - NallaAngadi",
        body
    )

    print("✅ Addon payment success mail sent to:", user["email"])

if __name__ == "__main__":
    check_plan_expiry_and_send_mail()
    check_offer_expiry_and_send_mail()
