from transformers import pipeline

classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

def classify_text(text):
    labels = ["AI", "Cybersecurity", "Finance", "Healthcare"]
    return classifier(text, labels)["labels"][0]
