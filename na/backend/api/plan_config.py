# ================= PLAN CONFIG =================
PLAN_CONFIG = {

    "starter": {
        "price": 0,
        "amount": 0,
        "currency": "INR",
        "days": None,
        "shops": 1,
        "offers": 0,
        "unlimited_search": True,
        "unlimited_jobs": True,
        "reports": False,
        "autopay": None
    },

    "silver": {
        "price": 1,       # ₹ (UI)
        "amount": 20000,    # ✅ paise (Razorpay)
        "currency": "INR",
        "days": 30,
        "shops": 2,
        "offers": 1,
        "offers_period": "monthly",
        "unlimited_search": False,
        "unlimited_jobs": True,
        "reports": True,

        "autopay": {
            "period": "monthly",
            "interval": 1,
            "amount": 20000,
            "razorpay_plan_id": "plan_SCq7atHDxZ81mD"
        }
    },

    "gold": {
        "price": 500,
        "amount": 50000,    # ✅
        "currency": "INR",
        "days": 90,
        "shops": 4,
        "offers": 2,
        "offers_period": "monthly",
        "unlimited_search": False,
        "unlimited_jobs": True,
        "reports": True,

        "autopay": {
            "period": "monthly",
            "interval": 3,
            "amount": 50000,
            "razorpay_plan_id": "plan_SCqFVhp6FLHHi2"
        }
    },

    "platinum": {
        "price": 900,
        "amount": 90000,    # ✅
        "currency": "INR",
        "days": 210,
        "shops": 8,
        "offers": 3,
        "offers_period": "monthly",
        "unlimited_search": True,
        "unlimited_jobs": True,
        "reports": True,

        "autopay": {
            "period": "monthly",
            "interval": 7,
            "amount": 90000,
            "razorpay_plan_id": "plan_SCqGQxVqpRsbRn"
        }
    }
}
