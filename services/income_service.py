from database.connection import SessionLocal
from database.models import User, Movement
from fastapi import HTTPException


class IncomeService:

    def create(self, data):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == data.user_email).first()
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            movement = Movement(
                type="ingreso",
                amount=abs(data.amount),
                category=data.category,
                description=data.description,
                date=getattr(data, 'date', None),
                user_id=user.id
            )
            db.add(movement)
            db.commit()
            db.refresh(movement)
            return {"message": "Ingreso registrado"}
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db.close()
