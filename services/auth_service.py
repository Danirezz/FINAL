from sqlalchemy.orm import Session
from database.connection import SessionLocal
from database.models import User
from factories.user_factory import UserFactory
from strategies.sha256_strategy import SHA256Strategy
from decorators.log_decorator import log_action
from fastapi import HTTPException
from observers.user_subject import UserSubject
from observers.email_observer import EmailObserver
from observers.logger_observer import LoggerObserver

import secrets
import re


class AuthService:

    def __init__(self):

        self.db: Session = SessionLocal()

        self.hash_strategy = SHA256Strategy()

        self.subject = UserSubject()

        self.subject.attach(EmailObserver())
        self.subject.attach(LoggerObserver())

    def valid_email(self, email):

        pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"

        return re.match(pattern, email)

    def valid_username(self, name):

        return len(name) >= 3 and name.isalnum()

    def valid_password(self, password):

        return (
            len(password) >= 8
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)
        )

    @log_action
    def register(self, data):

        if not self.valid_email(data.email):
            raise HTTPException(
            status_code=400,
            detail="Correo inválido"
            )

        if not self.valid_username(data.name):
            raise HTTPException(
            status_code=400,
            detail="Nombre inválido"
            )

        if not self.valid_password(data.password):
            raise HTTPException (
                status_code=400,
                detail="La contraseña debe tener 8 caracteres, una mayúscula y un número"
            )

        existing_user = (
            self.db.query(User)
            .filter(User.email == data.email)
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Usuario ya existe"
            )   

        hashed_password = self.hash_strategy.hash(data.password)

        user_data = UserFactory.create(
            data.name,
            data.email,
            hashed_password
        )

        new_user = User(
            name=user_data["name"],
            email=user_data["email"],
            password=user_data["password"]
        )

        self.db.add(new_user)

        self.db.commit()

        self.db.refresh(new_user)

        self.subject.notify(user_data)

        return {"message": "Usuario registrado"}

    @log_action
    def login(self, data):

        user = (
            self.db.query(User)
            .filter(User.email == data.email)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )

        hashed_password = self.hash_strategy.hash(data.password)

        if user.password != hashed_password:
            raise HTTPException(
                status_code=401,
                detail="Contraseña incorrecta"
            )

        token = secrets.token_hex(32)

        return {
            "access_token": token,
            "user": {
                "name": user.name,
                "email": user.email
            }
        }