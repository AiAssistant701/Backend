import io
import uvicorn
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from services.text_processing import summarize_text, classify_text, answer_question
from services.pdf_processing import extract_text_from_pdf
from services.embedding_service import get_text_embedding
""" from services.speech_processing import convert_speech_to_text """
from services.image_processing import extract_text_from_image
""" from services.ai_decision_logging import log_ai_decision """

app = FastAPI()

class SummarizationRequest(BaseModel):
    text: str

@app.get("/")
def home():
    return {"message": "AI Service Running"}

@app.post("/summarize/")
def summarize(request: SummarizationRequest):
    result = summarize_text(request.text)
    # log_ai_decision("summarization", "Hugging Face BART", "Summarized text content")
    return {"summary": result}

@app.post("/classify/")
def classify(request: SummarizationRequest):
    result = classify_text(request.text)
    # log_ai_decision("classification", "Hugging Face BART", "Classified text content")
    return {"classification": result}

@app.post("/qa/")
def question_answer(question: str = Form(...), context: str = Form(...)):
    result = answer_question(question, context)
    # log_ai_decision("question_answering", "Hugging Face DistilBERT", "Answered user question")
    return {"answer": result}

@app.post("/extract_pdf/")
def extract_pdf(file: UploadFile = File(...)):
    pdf_bytes = file.file.read()
    result = extract_text_from_pdf(io.BytesIO(pdf_bytes))
    # log_ai_decision("pdf_extraction", "PyPDF2", "Extracted text from PDF document")
    return {"extracted_text": result}

@app.post("/generate_embedding/")
def generate_embedding(text: str = Form(...)):
    embedding = get_text_embedding(text)
    # log_ai_decision("embedding_generation", "SentenceTransformer", "Generated text embedding")
    return {"embedding": embedding}

""" @app.post("/speech_to_text/")
def speech_to_text(file: UploadFile = File(...)):
    audio_bytes = file.file.read()
    result = convert_speech_to_text(io.BytesIO(audio_bytes))
    # log_ai_decision("speech_to_text", "Google Speech API", "Converted speech to text")
    return {"transcription": result} """

@app.post("/extract_text_from_image/")
def extract_text_image(file: UploadFile = File(...)):
    image_bytes = file.file.read()
    result = extract_text_from_image(image_bytes)
    # log_ai_decision("image_ocr", "Tesseract OCR", "Extracted text from image")
    return {"extracted_text": result}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
