def load_history(cursor, conversation_id):
    cursor.execute("""
        SELECT role, content
        FROM message
        WHERE "conversationId"=%s
        ORDER BY "createdAt" ASC
        LIMIT 20
    """, (conversation_id,))

    return cursor.fetchall()