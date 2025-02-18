from transformers import pipeline

classifier = pipeline("text-classification", model="facebook/bart-large-mnli")

def classify_intent(text):
    labels = ["summarize", "schedule_meeting", "fetch_files", "general_query"]
    result = classifier(text, labels)
    return result["labels"][0]
