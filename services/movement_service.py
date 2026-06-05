from database.connection import SessionLocal
from database.models import User, Movement
from fastapi import HTTPException


class MovementService:

    def create_movement(self, data):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == data.user_email).first()
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            tipo = data.type.lower().strip()
            if tipo not in ("ingreso", "gasto"):
                raise HTTPException(status_code=400, detail="Tipo inválido. Use 'ingreso' o 'gasto'")

            movement = Movement(
                type=tipo,
                amount=abs(data.amount),
                category=data.category,
                description=data.description,
                date=getattr(data, 'date', None),
                user_id=user.id
            )
            db.add(movement)
            db.commit()
            db.refresh(movement)
            return {"message": "Movimiento creado"}
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db.close()

    def get_user_movements(self, email: str):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            movements = (
                db.query(Movement)
                .filter(Movement.user_id == user.id)
                .order_by(Movement.id.desc())
                .all()
            )
            return [
                {
                    "id":          m.id,
                    "type":        m.type,
                    "amount":      m.amount,
                    "category":    m.category,
                    "description": m.description,
                    "date":        m.date
                }
                for m in movements
            ]
        except HTTPException:
            raise
        finally:
            db.close()

    def update_movement(self, movement_id: int, data):
        db = SessionLocal()
        try:
            movement = db.query(Movement).filter(Movement.id == movement_id).first()
            if not movement:
                raise HTTPException(status_code=404, detail="Movimiento no encontrado")

            tipo = data.type.lower().strip()
            if tipo not in ("ingreso", "gasto"):
                raise HTTPException(status_code=400, detail="Tipo inválido")

            movement.type        = tipo
            movement.amount      = abs(data.amount)
            movement.category    = data.category
            movement.description = data.description
            movement.date        = getattr(data, 'date', movement.date)
            db.commit()
            db.refresh(movement)
            return {"message": "Movimiento actualizado"}
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db.close()

    def delete_movement(self, movement_id: int):
        db = SessionLocal()
        try:
            movement = db.query(Movement).filter(Movement.id == movement_id).first()
            if not movement:
                raise HTTPException(status_code=404, detail="Movimiento no encontrado")
            db.delete(movement)
            db.commit()
            return {"message": "Movimiento eliminado"}
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db.close()
