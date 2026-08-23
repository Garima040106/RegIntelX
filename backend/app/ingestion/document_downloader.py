from dataclasses import dataclass

import httpx


@dataclass
class DownloadedDocument:
    url: str
    content: bytes
    content_type: str | None
    size_bytes: int


def download_document(url: str) -> DownloadedDocument:
    response = httpx.get(
        url,
        follow_redirects=True,
        timeout=60.0,
    )

    response.raise_for_status()

    content = response.content

    return DownloadedDocument(
        url=str(response.url),
        content=content,
        content_type=response.headers.get("content-type"),
        size_bytes=len(content),
    )
