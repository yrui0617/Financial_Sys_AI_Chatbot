import os
from ollama import Client
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("OLLAMA_API_KEY")
headers = {}
if api_key:
    headers["Authorization"] = f"Bearer {api_key}"

client = Client(
    host=os.environ.get("OLLAMA_REMOTE_HOST", "https://ollama.com"),
    headers=headers
)


def call_ollama_remote(prompt: str):
    messages = [
        {"role": "user", "content": prompt}
    ]

    response = client.chat(
        model=os.environ.get("OLLAMA_REMOTE_MODEL", "gpt-oss:120b"),
        messages=messages,
        stream=False
    )

    message = response.get("message", {})
    return message.get("content", "")
