from sqlalchemy.orm import Session

from database.connection import SessionLocal
from database.models import User, Movement

from fastapi import HTTPException


class IncomeService:

    def __init__(self):

        self.db: Session = SessionLocal()

    def create(self, data):

        user = (
            self.db.query(User)
            .filter(User.email == data.user_email)
            .first()
        )

        if not user:

            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )

        movement = Movement(

            type="income",

            amount=data.amount,

            category=data.category,

            description=data.description,

            user_id=user.id

        )

        self.db.add(movement)

        self.db.commit()

        self.db.refresh(movement)

        return {
            "message": "Ingreso registrado"
        }