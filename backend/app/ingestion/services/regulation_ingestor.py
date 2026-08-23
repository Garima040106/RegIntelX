from datetime import datetime, timezone
from hashlib import sha256
from uuid import UUID

from sqlalchemy.orm import Session

from backend.app.ingestion.metadata_extractor import RegulationMetadata
from backend.app.models.regulation import Regulation
from backend.app.models.regulation_version import RegulationVersion


def ingest_regulation(
    db: Session,
    source_id: UUID,
    source_url: str,
    metadata: RegulationMetadata,
    extracted_text: str,
) -> Regulation:
    content_hash = sha256(
        extracted_text.encode("utf-8")
    ).hexdigest()

    regulation = Regulation(
        source_id=source_id,
        title=metadata.title or "Untitled Regulation",
        circular_number=metadata.circular_number,
        published_date=metadata.issue_date,
        effective_date=metadata.effective_date,
        source_url=source_url,
        status="active",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    version = RegulationVersion(
        regulation=regulation,
        version_number=1,
        document_url=source_url,
        extracted_text=extracted_text,
        content_hash=content_hash,
        created_at=datetime.now(timezone.utc),
    )

    db.add(regulation)
    db.add(version)
    db.commit()
    db.refresh(regulation)

    return regulation
