from groq import Groq

# Initialize client using environment variable
client = Groq(
    api_key="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"
)

def call_groq(prompt: str):
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        return response.choices[0].message.content

    except Exception as e:
        print("Groq API Error:", e)
        return "Sorry, something went wrong with the AI service."