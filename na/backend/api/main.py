from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi import Request
from get_top_rate import router as get_top
# Import Routers
from search_shops import router as search_router
from shop_owner_details import router as owner_router
from searched_detail_showhome import router as searched_detail_router
from offers_city import router as slideshow_router
from offers_list import router as offer_router
from offers_for_every_shop import router as every_shop
# from translate_api import router as translate_router
#from city_creation import router as city
from jobs_get import router as jobs_router
from payments import  router as payment_router
from dotenv import load_dotenv
import os
from uravugal import router as uravugal_router
from otp_mail import router as otp_router
from notifications_setting import router as notification_settings_router
from shop_views import router as shop_views_router
#from account_create_auto import router as account_router
from contact_save import  router as contact_router
import threading
import time
from plan_expire_action import process_expired_plans


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
import warnings
warnings.filterwarnings("ignore", category=UserWarning)


app = FastAPI(
    title="NallaAngadi-Api",
    description="API endpoints for NallaAngadi Application",
    version="1.0.0",
    docs_url="/api/",
    redoc_url=None
)


# -------------------- STATIC FILES --------------------
app.mount("/media", StaticFiles(directory="media"), name="media")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nallaangadi.com",
        "https://www.nallaangadi.com",
        "https://api.nallaangadi.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)







# -------------------- ROUTERS --------------------
app.include_router(search_router)
app.include_router(owner_router)
app.include_router(searched_detail_router)
app.include_router(slideshow_router)
app.include_router(offer_router)
app.include_router(every_shop)
#app.include_router(translate_router)
app.include_router(contact_router)
app.include_router(jobs_router)
app.include_router(payment_router)
app.include_router(uravugal_router)
app.include_router(otp_router)
app.include_router(notification_settings_router)
app.include_router(shop_views_router)
app.include_router(get_top)
# -------------------- ROOT --------------------
@app.get("/")
def root():
    return {"message": "Multiple APIs running!"}


# plan expire
def expiry_background_worker():
    """
    Background job:
    checks expired plans periodically
    """
    while True:
        try:
            print(" Checking expired plans...")
            process_expired_plans()
        except Exception as e:
            print(" Expiry worker error:", e)

        #time.sleep(60)  #every 1 minute
        time.sleep(300)    #every 5 minutes


@app.on_event("startup")
def start_expiry_worker():
    print(" Starting plan expiry background worker")
    thread = threading.Thread(
        target=expiry_background_worker,
        daemon=True
    )
    thread.start()
