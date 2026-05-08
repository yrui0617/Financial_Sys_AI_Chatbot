from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    userId: int
    message: str
    conversationId: Optional[int] = None
    roles: List[str] = []