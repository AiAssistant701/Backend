import io
import uvicorn
from typing import Optional
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from services.text_processing import summarize_text, classify_text
from services.pdf_processing import extract_text_from_pdf
from services.embedding_service import get_text_embedding
from services.image_processing import extract_text_from_image
from services.extract_event_details import extract_event_details
from services.quick_answers import get_embedding, pinecone_index, answer_question
from services.report_generation import generate_report
""" from services.speech_processing import convert_speech_to_text """
""" from services.ai_decision_logging import log_ai_decision """

app = FastAPI()

class RequestData(BaseModel):
    text: str

class QuestionRequest(BaseModel):
    question: str
    context: Optional[str] = None

class AnswerResponse(BaseModel):
    answer: str
    source: str
    context_used: Optional[str] = None

class KnowledgeBaseItem(BaseModel):
    text: str
    metadata: Optional[dict] = None

class ReportRequest(BaseModel):
    data: str

@app.get("/")
def home():
    return {"message": "AI Service Running"}

@app.post("/summarize/")
def summarize(request: RequestData):
    result = summarize_text(request.text)
    # log_ai_decision("summarization", "Hugging Face BART", "Summarized text content")
    return {"summary": result}

@app.post("/classify/")
def classify(request: RequestData):
    result = classify_text(request.text)
    # log_ai_decision("classification", "Hugging Face BART", "Classified text content")
    return {"classification": result}

@app.post("/extract-event/")
def extract_event(request: RequestData):
    result = extract_event_details(request.text)
    # log_ai_decision("event", "Hugging Face BART", "Classified text content")
    return {"event": result}

@app.post("/qa/", response_model=AnswerResponse)
async def get_answer(request: QuestionRequest):
    """
    Get answer to a question, trying multiple sources.
    Optionally provide context if you have specific information.
    """
    if not request.question or len(request.question.strip()) < 3:
        raise HTTPException(status_code=400, detail="Question must be at least 3 characters long")
        
    result = answer_question(request.question, request.context)
    return result

@app.post("/add-to-knowledge-base/")
async def add_to_knowledge_base(item: KnowledgeBaseItem):
    """Add new information to the Pinecone knowledge base"""
    try:
        # Generate an embedding for the text
        vector = get_embedding(item.text)
        
        # Create metadata (including the full text for retrieval)
        metadata = item.metadata or {}
        metadata["text"] = item.text
        
        # Generate a unique ID (simple hash in this example)
        item_id = str(abs(hash(item.text)))
        
        # Upsert to Pinecone
        pinecone_index.upsert(
            vectors=[(item_id, vector, metadata)]
        )
        
        return {"status": "success", "id": item_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add to knowledge base: {str(e)}")
    
@app.post("/generate-report/")
def generate_report(request: ReportRequest):
    try:
        prompt = f"Generate a professional report and give it a title based on: {request.data}"
        result = generate_report(prompt, max_length=500)[0]["generated_text"]
        
        return {"content": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

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
