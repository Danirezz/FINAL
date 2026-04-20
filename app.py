from fastapi import FastAPI

app = FastAPI()

@app.get("/") 
def home(): 
    return {"mensaje": "Mi API final va EXCELENTE"}

@app.get("/eventos") 
def listar_eventos(): 
    return {"eventos": ["Proyecto Desarrollo de Software"]}  