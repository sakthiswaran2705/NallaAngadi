from fastapi import APIRouter, Query
from bson import ObjectId
from datetime import datetime
from common_urldb import db

from translator import ta_to_en, en_to_ta
from cache import get_cached, set_cache

router = APIRouter()
col_jobs = db["jobs"]


# ---------------- SAFE OBJECT ----------------
def safe(doc):
    if not doc:
        return None
    for k, v in list(doc.items()):
        if isinstance(v, ObjectId):
            doc[k] = str(v)
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc


# ---------------- TRANSLATION ----------------
def to_en(text):
    if not text:
        return text
    cached = get_cached(f"ta_en:{text}")
    if cached:
        return cached
    try:
        res = ta_to_en(text)
        set_cache(f"ta_en:{text}", res)
        return res
    except:
        return text


def to_ta(text):
    if not text:
        return text
    cached = get_cached(f"en_ta:{text}")
    if cached:
        return cached
    try:
        res = en_to_ta(text)
        set_cache(f"en_ta:{text}", res)
        return res
    except:
        return text


# ===============================
# GET JOBS (PAGINATED)
# ===============================
@router.get("/jobs/")
def get_jobs(
        city_name: str | None = Query(None),
        job_title: str | None = Query(None),
        lang: str = Query("en"),
        page: int = Query(1, ge=1),  # Default page 1, minimum 1
        limit: int = Query(10, ge=1, le=50)  # Default 10 items, max 50
):
    query = {}

    if city_name:
        query["city_name"] = {"$regex": city_name, "$options": "i"}

    if job_title:
        query["job_title"] = {"$regex": job_title, "$options": "i"}

    # --- PAGINATION LOGIC ---
    skip = (page - 1) * limit

    # Apply skip and limit to the cursor
    cursor = col_jobs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    jobs = list(cursor)

    output = []
    for job in jobs:
        job = safe(job)

        # Only translate the 10 items we fetched (Huge performance boost)
        if lang == "ta":
            job["job_title"] = to_ta(job.get("job_title"))
            job["job_description"] = to_ta(job.get("job_description"))
            job["shop_name"] = to_ta(job.get("shop_name"))
            job["address"] = to_ta(job.get("address"))
            job["city_name"] = to_ta(job.get("city_name"))

        output.append(job)

    return {
        "status": True,
        "page": page,
        "limit": limit,
        "count": len(output),
        "jobs": output
    }


# ===============================
# GET SINGLE JOB
# ===============================
@router.get("/job/{job_id}/", operation_id="getJobById")
def get_job_by_id(job_id: str, lang: str = Query("en")):
    try:
        if not ObjectId.is_valid(job_id):
            return {"status": False, "message": "Invalid job id format"}

        job = col_jobs.find_one({"_id": ObjectId(job_id)})
    except Exception as e:
        print(f"Error: {e}")
        return {"status": False, "message": "Error fetching job"}

    if not job:
        return {"status": False, "message": "Job not found"}

    job = safe(job)

    if lang == "ta":
        job["job_title"] = to_ta(job.get("job_title"))
        job["job_description"] = to_ta(job.get("job_description"))
        job["shop_name"] = to_ta(job.get("shop_name"))
        job["address"] = to_ta(job.get("address"))
        job["city_name"] = to_ta(job.get("city_name"))

    return {
        "status": True,
        "job": job
    }