from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from services.auth_service import AuthService

from pathlib import Path

app = FastAPI()

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