import os
import json
import numpy as np
from typing import List, Tuple, Dict, Optional
from datetime import datetime
import time

# Import necessary GCP libraries
from google.cloud import aiplatform
import vertexai
from vertexai.language_models import TextEmbeddingModel

class VectorDBManager:
    def __init__(self, project_id: str, location: str, index_endpoint_name: str, deployed_index_id: str, similarity_threshold: float = 0.85):
        """
        Initializes the VectorDBManager, setting up the connection to the vector database
        and the embedding model. This effectively 'creates' or prepares the vector DB
        for operations.
        """
        self.project_id = project_id
        self.location = location
        self.index_endpoint_name = index_endpoint_name
        self.deployed_index_id = deployed_index_id
        self.similarity_threshold = similarity_threshold

        vertexai.init(project=self.project_id, location=self.location)
        aiplatform.init(project=self.project_id, location=self.location)

        self.embedding_model = None
        self.embedding_dimension = 768
        self._init_embedding_model()

        # This line connects to the deployed index endpoint, which is part of 'creating' the vector DB connection.
        self.index_endpoint = aiplatform.MatchingEngineIndexEndpoint(
            index_endpoint_name=self.index_endpoint_name
        )

        # ID management and in-memory caching for faster lookups
        self.next_id = self._get_next_available_id()
        self._memory_index = {}
        self._load_existing_entries()

        print(f"VectorDBManager initialized with threshold: {similarity_threshold}")
        print(f"Current entries in in-memory index: {len(self._memory_index)}")

    def _init_embedding_model(self):
        """Initializes ONLY text-embedding-005 model."""
        model_name = "text-embedding-005"
        dimension = 768
        try:
            print(f"Loading {model_name}...")
            self.embedding_model = TextEmbeddingModel.from_pretrained(model_name)
            self.embedding_dimension = dimension
            # Test the model to confirm it's working and get actual dimension
            test_embedding = self.embedding_model.get_embeddings(["test"])
            if test_embedding and len(test_embedding) > 0:
                actual_dim = len(test_embedding[0].values)
                self.embedding_dimension = actual_dim
                print(f"Successfully loaded: {model_name} (dimension: {actual_dim})")
                return
            else:
                raise Exception(f"Failed to get test embedding from {model_name}")
        except Exception as e:
            print(f"Failed to load {model_name}: {str(e)}")
            raise Exception(f"text-embedding-005 model is not available in {self.location} region")

    def _get_next_available_id(self) -> int:
        """Gets the next available ID for new entries from a file."""
        try:
            with open("last_id.txt", "r") as f:
                return int(f.read().strip()) + 1
        except FileNotFoundError:
            return 1

    def _update_next_id(self):
        """Updates the stored ID counter in a file."""
        with open("last_id.txt", "w") as f:
            f.write(str(self.next_id))

    def _load_existing_entries(self):
        """Loads existing entries into memory for faster access."""
        try:
            if not os.path.exists("text_mappings.jsonl"):
                print("No existing text_mappings.jsonl found.")
                return

            with open("text_mappings.jsonl", "r", encoding='utf-8') as f:
                for line in f:
                    try:
                        data = json.loads(line.strip())
                        doc_id = data.get('id')
                        text = data.get('text', '')
                        embedding = self.text_to_embedding(text)

                        if embedding:
                            self._memory_index[doc_id] = {
                                'embedding': np.array(embedding),
                                'text': text,
                                'metadata': data.get('metadata', {}),
                                'timestamp': data.get('timestamp', '')
                            }
                    except json.JSONDecodeError:
                        continue
        except FileNotFoundError:
            print("No existing entries found (text_mappings.jsonl not found).")
        except Exception as e:
            print(f"Error loading existing entries: {e}")

    def text_to_embedding(self, text: str) -> Optional[List[float]]:
        """Converts text to embedding using text-embedding-005 model."""
        try:
            if self.embedding_model is None:
                print("No embedding model available.")
                return None
            embeddings = self.embedding_model.get_embeddings(
                [text],
                auto_truncate=True,
                output_dimensionality=None
            )
            if embeddings and len(embeddings) > 0:
                return embeddings[0].values
            else:
                return None
            
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None

    def _batch_cosine_similarity(self, query_vector: np.ndarray, doc_vectors: np.ndarray) -> np.ndarray:
        """Fast batch cosine similarity calculation using numpy."""
        try:
            query_norm = query_vector / np.linalg.norm(query_vector)
            doc_norms = doc_vectors / np.linalg.norm(doc_vectors, axis=1, keepdims=True)
            similarities = np.dot(doc_norms, query_norm)
            return similarities
        except Exception as e:
            print(f"Error in batch cosine similarity: {e}")
            return np.zeros(len(doc_vectors))

    def _find_closest_matching_in_memory(self, query_embedding: List[float], num_neighbors: int = 1) -> List[Tuple[str, float, str]]:
        """Internal function to find closest matching text in the in-memory index."""
        try:
            query_vector = np.array(query_embedding)
            if not self._memory_index:
                return []
            doc_ids = list(self._memory_index.keys())
            doc_vectors = np.array([self._memory_index[doc_id]['embedding'] for doc_id in doc_ids])
            similarities = self._batch_cosine_similarity(query_vector, doc_vectors)
            results = []
            for i, similarity in enumerate(similarities):
                doc_id = doc_ids[i]
                text = self._memory_index[doc_id]['text']
                results.append((doc_id, similarity, text))
            results.sort(key=lambda x: x[1], reverse=True)
            return results
        
        except Exception as e:
            print(f"Error finding closest matches in memory: {e}")
            return []


    def _add_to_vector_index(self, text: str, embedding: List[float], metadata: dict = None) -> Optional[str]:
        """Internal function to add text and its embedding to the vector index and local files."""
        try:
            doc_id = str(self.next_id)
            text_data = {
                "id": doc_id,
                "text": text,
                "metadata": metadata or {},
                "timestamp": datetime.now().isoformat(),
                "embedding_model": "text-embedding-005",
                "embedding_dimension": len(embedding)
            }
            # Ensure the directory for text_mappings.jsonl exists if needed
            os.makedirs(os.path.dirname("text_mappings.jsonl"), exist_ok=True)
            with open("text_mappings.jsonl", "a", encoding='utf-8') as f:
                f.write(json.dumps(text_data, ensure_ascii=False) + "\n")

            # Ensure the directory for pending_updates.jsonl exists if needed
            os.makedirs(os.path.dirname("pending_updates.jsonl"), exist_ok=True)
            datapoint = {
                "datapoint_id": doc_id,
                "feature_vector": embedding,
                "restricts": [],
                "crowding_tag": ""
            }
            with open("pending_updates.jsonl", "a") as f:
                f.write(json.dumps(datapoint) + "\n")

            self._memory_index[doc_id] = {
                'embedding': np.array(embedding),
                'text': text,
                'metadata': metadata or {},
                'timestamp': datetime.now().isoformat()
            }
            self.next_id += 1
            self._update_next_id()
            return doc_id
        except Exception as e:
            print(f"Error adding to vector index: {e}")
            return None

    def check_for_similar_and_insert(self, text: str, metadata: dict = None) -> Tuple[bool, Optional[str], Optional[List[float]]]:
        print(f"Checking text: '{text[:50]}...'")

        if not text or not text.strip():
            print("Empty text provided. Cannot process.")
            return False, None

        try:
            query_embedding = self.text_to_embedding(text)
            if query_embedding is None:
                print(f"Failed to generate query embedding for: {text[:50]}...")
                return False, None, None

            matches = self._find_closest_matching_in_memory(query_embedding, num_neighbors=1)

            max_similarity = 0.0
            closest_match_id = None

            if matches:
                closest_match_id = matches[0][0]
                max_similarity = matches[0][1]

                print(f"Closest match similarity: {max_similarity:.3f}")

                if max_similarity >= self.similarity_threshold:
                    print(f"DUPLICATE DETECTED (similarity: {max_similarity:.3f}) with ID: {closest_match_id}")
                    return True, closest_match_id, query_embedding

            print(f"NEW TEXT (similarity: {max_similarity:.3f}) - Adding to database.")
            new_id = self._add_to_vector_index(text, query_embedding, metadata)
            if new_id:
                print(f"Added new text with ID: {new_id}")
                return False, new_id, query_embedding
            else:
                print("Failed to add new text.")
                return False, None, None

        except Exception as e:
            print(f"Error in check_for_similar_and_insert: {e}")
            return False, None, None
