from transformers import pipeline

# Initialize AI Models
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")

def summarize_text(text):
    """Summarizes text using Hugging Face BART model."""
    return summarizer(text, max_length=130, min_length=30, do_sample=False)[0]["summary_text"]

def classify_text(text):
    """Classifies text into predefined categories."""
    labels = ["AI", "Cybersecurity", "Finance", "Healthcare"]
    return classifier(text, labels)["labels"][0]

def answer_question(question, context):
    """Performs question answering based on provided context."""
    return qa_pipeline(question=question, context=context)["answer"]
