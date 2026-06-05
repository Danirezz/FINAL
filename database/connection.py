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
    """Agrega columnas/tablas nuevas sin borrar datos existentes."""
    with engine.connect() as conn:
        # Columna date en movements
        try:
            conn.execute(text("ALTER TABLE movements ADD COLUMN date TEXT"))
            conn.commit()
            print("[DB] Columna 'date' agregada a movements")
        except Exception:
            pass

        # Tabla reset_tokens
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS reset_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    token TEXT UNIQUE NOT NULL,
                    email TEXT NOT NULL,
                    expires_at REAL NOT NULL
                )
            """))
            conn.commit()
            print("[DB] Tabla 'reset_tokens' verificada")
        except Exception:
            pass
