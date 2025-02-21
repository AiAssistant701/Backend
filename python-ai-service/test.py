from transformers import pipeline

# Test the general knowledge model directly
test_model = pipeline("text2text-generation", model="google/flan-t5-base")
test_question = "answer: What is pneumonia?"
response = test_model(test_question, max_length=150)[0]['generated_text']
print(f"Test response: {response}")