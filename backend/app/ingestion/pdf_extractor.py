from dataclasses import dataclass
from io import BytesIO

import pytesseract
from pdf2image import convert_from_bytes
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

    extracted_text = "\n\n".join(pages).strip()

    # Use OCR when the PDF contains no machine-readable text.
    if not extracted_text:
        images = convert_from_bytes(content, dpi=200)

        ocr_pages: list[str] = []

        for image in images:
            text = pytesseract.image_to_string(image)
            ocr_pages.append(text)

        extracted_text = "\n\n".join(ocr_pages).strip()

    return ExtractedDocument(
        text=extracted_text,
        page_count=len(reader.pages),
    )
