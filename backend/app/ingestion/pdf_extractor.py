from dataclasses import dataclass
from io import BytesIO

from pypdf import PdfReader


@dataclass
class ExtractedDocument:
    text: str
    page_count: int


def extract_pdf_text(content: bytes) -> ExtractedDocument:
    reader = PdfReader(BytesIO(content))

    pages: list[str] = []

    for page in reader.pages:
        text = page.extract_text() or ""
        pages.append(text)

    return ExtractedDocument(
        text="\n\n".join(pages).strip(),
        page_count=len(reader.pages),
    )
