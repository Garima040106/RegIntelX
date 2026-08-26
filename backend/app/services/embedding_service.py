import os

from huggingface_hub import InferenceClient


MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"


def generate_embedding(text: str) -> list[float]:
    if not text or not text.strip():
        raise ValueError("Cannot generate embedding for empty text")

    token = os.getenv("HF_TOKEN")

    if not token:
        raise RuntimeError("HF_TOKEN environment variable is not set")

    client = InferenceClient(
        provider="hf-inference",
        api_key=token,
    )

    result = client.feature_extraction(
        text,
        model=MODEL_NAME,
        normalize=True,
    )

    embedding = result.tolist()

    # A single text should produce one 768-dimensional vector.
    if len(embedding) != 768:
        raise RuntimeError(
            f"Expected 768-dimensional embedding, got {len(embedding)}"
        )

    return [float(value) for value in embedding]
