from dataclasses import dataclass
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup


@dataclass
class DiscoveredDocument:
    title: str
    url: str
    document_type: str


DOCUMENT_EXTENSIONS = {
    ".pdf": "pdf",
    ".doc": "doc",
    ".docx": "docx",
}


def discover_documents(
    html: bytes,
    base_url: str,
) -> list[DiscoveredDocument]:
    soup = BeautifulSoup(html, "html.parser")

    documents: list[DiscoveredDocument] = []

    for link in soup.find_all("a", href=True):
        href = link["href"].strip()

        if not href:
            continue

        absolute_url = urljoin(base_url, href)
        path = urlparse(absolute_url).path.lower()

        document_type = None

        for extension, file_type in DOCUMENT_EXTENSIONS.items():
            if path.endswith(extension):
                document_type = file_type
                break

        if document_type is None:
            continue

        title = link.get_text(" ", strip=True)

        if not title:
            title = absolute_url.rsplit("/", 1)[-1]

        documents.append(
            DiscoveredDocument(
                title=title,
                url=absolute_url,
                document_type=document_type,
            )
        )

    return documents
