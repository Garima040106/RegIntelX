import httpx

from backend.app.ingestion.fetchers.base import (
    BaseFetcher,
    FetchResult,
)


class WebFetcher(BaseFetcher):

    def fetch(self, url: str) -> FetchResult:
        response = httpx.get(
            url,
            follow_redirects=True,
            timeout=30.0,
        )

        response.raise_for_status()

        return FetchResult(
            url=str(response.url),
            status_code=response.status_code,
            content=response.content,
            content_type=response.headers.get("content-type"),
        )
