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
        "summarize_emails", 
        "search_emails", 
        "meeting_scheduling",
        "file_retrieval",
        "market_research",
        "quick_answers",
        "report_generation",
        "progress_tracking",
        "health_reminders",
    ]
    
    # Get classification results from the NLP model
    result = classifier(text, labels)
    best_label = result["labels"][0]
    confidence_score = result["scores"][0]

    # Define email-related keyword sets with **contextual specificity**
    send_email_keywords = ["send", "compose", "draft", "write", "email to", "message to"]
    fetch_email_keywords = ["check inbox", "check emails", "read latest", "unread emails", "latest emails"]
    summarize_email_keywords = ["summarize", "summary of", "brief of", "shorten", "email summary"]
    search_email_keywords = ["find email", "search email", "look up email"]

    text_lower = text.lower()

    # Apply keyword-based classification ONLY IF confidence is low (< 0.6)
    if confidence_score < 0.6:
        if any(phrase in text_lower for phrase in fetch_email_keywords):
            return "fetch_unread_emails"
        if any(phrase in text_lower for phrase in summarize_email_keywords):
            return "summarize_emails"
        if any(phrase in text_lower for phrase in search_email_keywords):
            return "search_emails"
        if any(phrase in text_lower for phrase in send_email_keywords):
            return "send_email"

    return best_label




def answer_question(question, context):
    """Performs question answering based on provided context."""
    return qa_pipeline(question=question, context=context)["answer"]
