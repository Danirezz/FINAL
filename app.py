from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from services.income_service import IncomeService
from services.expense_service import ExpenseService
from services.auth_service import AuthService
from services.mail_service import send_reset_email
from pathlib import Path
from schemas.movement_schema import MovementRequest
from database.connection import engine, run_migrations
from database.models import Base
from services.movement_service import MovementService

income_service   = IncomeService()
movement_service = MovementService()
expense_service  = ExpenseService()
auth_service     = AuthService()

app = FastAPI()
Base.metadata.create_all(bind=engine)
run_migrations()

BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


# ── Helpers ───────────────────────────────────────────────
def no_cache(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"]        = "no-cache"
    response.headers["Expires"]       = "0"
    return response

def render(request: Request, template: str, context: dict = {}):
    """Renderiza template con headers no-cache — compatible con Starlette 0.x y 1.x"""
    ctx = {"request": request, **context}
    try:
        resp = templates.TemplateResponse(request=request, name=template, context=context)
    except TypeError:
        resp = templates.TemplateResponse(template, ctx)
    return no_cache(resp)


# ── Modelos ───────────────────────────────────────────────
class LoginData(BaseModel):
    email: str
    password: str

class RegisterData(BaseModel):
    name: str
    email: str
    password: str

class ForgotPasswordData(BaseModel):
    email: str

class ResetPasswordData(BaseModel):
    token: str
    new_password: str

class ChangePasswordData(BaseModel):
    email: str
    old_password: str
    new_password: str


# ── Rutas HTML ────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return render(request, "index.html")

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return render(request, "dashboard.html")

@app.get("/reset-password", response_class=HTMLResponse)
async def reset_password_page(request: Request):
    return render(request, "reset_password.html")


# ── API Auth ──────────────────────────────────────────────
@app.post("/api/login")
def login(data: LoginData):
    return auth_service.login(data)

@app.post("/api/register")
def register(data: RegisterData):
    return auth_service.register(data)

@app.post("/api/logout")
def logout():
    return {"message": "Sesión cerrada"}

@app.post("/api/forgot-password")
async def forgot_password(data: ForgotPasswordData):
    generic = {"message": "Si el correo está registrado, recibirás un enlace en breve."}
    result  = auth_service.generate_reset_token(data.email)
    if result is None:
        return generic
    token, user_name = result
    try:
        await send_reset_email(data.email, token, user_name)
    except Exception as e:
        print(f"[MAIL ERROR] {e}")
        return {"message": "Error al enviar el correo. Intenta de nuevo más tarde."}
    return generic

@app.post("/api/validate-token")
def validate_token(data: dict):
    token = data.get("token", "")
    try:
        auth_service.validate_reset_token(token)
        return {"valid": True}
    except Exception:
        return {"valid": False}

@app.post("/api/reset-password")
def reset_password(data: ResetPasswordData):
    return auth_service.reset_password(data.token, data.new_password)

@app.post("/api/change-password")
def change_password(data: ChangePasswordData):
    return auth_service.change_password(data.email, data.old_password, data.new_password)


# ── API Movimientos ───────────────────────────────────────
@app.post("/api/income")
def create_income(data: MovementRequest):
    return income_service.create(data)

@app.post("/api/expense")
def create_expense(data: MovementRequest):
    return expense_service.create(data)

@app.post("/api/movements")
def create_movement(data: MovementRequest):
    return movement_service.create_movement(data)

@app.get("/api/movements/{email}")
def get_movements(email: str):
    return movement_service.get_user_movements(email)

@app.put("/api/movements/{movement_id}")
def update_movement(movement_id: int, data: MovementRequest):
    return movement_service.update_movement(movement_id, data)

@app.delete("/api/movements/{movement_id}")
def delete_movement(movement_id: int):
    return movement_service.delete_movement(movement_id)
