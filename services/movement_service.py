from sqlalchemy.orm import Session

from database.connection import SessionLocal
from database.models import User, Movement

from fastapi import HTTPException


class MovementService:

    def __init__(self):

        self.db: Session = SessionLocal()

    def create_movement(self, data):

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
            type=data.type,
            amount=data.amount,
            category=data.category,
            description=data.description,
            user_id=user.id
        )

        self.db.add(movement)

        self.db.commit()

        self.db.refresh(movement)

        return {
            "message": "Movimiento creado"
        }

    def get_user_movements(self, email):

        user = (
            self.db.query(User)
            .filter(User.email == email)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )

        movements = (
            self.db.query(Movement)
            .filter(Movement.user_id == user.id)
            .all()
        )

        return [
            {
                "id": m.id,
                "type": m.type,
                "amount": m.amount,
                "category": m.category,
                "description": m.description
            }
            for m in movements
        ]