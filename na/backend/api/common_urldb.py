from dotenv import load_dotenv
import os
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.getenv("MONGODB_URL")
client = MongoClient(MONGO_URL)
db = client["office"]
