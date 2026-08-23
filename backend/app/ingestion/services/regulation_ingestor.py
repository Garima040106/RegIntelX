from datetime import datetime, timezone
from hashlib import sha256
from uuid import UUID

from sqlalchemy import select
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

    existing_version = db.scalar(
        select(RegulationVersion).where(
            RegulationVersion.content_hash == content_hash
        )
    )

    if existing_version:
        regulation = db.get(Regulation, existing_version.regulation_id)

        if regulation:
            return regulation

    regulation = db.scalar(
        select(Regulation).where(
            Regulation.source_id == source_id,
            Regulation.circular_number == metadata.circular_number,
        )
    )

    now = datetime.now(timezone.utc)

    if regulation:
        latest_version = db.scalar(
            select(RegulationVersion)
            .where(
                RegulationVersion.regulation_id == regulation.id
            )
            .order_by(RegulationVersion.version_number.desc())
        )

        next_version = (
            latest_version.version_number + 1
            if latest_version
            else 1
        )

        regulation.title = metadata.title or regulation.title
        regulation.published_date = (
            metadata.issue_date or regulation.published_date
        )
        regulation.effective_date = (
            metadata.effective_date or regulation.effective_date
        )
        regulation.source_url = source_url
        regulation.updated_at = now

    else:
        regulation = Regulation(
            source_id=source_id,
            title=metadata.title or "Untitled Regulation",
            circular_number=metadata.circular_number,
            published_date=metadata.issue_date,
            effective_date=metadata.effective_date,
            source_url=source_url,
            status="active",
            created_at=now,
            updated_at=now,
        )

        next_version = 1
        db.add(regulation)
        db.flush()

    version = RegulationVersion(
        regulation_id=regulation.id,
        version_number=next_version,
        document_url=source_url,
        extracted_text=extracted_text,
        content_hash=content_hash,
        created_at=now,
    )

    db.add(version)
    db.commit()
    db.refresh(regulation)

    return regulation
