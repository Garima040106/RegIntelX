from backend.app.ingestion.discovery import discover_documents
from backend.app.ingestion.document_downloader import download_document
from backend.app.ingestion.fetchers.web import WebFetcher
from backend.app.ingestion.pdf_extractor import extract_pdf_text
from backend.app.ingestion.text_cleaner import clean_text
from backend.app.ingestion.metadata_extractor import extract_metadata
def main():
    fetcher = WebFetcher()

    result = fetcher.fetch("https://www.rbi.org.in/")

    documents = discover_documents(
        result.content,
        result.url,
    )

    print(f"Found {len(documents)} documents")

    if not documents:
        print("No documents found")
        return

    document = documents[0]

    print("\nDownloading:")
    print(document.title)
    print(document.url)

    downloaded = download_document(document.url)
    extracted = extract_pdf_text(downloaded.content)
    cleaned_text = clean_text(extracted.text)
    metadata = extract_metadata(cleaned_text)

    print("\nMetadata:")
    print("Title:", metadata.title)
    print("Circular Number:", metadata.circular_number)
    print("Issue Date:", metadata.issue_date)
    print("Effective Date:", metadata.effective_date)

    print("\nCleaning successful")
    print("Raw characters:", len(extracted.text))
    print("Clean characters:", len(cleaned_text))

    print("\nClean preview:")
    print(cleaned_text[:1000])

    print("\nExtraction successful")
    print("Pages:", extracted.page_count)
    print("Characters:", len(extracted.text))
    print("\nPreview:")
    print(extracted.text[:1000])
    print("\nDownload successful")
    print("Final URL:", downloaded.url)
    print("Content-Type:", downloaded.content_type)
    print("Size:", downloaded.size_bytes, "bytes")


if __name__ == "__main__":
    main()
