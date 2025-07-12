from langchain_core.embeddings import Embeddings
from azure.ai.inference import EmbeddingsClient
from azure.core.credentials import AzureKeyCredential
from typing import List
import numpy as np

class GitHubInferenceEmbeddings(Embeddings):
    """Custom embeddings class for GitHub Inference API"""
    
    def __init__(self, token: str, model: str = "text-embedding-3-large"):
        self.token = token
        self.model = model
        self.endpoint = "https://models.github.ai/inference"
        self.client = EmbeddingsClient(
            endpoint=self.endpoint,
            credential=AzureKeyCredential(token)
        )
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of documents"""
        try:
            # Process in batches if needed
            batch_size = 100
            all_embeddings = []
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                response = self.client.embed(
                    input=batch,
                    model=self.model
                )
                batch_embeddings = [embedding.embedding for embedding in response.data]
                all_embeddings.extend(batch_embeddings)
            
            return all_embeddings
        except Exception as e:
            print(f"Error embedding documents: {e}")
            # Fallback: try one by one
            return [self.embed_query(text) for text in texts]
    
    def embed_query(self, text: str) -> List[float]:
        """Embed a single query"""
        try:
            response = self.client.embed(
                input=[text],
                model=self.model
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error embedding query: {e}")
            return [0.0] * 3072  # Default embedding size for text-embedding-3-large
        