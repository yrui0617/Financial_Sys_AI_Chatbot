from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.api.chatbot.chat import router as chat_router
from server.api.chatbot.conversation import router as conv_router
from server.api.chatbot.messages import router as msg_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(chat_router)
app.include_router(conv_router)
app.include_router(msg_router)