from backend.app.ingestion.fetchers.web import WebFetcher


def main():
    fetcher = WebFetcher()

    result = fetcher.fetch("https://www.rbi.org.in/")

    print("Status:", result.status_code)
    print("URL:", result.url)
    print("Content-Type:", result.content_type)
    print("Bytes:", len(result.content))


if __name__ == "__main__":
    main()
