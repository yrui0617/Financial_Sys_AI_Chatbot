from fastapi import APIRouter
from server.api.chatbot.db import get_connection

router = APIRouter()

# GET conversations
@router.get("/conversation")
def get_conversations(userId: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT "id", "title", "createdAt"
        FROM conversation
        WHERE "userId" = %s
        ORDER BY "updatedAt" DESC
    """, (userId,))

    data = cursor.fetchall()
    conn.close()

    return {"data": data}


# CREATE conversation
@router.post("/conversation")
def create_conversation(body: dict):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO conversation ("userId", title, "createdAt", "updatedAt")
        VALUES (%s, %s, NOW(), NOW())
        RETURNING id
    """, (body["userId"], body["title"]))

    conversation_id = cursor.fetchone()["id"]

    conn.commit()
    conn.close()

    return {"conversationId": conversation_id}

# UPDATE conversation title
@router.put("/conversation/title")
def update_conversation_title(body: dict):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE conversation
        SET title = %s, "updatedAt" = NOW()
        WHERE id = %s
    """, (body["title"], body["conversationId"]))

    conn.commit()
    conn.close()

    return {"message": "Title updated"}


# DELETE conversation and its messages
@router.delete("/conversation/{conversation_id}")
def delete_conversation(conversation_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM message
        WHERE "conversationId" = %s
    """, (conversation_id,))

    cursor.execute("""
        DELETE FROM conversation
        WHERE id = %s
    """, (conversation_id,))

    conn.commit()
    conn.close()

    return {"message": "Conversation deleted"}