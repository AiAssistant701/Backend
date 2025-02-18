from sentence_transformers import SentenceTransformer

# Load Embedding Model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_text_embedding(text):
    """Generates embeddings for the given text for vector storage."""
    return embedding_model.encode(text).tolist()
