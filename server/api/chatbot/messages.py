from fastapi import APIRouter
from server.api.chatbot.db import get_connection

router = APIRouter()

@router.get("/messages")
def get_messages(conversationId: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, role, content, "createdAt"
        FROM message
        WHERE "conversationId" = %s
        ORDER BY "createdAt" ASC
    """, (conversationId,))

    data = cursor.fetchall()
    conn.close()

    return {"data": data}