import os

# ── Correo ────────────────────────────────────────────────
MAIL_USERNAME  = os.getenv("MAIL_USERNAME",  "wbills.app.co@gmail.com")
MAIL_PASSWORD  = os.getenv("MAIL_PASSWORD",  "eenh xiwd kwqg wsot")
MAIL_FROM      = os.getenv("MAIL_FROM",      "wbills.app.co@gmail.com")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "WBill$")
MAIL_SERVER    = os.getenv("MAIL_SERVER",    "smtp.gmail.com")
MAIL_PORT      = int(os.getenv("MAIL_PORT",  "587"))
MAIL_SSL_TLS   = False   # puerto 587 usa STARTTLS, no SSL directo
MAIL_STARTTLS  = True

# ── App ───────────────────────────────────────────────────
APP_URL = os.getenv("APP_URL", "https://app-gastos-personales.azurewebsites.net")
