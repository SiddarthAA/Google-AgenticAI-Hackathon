import chromadb
from chromadb.utils.embedding_functions import EmbeddingFunction
from google import genai
from google.genai import types
from typing import List, Dict

# Initialize Gemini client
GEMINI_API_KEY = "AIzaSyCgyj9oJr44xupdBGIrfaQHpodeDBD6loU"  # Replace with your API key
client = genai.Client(api_key=GEMINI_API_KEY)

class GeminiEmbeddingFunction(EmbeddingFunction):
    def __init__(self):
        # Explicit __init__ to silence the deprecation warning
        pass

    def __call__(self, input: List[str]) -> List[List[float]]:
        """
        Generate embeddings for input documents using Gemini.
        """
        EMBEDDING_MODEL_ID = "gemini-embedding-001"
        response = client.models.embed_content(
            model=EMBEDDING_MODEL_ID,
            contents=input,
            config=types.EmbedContentConfig(
                task_type="retrieval_document",
                title="Civic News Document"
            )
        )
        return [res.values for res in response.embeddings]

# Vector store wrapper
class VectorStore:
    def __init__(self, db_name: str = "bangalore-news-db"):
        self.chroma_client = chromadb.Client()
        self.db = self.chroma_client.create_collection(
            name=db_name,
            embedding_function=GeminiEmbeddingFunction()
        )
        print(f"[INFO] VectorStore '{db_name}' initialized.")

    def add_documents(self, documents: List[str]):
        """
        Insert documents into the vector store.
        Each document is given a unique ID.
        """
        for i, doc in enumerate(documents):
            self.db.add(documents=[doc], ids=[f"doc_{i}"])
        print(f"[INFO] Added {len(documents)} documents to the vector store.")

    def query(self, query_text: str, top_k: int = 1, threshold: float = 0.2) -> Dict:
        """
        Search the vector store for the most relevant documents.
        Returns the top_k matches with their scores and a boolean 'found' key.
        """
        result = self.db.query(query_texts=[query_text], n_results=top_k)

        matches = [
            {"id": doc_id, "document": doc_text, "score": score}
            for doc_id, doc_text, score in zip(
                result["ids"][0],
                result["documents"][0],
                result["distances"][0]
            )
        ]

        # Determine if there's a common entry based on the threshold
        found = any(m["score"] < threshold for m in matches)  # Lower distance = closer match

        return {"matches": matches, "found": found}

# ----------------- Example Usage -----------------
if __name__ == "__main__":
    documents = [
        "BESCOM announced a power cut in Whitefield tomorrow from 10 AM to 5 PM.",
        "BTP has issued a traffic diversion alert near Silk Board.",
        "BMTC will introduce new bus routes in Koramangala starting next week."
    ]

    # Initialize vector store
    store = VectorStore(db_name="civic-news-db")

    # Add documents
    store.add_documents(documents)

    # Query the store
    query = "power cut in Whitefield"
    result = store.query(query_text=query, top_k=1, threshold=0.2)
    print("[RESULT]", result)