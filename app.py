from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from services.income_service import IncomeService
from services.expense_service import ExpenseService
from services.auth_service import AuthService
from pathlib import Path
from schemas.movement_schema import MovementRequest
from database.connection import engine
from database.models import Base
from services.movement_service import MovementService

income_service = IncomeService()
movement_service = MovementService()
expense_service = ExpenseService()

app = FastAPI()

Base.metadata.create_all(bind=engine)

BASE_DIR = Path(__file__).resolve().parent

# STATIC
app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR / "static")),
    name="static"
)

# TEMPLATES
templates = Jinja2Templates(
    directory=str(BASE_DIR / "templates")
)
templates.env.cache = {}

auth_service = AuthService()

# MODELOS
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

# ── cabeceras anti-caché ──────────────────────────────────────
def no_cache(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# RUTAS HTML
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    resp = templates.TemplateResponse("index.html", {"request": request})
    return no_cache(resp)

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    resp = templates.TemplateResponse("dashboard.html", {"request": request})
    return no_cache(resp)

@app.get("/reset-password", response_class=HTMLResponse)
async def reset_password_page(request: Request):
    token = request.query_params.get("token", "")
    resp = templates.TemplateResponse("reset_password.html", {"request": request, "token": token})
    return no_cache(resp)

# API AUTH
@app.post("/api/login")
def login(data: LoginData):
    return auth_service.login(data)

@app.post("/api/register")
def register(data: RegisterData):
    return auth_service.register(data)

@app.post("/api/logout")
def logout():
    # El logout real lo hace el frontend limpiando localStorage.
    # Este endpoint existe para que pueda llamarse semánticamente.
    return {"message": "Sesión cerrada"}

@app.post("/api/forgot-password")
def forgot_password(data: ForgotPasswordData):
    return auth_service.forgot_password(data.email)

@app.post("/api/reset-password")
def reset_password(data: ResetPasswordData):
    return auth_service.reset_password(data.token, data.new_password)

# API MOVIMIENTOS
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
