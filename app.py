from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json, os, hashlib, secrets, time

app = FastAPI()

# 📁 Rutas
templates = Jinja2Templates(directory="templates")
templates.env.cache = {}

# ⚠️ IMPORTANTE: asegurar que static existe
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

USERS_FILE = "data/users.json"

DEMO_USER = {
    "email": "ejemplo1",
    "name": "Usuario Demo",
    "password": hashlib.sha256("ejemplo1".encode()).hexdigest()
}

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    os.makedirs("data", exist_ok=True)
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class LoginData(BaseModel):
    email: str
    password: str

class RegisterData(BaseModel):
    name: str
    email: str
    password: str

# 🌐 RUTAS HTML
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

# 🔐 API
@app.post("/api/register")
def register(data: RegisterData):
    if data.email == DEMO_USER["email"]:
        raise HTTPException(status_code=400, detail="Correo ya registrado.")

    users = load_users()

    if data.email in users:
        raise HTTPException(status_code=400, detail="Correo ya registrado.")

    users[data.email] = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "created_at": time.time()
    }

    save_users(users)

    return {"message": "Usuario creado"}

@app.post("/api/login")
def login(data: LoginData):
    if data.email == DEMO_USER["email"] and hash_password(data.password) == DEMO_USER["password"]:
        token = secrets.token_hex(32)
        return {"access_token": token, "user": DEMO_USER}

    users = load_users()
    user = users.get(data.email)

    if not user or user["password"] != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas.")

    token = secrets.token_hex(32)

    return {
        "access_token": token,
        "user": {"name": user["name"], "email": user["email"]}
    }