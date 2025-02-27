import os
from fastapi import HTTPException
from transformers import pipeline

# Load AI model for text generation
report_generator = pipeline(
    "text-generation",
    model="tiiuae/falcon-7b-instruct",
    token=os.getenv("HUGGINGFACE_API_KEY"),
)

def generate_report(text: str):
    try:
        result = report_generator(text, max_length=500)[0]["generated_text"]
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

