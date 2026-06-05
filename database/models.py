from sqlalchemy import Column, Integer, String, Float, ForeignKey
from database.connection import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    password = Column(String)
    verified = Column(Integer, default=0)

    movements = relationship("Movement", backref="user")
    
class Movement(Base):
    __tablename__ = "movements"

    id = Column(Integer, primary_key=True)
    type = Column(String)
    amount = Column(Float)
    category = Column(String)
    description = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))