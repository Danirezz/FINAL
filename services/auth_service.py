from repositories.user_repository import UserRepository
from factories.user_factory import UserFactory
from strategies.sha256_strategy import SHA256Strategy
from decorators.log_decorator import log_action

from observers.user_subject import UserSubject
from observers.email_observer import EmailObserver
from observers.logger_observer import LoggerObserver

import secrets

class AuthService:

    def __init__(self):

        self.repository = UserRepository()

        self.hash_strategy = SHA256Strategy()

        self.subject = UserSubject()

        self.subject.attach(EmailObserver())
        self.subject.attach(LoggerObserver())

        self.users_file = "data/users.json"

    @log_action
    def register(self, data):

        users = self.repository.get_users(self.users_file)

        if data.email in users:
            return {"error": "Usuario ya existe"}

        hashed_password = self.hash_strategy.hash(data.password)

        user = UserFactory.create(
            data.name,
            data.email,
            hashed_password
        )

        users[data.email] = user

        self.repository.save_users(self.users_file, users)

        self.subject.notify(user)

        return {"message": "Usuario registrado"}

    @log_action
    def login(self, data):

        users = self.repository.get_users(self.users_file)

        user = users.get(data.email)

        if not user:
            return {"error": "Usuario no encontrado"}

        hashed_password = self.hash_strategy.hash(data.password)

        if user["password"] != hashed_password:
            return {"error": "Contraseña incorrecta"}

        token = secrets.token_hex(32)

        return {
            "access_token": token,
            "user": {
                "name": user["name"],
                "email": user["email"]
            }
        }