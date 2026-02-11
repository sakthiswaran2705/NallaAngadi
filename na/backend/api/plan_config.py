# ================= PLAN CONFIG =================
PLAN_CONFIG = {

    # ================= PLANS =================
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
        "price": 200,
        "amount": 20000,
        "currency": "INR",
        "days": 30,
        "shops": 1,
        "offers": 1,
        "offers_period": "monthly",
        "unlimited_search": False,
        "unlimited_jobs": True,
        "reports": True,
        "autopay": {
            "period": "monthly",
            "interval": 1,
            "amount": 20000,
            "razorpay_plan_id": "plan_SD8sp6u0UQI8YV"
        }
    },

    "gold": {
        "price": 500,
        "amount": 50000,
        "currency": "INR",
        "days": 90,
        "shops": 1,
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
        "amount": 90000,
        "currency": "INR",
        "days": 210,
        "shops": 1,
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
    },

    # ================= ADDONS =================
    "addons": {

        # -------- EXTRA OFFER --------
        "extra_offer": {
            "label": "Extra Offer",
            "unit": "offer",
            "price": 50,           # UI ₹
            "amount": 5000,        # paise
            "stackable": True,

        },

        "extra_shop": {
            "label": "Extra Shop",
            "unit": "shop",
            "price": 100,
            "amount": 10000,
            "stackable": True,


        }
    }
}
