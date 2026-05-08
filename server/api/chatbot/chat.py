from fastapi import APIRouter
from datetime import datetime

from server.api.chatbot.db import get_connection
from server.api.chatbot.models import ChatRequest
from server.api.chatbot.services.groq import call_groq
from server.api.chatbot.services.ollama_remote import call_ollama_remote
from server.api.chatbot.services.ollama import call_ollama
from server.api.chatbot.services.finance import fetch_finance
from server.api.chatbot.services.intent import is_format_followup, resolve_finance_followup
from server.api.chatbot.services.memory import load_history

router = APIRouter()


# ---------------- SAVE MESSAGE ----------------
def save_message(cursor, conversation_id, role, content):
    cursor.execute("""
        INSERT INTO message ("conversationId", "role", "content", "createdAt")
        VALUES (%s, %s, %s, %s)
    """, (conversation_id, role, content, datetime.now()))


# ---------------- GET OR CREATE CONVERSATION ----------------
def get_conversation(cursor, user_id, conversation_id):
    if conversation_id:
        return conversation_id

    cursor.execute("""
        INSERT INTO conversation ("userId", title, "createdAt", "updatedAt")
        VALUES (%s, %s, NOW(), NOW())
    """, (user_id, "New Chat"))

    return cursor.lastrowid

# ---------------- CHAT ENDPOINT ----------------
@router.post("/chat")
def chat(req: ChatRequest):

    conn = get_connection()

    try:
        cursor = conn.cursor()

        user_id = req.userId

        conversation_id = get_conversation(cursor, user_id, req.conversationId)

        save_message(cursor, conversation_id, "user", req.message)

        msg = req.message.lower()

        # ---------------- HISTORY ----------------
        history = load_history(cursor, conversation_id)[-6:]

        filtered_history = []
        seen = set()

        for h in history:
            key = (h['role'], h['content'])
            if key not in seen:
                filtered_history.append(h)
                seen.add(key)

        history_text = "\n".join(
            [f"{h['role']}: {h['content']}" for h in filtered_history]
        )

        # ---------------- FETCH DATA ----------------
        if is_format_followup(req.message):
            data = {}
            data_instruction = (
                "The user is asking to improve or reformat the previous answer. "
                "Use the conversation history and do not run a new finance search."
            )
        else:
            prior_history = filtered_history
            if prior_history and prior_history[-1]["content"] == req.message:
                prior_history = prior_history[:-1]

            finance_msg = resolve_finance_followup(req.message, prior_history)
            data = fetch_finance(cursor, user_id, finance_msg)
            data_instruction = (
                "Use the finance data below. Do not use data that is not present."
            )

        # ---------------- PROMPT ----------------
        prompt = f"""
        You are a financial assistant chatbot.

        STRICT RULES:
        - AMOUNT is in MYR
        - DO NOT create, assume, or invent any data
        - NEVER generate fake examples
        - NEVER guess
        - Be structured and complete
        - If message unclear → reply casually

        OUTPUT RULE:
        - You should show all the data dont hide them
        - Only display sections that contain data
        - Do NOT show empty sections unless explicitly requested
        - If only one category is returned, focus only on that category
        - Keep response concise and relevant
        - Prefer card/list format for small result sets
        - Keep date format readable (08 May 2026, 5:59 PM), Malaysia Time Zone
        - Dont need display the paymentCreatedDate for payment

        FORMAT:
        - Keep response clear and organized
        - Use bullet points, numbering, tables, etc.
        - If the user asks for emojis or one section per bill, apply that formatting
        - For CreatorID, PayerID, need add U00 in front of the ID
        - For BillID need add B00 in front of the ID
        - For VoucherID need add V00 in front of the ID
        - For PaymentID need add P00 in front of the ID

        Current task:
        {data_instruction}

        History:
        {history_text}

        User:
        {req.message}

        Data:
        {data}
        """

        reply = call_ollama_remote(prompt)
        print("DEBUG reply from model:", reply, type(reply))
        save_message(cursor, conversation_id, "assistant", reply)

        conn.commit()

        return {
            "reply": reply,
            "conversationId": conversation_id
        }

    finally:
        conn.close()
