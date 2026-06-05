from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os

if os.getenv("WEBSITE_HOSTNAME"):
    DATABASE_URL = "sqlite:////home/site/wwwroot/app.db"
else:
    DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def run_migrations():
    """Agrega columnas nuevas a tablas existentes sin borrar datos."""
    with engine.connect() as conn:
        # Agregar columna date si no existe
        try:
            conn.execute(text("ALTER TABLE movements ADD COLUMN date TEXT"))
            conn.commit()
            print("[DB] Columna 'date' agregada a movements")
        except Exception:
            pass  # Ya existe, no hacer nada
