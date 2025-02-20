from transformers import pipeline

# Initialize AI Models
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")

def summarize_text(text):
    """Summarizes text using Hugging Face BART model."""
    return summarizer(text, max_length=130, min_length=30, do_sample=False)[0]["summary_text"]

def classify_text(text):
    labels = [
        "research_analysis",
        "message_processing",
        "file_management",
        "finance_analysis",
        "email_management",
        "send_email",
        "fetch_unread_emails",
        "summarize_email", 
        "search_emails", 
        "meeting_scheduling",
        "file_retrieval",
        "market_research",
        "quick_answers",
        "report_generation",
        "progress_tracking",
        "health_reminders",
    ]
    
    result = classifier(text, labels)
    best_label = result["labels"][0]
    
    # Email-related keyword detection
    send_email_keywords = ["send", "compose", "draft", "mail", "email"]
    fetch_email_keywords = ["check", "read", "inbox", "unread", "latest", "emails"]
    summarize_email_keywords = ["summarize", "summary", "brief", "shorten", "email"]
    search_email_keywords = ["search", "email"]

    text_lower = text.lower()
    
    if any(word in text_lower for word in send_email_keywords):
        return "send_email"
    if any(word in text_lower for word in summarize_email_keywords):
        return "summarize_email"
    if any(word in text_lower for word in fetch_email_keywords):
        return "fetch_unread_emails"
    if any(word in text_lower for word in search_email_keywords):
        return "search_emails"

    return best_label



def answer_question(question, context):
    """Performs question answering based on provided context."""
    return qa_pipeline(question=question, context=context)["answer"]
