import os
import json

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()

api_key = os.getenv("AICREDITS_API_KEY")

if not api_key:
    raise RuntimeError("AICREDITS_API_KEY not found in .env")


client = OpenAI(
    base_url="https://api.aicredits.in/v1",
    api_key=api_key,
)


response = client.chat.completions.create(
    model="google/gemini-2.0-flash",
    messages=[
        {
            "role": "user",
            "content": "Reply with only these three words: Scanify AI connected",
        }
    ],
    temperature=0,
    max_tokens=50,
)

print("\n===== RAW RESPONSE =====")
print(response.model_dump_json(indent=2))

print("\n===== SIMPLE FIELDS =====")
print("finish_reason:", response.choices[0].finish_reason)
print("message:", response.choices[0].message)
print("content:", response.choices[0].message.content)