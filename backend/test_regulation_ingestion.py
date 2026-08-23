from uuid import UUID

from backend.app.core.database import SessionLocal
from backend.app.ingestion.discovery import discover_documents
from backend.app.ingestion.document_downloader import download_document
from backend.app.ingestion.fetchers.web import WebFetcher
from backend.app.ingestion.metadata_extractor import extract_metadata
from backend.app.ingestion.pdf_extractor import extract_pdf_text
from backend.app.ingestion.services.regulation_ingestor import ingest_regulation
from backend.app.ingestion.text_cleaner import clean_text


SOURCE_ID = UUID("4e02c439-7e9c-49f9-8982-b616f755afed")
SOURCE_URL = "https://www.rbi.org.in/"


def main():
    fetcher = WebFetcher()

    result = fetcher.fetch(SOURCE_URL)

    documents = discover_documents(
        result.content,
        result.url,
    )

    if not documents:
        print("No regulatory documents found")
        return

    document = documents[0]

    print("Selected document:")
    print(document.title)
    print(document.url)

    downloaded = download_document(document.url)

    extracted = extract_pdf_text(downloaded.content)
    cleaned_text = clean_text(extracted.text)
    metadata = extract_metadata(cleaned_text)

    db = SessionLocal()

    try:
        regulation = ingest_regulation(
            db=db,
            source_id=SOURCE_ID,
            source_url=document.url,
            metadata=metadata,
            extracted_text=cleaned_text,
        )

        print("\nRegulation stored successfully")
        print("ID:", regulation.id)
        print("Title:", regulation.title)
        print("Circular:", regulation.circular_number)
        print("Published:", regulation.published_date)
        print("Effective:", regulation.effective_date)

    finally:
        db.close()


if __name__ == "__main__":
    main()
