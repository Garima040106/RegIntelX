import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.regulation import Regulation
from backend.app.models.regulatory_source import RegulatorySource


RBI_NOTIFICATIONS_URL = (
    "https://www.rbi.org.in/Scripts/NotificationUser.aspx"
)


def fetch_rbi_documents(db: Session):
    response = requests.get(
        RBI_NOTIFICATIONS_URL,
        timeout=30,
        headers={
            "User-Agent": "RegIntelX/1.0"
        },
    )

    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    source = db.scalar(
        select(RegulatorySource).where(
            RegulatorySource.authority == "Reserve Bank of India"
        )
    )

    if source is None:
        raise ValueError(
            "RBI regulatory source is not registered"
        )

    documents = []
    seen_urls = set()

    for link in soup.find_all("a", href=True):
        href = link.get("href", "").strip()

        if not href:
            continue

        url = urljoin(response.url, href)

        if ".pdf" not in url.lower():
            continue

        if url in seen_urls:
            continue

        seen_urls.add(url)

        title = link.get_text(" ", strip=True)

        if not title:
            title = "Untitled RBI Regulation"

        documents.append(
            {
                "title": title,
                "source_url": url,
            }
        )

    added = 0
    skipped = 0

    for document in documents:
        existing = db.scalar(
            select(Regulation).where(
                Regulation.source_url == document["source_url"]
            )
        )

        if existing:
            skipped += 1
            continue

        regulation = Regulation(
            source_id=source.id,
            title=document["title"],
            source_url=document["source_url"],
            status="active",
        )

        db.add(regulation)
        added += 1

    db.commit()

    return {
        "found": len(documents),
        "added": added,
        "skipped": skipped,
    }
