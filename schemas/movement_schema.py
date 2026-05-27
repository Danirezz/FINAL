from pydantic import BaseModel

class MovementRequest(BaseModel):

    type: str
    amount: float
    category: str
    description: str
    user_email: str