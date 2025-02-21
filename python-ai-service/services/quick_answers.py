import os
import requests
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
from transformers import pipeline
from fastapi import FastAPI, HTTPException
from huggingface_hub import InferenceClient
from sentence_transformers import SentenceTransformer

load_dotenv() 

# Load embedding model for vector search
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize QA pipeline
qa_pipeline = pipeline("question-answering", model="deepset/roberta-base-squad2")

# Initialize general knowledge model
general_qa_model = pipeline("text2text-generation", model="google/flan-t5-base")

# --- Pinecone Setup ---
def init_pinecone():
    # Initialize Pinecone connection with new API
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    
    # Connect to index
    index_name = os.getenv("PINECONE_INDEX")
    
    # Check if index exists, if not create it
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=embedding_model.get_sentence_embedding_dimension(),
            metric="cosine",
            spec=ServerlessSpec(
                cloud=os.getenv("PINECONE_CLOUD"),
                region=os.getenv("PINECONE_REGION")
            )
        )
    
    # Return the index
    return pc.Index(index_name)

# Initialize Pinecone index
pinecone_index = init_pinecone()

# --- Helper Functions ---

def get_embedding(text):
    """Generate embedding vector for text using the sentence transformer model"""
    return embedding_model.encode(text).tolist()

def search_pinecone_for_context(question):
    """
    Searches Pinecone vector database for context related to the question.
    Returns context string if found, None otherwise.
    """
    try:
        # Convert question to vector embedding
        question_embedding = get_embedding(question)
        
        # Search Pinecone (updated for new API)
        results = pinecone_index.query(
            vector=question_embedding,
            top_k=3,
            include_metadata=True
        )
        
        # If results found, concatenate relevant contexts (updated for new API response format)
        if results and results.matches:
            contexts = [match.metadata['text'] for match in results.matches 
                        if match.score > 0.7]  # Only use high relevance matches
            if contexts:
                return " ".join(contexts)
        
        return None
    except Exception as e:
        print(f"Pinecone search error: {e}")
        return None

def general_knowledge_model(question):
    """
    Uses a general knowledge model to answer questions without context.
    Returns answer string or None if confidence is low.
    """
    try:
        client = InferenceClient(
	    provider="hf-inference",
	    api_key=os.getenv("HUGGINGFACE_TOKEN")
        )

        messages = [
            {
                "role": "user",
                "content": question
            }
        ]

        completion = client.chat.completions.create(
            model="google/gemma-2-2b-it", 
            messages=messages, 
            max_tokens=500,
        )

        return completion.choices[0].message.content
    except Exception as e:
        print(f"General knowledge model error: {e}")
        return None

def answer_question(question, context=None):
    """
    Performs question answering by:
    1. First checking Pinecone for relevant information
    2. Using a model for general knowledge if no context found
    3. Requesting context from user only as a last resort
    """
    # Step 1: Check Pinecone vector database for relevant context
    pinecone_context = search_pinecone_for_context(question)
    
    if pinecone_context:
        # Found relevant information in Pinecone
        return {
            "answer": qa_pipeline(question=question, context=pinecone_context)["answer"],
            "source": "pinecone_database",
            "context_used": pinecone_context[:200] + "..." if len(pinecone_context) > 200 else pinecone_context
        }
    
    # Step 2: If user provided context, use it
    if context:
        return {
            "answer": qa_pipeline(question=question, context=context)["answer"],
            "source": "user_provided_context",
            "context_used": context[:200] + "..." if len(context) > 200 else context
        }
    
    # Step 3: Try to answer with general knowledge model
    try:
        general_answer = general_knowledge_model(question)
        if general_answer and len(general_answer) > 5:
            return {
                "answer": general_answer,
                "source": "general_knowledge_model",
                "context_used": None
            }
    except Exception as e:
        print(f"General knowledge answering error: {e}")
    
    # Step 4: Last resort - inform user we need more context
    return {
        "answer": "I don't have enough information to answer that question. Please provide some relevant context.",
        "source": "no_information_found",
        "context_used": None
    }