from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from database.connection import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True)
    name     = Column(String)
    email    = Column(String, unique=True)
    password = Column(String)
    verified = Column(Integer, default=0)

    movements = relationship("Movement", backref="user", cascade="all, delete-orphan")


class Movement(Base):
    __tablename__ = "movements"

    id          = Column(Integer, primary_key=True)
    type        = Column(String)    # 'ingreso' | 'gasto'
    amount      = Column(Float)     # siempre positivo
    category    = Column(String)
    description = Column(String)
    date        = Column(String, nullable=True)   # YYYY-MM-DD
    user_id     = Column(Integer, ForeignKey("users.id"))
