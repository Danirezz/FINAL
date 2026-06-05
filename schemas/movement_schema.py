from pydantic import BaseModel
from typing import Optional


class MovementRequest(BaseModel):
    type:        str
    amount:      float
    category:    str
    description: str
    user_email:  str
    date:        Optional[str] = None   # formato YYYY-MM-DD
