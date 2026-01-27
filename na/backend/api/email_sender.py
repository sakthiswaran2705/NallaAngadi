import os
import smtplib
from email.mime.text import MIMEText
from mail_settings import EMAILADDRESS,EMAILPASSWORD



FROM_EMAIL = EMAILADDRESS
APP_PASSWORD = EMAILPASSWORD

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


def send_email(to_email: str, subject: str, body: str):
    try:
        msg = MIMEText(body, "html")

        msg["From"] = FROM_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(FROM_EMAIL, APP_PASSWORD)
        server.send_message(msg)
        server.quit()



    except Exception as e:
        print("❌ Mail error:", e)

