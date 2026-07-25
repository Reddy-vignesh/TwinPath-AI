"""
Decision Twin AI — FAISS Vector Store.

Manages the FAISS index for career similarity search:
- Build index from career feature vectors
- Query nearest career matches for a student vector
- Persist/load index to/from disk
- Thread-safe read access

Uses inner product (IP) similarity on L2-normalized vectors,
which is equivalent to cosine similarity but faster.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import faiss
import numpy as np
import structlog

from app.core.constants import TOTAL_FEATURE_DIM

logger = structlog.get_logger(__name__)

# Default index storage path
INDEX_DIR = Path(os.getenv("ML_MODELS_DIR", "ml_models"))
INDEX_FILE = INDEX_DIR / "career_faiss.index"
METADATA_FILE = INDEX_DIR / "career_metadata.npy"


class CareerVectorStore:
    """
    FAISS-backed vector store for career similarity search.

    Stores career vectors and metadata, supports fast nearest-neighbor
    retrieval for career recommendation.
    """

    def __init__(self) -> None:
        self.index: faiss.IndexFlatIP | None = None
        self.career_ids: list[str] = []
        self.career_metadata: list[dict[str, Any]] = []
        self.is_loaded: bool = False

    def build_index(
        self,
        career_vectors: np.ndarray,
        career_ids: list[str],
        career_metadata: list[dict[str, Any]],
    ) -> None:
        """
        Build a FAISS index from career feature vectors.

        Args:
            career_vectors: ndarray of shape (n_careers, 216)
            career_ids: List of career UUID strings
            career_metadata: List of career metadata dicts (title, category, etc.)
        """
        n_careers, dim = career_vectors.shape
        assert dim == TOTAL_FEATURE_DIM, (
            f"Expected {TOTAL_FEATURE_DIM}D vectors, got {dim}D"
        )

        # L2 normalize for cosine similarity via inner product
        faiss.normalize_L2(career_vectors)

        # Use IndexFlatIP (inner product) for exact search
        # For large catalogs (>100K), switch to IndexIVFFlat
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(career_vectors)

        self.career_ids = career_ids
        self.career_metadata = career_metadata
        self.is_loaded = True

        logger.info(
            "FAISS index built",
            n_careers=n_careers,
            dim=dim,
            index_type="IndexFlatIP",
        )

    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 10,
    ) -> list[dict[str, Any]]:
        """
        Find top-K most similar careers to a query vector.

        Args:
            query_vector: ndarray of shape (216,) — the student's feature vector
            top_k: Number of results to return

        Returns:
            List of dicts with career_id, similarity_score, and metadata
        """
        if not self.is_loaded or self.index is None:
            logger.warning("FAISS index not loaded, returning empty results")
            return []

        # Reshape and normalize query
        query = query_vector.reshape(1, -1).astype(np.float32)
        faiss.normalize_L2(query)

        # Search
        top_k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(query, top_k)

        results = []
        for rank, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx < 0:  # FAISS returns -1 for empty slots
                continue
            results.append({
                "rank": rank + 1,
                "career_id": self.career_ids[idx],
                "similarity_score": float(score),
                "metadata": self.career_metadata[idx] if idx < len(self.career_metadata) else {},
            })

        return results

    def save(self, index_dir: Path | None = None) -> None:
        """Persist the FAISS index and metadata to disk."""
        if self.index is None:
            logger.warning("No index to save")
            return

        save_dir = index_dir or INDEX_DIR
        save_dir.mkdir(parents=True, exist_ok=True)

        faiss.write_index(self.index, str(save_dir / "career_faiss.index"))
        np.save(
            str(save_dir / "career_metadata.npy"),
            {
                "career_ids": self.career_ids,
                "career_metadata": self.career_metadata,
            },
            allow_pickle=True,
        )
        logger.info("FAISS index saved", path=str(save_dir))

    def load(self, index_dir: Path | None = None) -> bool:
        """Load a previously saved FAISS index from disk."""
        load_dir = index_dir or INDEX_DIR
        index_path = load_dir / "career_faiss.index"
        meta_path = load_dir / "career_metadata.npy"

        if not index_path.exists() or not meta_path.exists():
            logger.warning("FAISS index files not found", path=str(load_dir))
            return False

        self.index = faiss.read_index(str(index_path))
        data = np.load(str(meta_path), allow_pickle=True).item()
        self.career_ids = data["career_ids"]
        self.career_metadata = data["career_metadata"]
        self.is_loaded = True

        logger.info(
            "FAISS index loaded",
            n_careers=self.index.ntotal,
            path=str(load_dir),
        )
        return True

    @property
    def size(self) -> int:
        """Number of careers in the index."""
        return self.index.ntotal if self.index else 0
