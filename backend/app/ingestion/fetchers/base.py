from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class FetchResult:
    url: str
    status_code: int
    content: bytes
    content_type: str | None = None


class BaseFetcher(ABC):

    @abstractmethod
    def fetch(self, url: str) -> FetchResult:
        pass
