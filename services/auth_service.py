from database.connection import SessionLocal
from database.models import User, ResetToken
from factories.user_factory import UserFactory
from strategies.sha256_strategy import SHA256Strategy
from decorators.log_decorator import log_action
from fastapi import HTTPException
from observers.user_subject import UserSubject
from observers.email_observer import EmailObserver
from observers.logger_observer import LoggerObserver

import secrets
import re
import time


class AuthService:

    def __init__(self):
        self.hash_strategy = SHA256Strategy()
        self.subject = UserSubject()
        self.subject.attach(EmailObserver())
        self.subject.attach(LoggerObserver())

    def valid_email(self, email):
        return re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email)

    def valid_username(self, name):
        return len(name) >= 3

    def valid_password(self, password):
        return (
            len(password) >= 8
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)
        )

    @log_action
    def register(self, data):
        if not self.valid_email(data.email):
            raise HTTPException(status_code=400, detail="Correo inválido")
        if not self.valid_username(data.name):
            raise HTTPException(status_code=400, detail="Nombre inválido (mínimo 3 caracteres)")
        if not self.valid_password(data.password):
            raise HTTPException(status_code=400,
                detail="La contraseña debe tener 8 caracteres, una mayúscula y un número")

        db = SessionLocal()
        try:
            if db.query(User).filter(User.email == data.email).first():
                raise HTTPException(status_code=409, detail="Usuario ya existe")
            hashed    = self.hash_strategy.hash(data.password)
            user_data = UserFactory.create(data.name, data.email, hashed)
            new_user  = User(
                name=user_data["name"],
                email=user_data["email"],
                password=user_data["password"]
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            self.subject.notify(user_data)
            return {"message": "Usuario registrado"}
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db.close()

    @log_action
    def login(self, data):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == data.email).first()
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            if user.password != self.hash_strategy.hash(data.password):
                raise HTTPException(status_code=401, detail="Contraseña incorrecta")
            token = secrets.token_hex(32)
            return {"access_token": token, "user": {"name": user.name, "email": user.email}}
        except HTTPException:
            raise
        finally:
            db.close()

    # ── Recuperación de contraseña ─────────────────────────

    def generate_reset_token(self, email: str):
        """Genera token y lo guarda en BD (persiste entre reinicios)."""
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return None

            # Borrar tokens anteriores del mismo usuario
            db.query(ResetToken).filter(ResetToken.email == email).delete()
            db.commit()

            token = secrets.token_urlsafe(48)
            rt = ResetToken(
                token=token,
                email=email,
                expires_at=time.time() + 1800  # 30 minutos
            )
            db.add(rt)
            db.commit()
            return token, user.name
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db.close()

    def validate_reset_token(self, token: str):
        """Valida token desde BD. Retorna email o lanza HTTPException."""
        db = SessionLocal()
        try:
            rt = db.query(ResetToken).filter(ResetToken.token == token).first()
            if not rt:
                raise HTTPException(status_code=400, detail="Token inválido o ya utilizado")
            if time.time() > rt.expires_at:
                db.delete(rt)
                db.commit()
                raise HTTPException(status_code=400, detail="El enlace expiró. Solicita uno nuevo.")
            return rt.email
        except HTTPException:
            raise
        finally:
            db.close()

    def reset_password(self, token: str, new_password: str):
        if not self.valid_password(new_password):
            raise HTTPException(status_code=400,
                detail="La contraseña debe tener 8 caracteres, una mayúscula y un número")

        db = SessionLocal()
        try:
            rt = db.query(ResetToken).filter(ResetToken.token == token).first()
            if not rt:
                raise HTTPException(status_code=400, detail="Token inválido o ya utilizado")
            if time.time() > rt.expires_at:
                db.delete(rt)
                db.commit()
                raise HTTPException(status_code=400, detail="El enlace expiró. Solicita uno nuevo.")

            user = db.query(User).filter(User.email == rt.email).first()
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            user.password = self.hash_strategy.hash(new_password)
            db.delete(rt)  # invalidar token tras uso
            db.commit()
            return {"message": "Contraseña actualizada correctamente"}
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db.close()

    def change_password(self, email: str, old_password: str, new_password: str):
        if not self.valid_password(new_password):
            raise HTTPException(status_code=400,
                detail="La contraseña debe tener 8 caracteres, una mayúscula y un número")

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            if user.password != self.hash_strategy.hash(old_password):
                raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
            user.password = self.hash_strategy.hash(new_password)
            db.commit()
            return {"message": "Contraseña actualizada correctamente"}
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db.close()
