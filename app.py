from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
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

# IMPORTANTE
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

# RUTAS HTML
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request}
    )

# API
@app.post("/api/login")
def login(data: LoginData):
    return auth_service.login(data)

@app.post("/api/register")
def register(data: RegisterData):
    return auth_service.register(data)

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