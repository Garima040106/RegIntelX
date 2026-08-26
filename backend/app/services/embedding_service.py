import os
import requests


MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"
API_URL = f"https://router.huggingface.co/hf-inference/models/{MODEL_NAME}"


def generate_embedding(text: str) -> list[float]:
    if not text or not text.strip():
        raise ValueError("Cannot generate embedding for empty text")

    token = os.getenv("HF_TOKEN")

    if not token:
        raise RuntimeError("HF_TOKEN environment variable is not set")

    response = requests.post(
        API_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={
            "inputs": text,
            "normalize": True,
        },
        timeout=120,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"Hugging Face embedding request failed: "
            f"{response.status_code} {response.text}"
        )

    result = response.json()

    if not isinstance(result, list):
        raise RuntimeError(
            f"Unexpected Hugging Face response: {result}"
        )

    if result and isinstance(result[0], list):
        embedding = result[0]
    else:
        embedding = result

    if len(embedding) != 768:
        raise RuntimeError(
            f"Expected 768-dimensional embedding, got {len(embedding)}"
        )

    return [float(value) for value in embedding]
