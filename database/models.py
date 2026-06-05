from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
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
    type        = Column(String)
    amount      = Column(Float)
    category    = Column(String)
    description = Column(String)
    date        = Column(String, nullable=True)
    user_id     = Column(Integer, ForeignKey("users.id"))


class ResetToken(Base):
    __tablename__ = "reset_tokens"

    id         = Column(Integer, primary_key=True)
    token      = Column(String, unique=True, index=True)
    email      = Column(String)
    expires_at = Column(Float)   # timestamp Unix
