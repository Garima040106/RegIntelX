from datetime import datetime, timezone
from hashlib import sha256
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.ingestion.metadata_extractor import RegulationMetadata
from backend.app.models.regulation import Regulation
from backend.app.models.regulation_version import RegulationVersion
from backend.app.services.embedding_service import generate_embedding

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

    now = datetime.now(timezone.utc)

    # First identify the regulation by its source URL.
    # This is important because the discovery phase already
    # created Regulation rows for these URLs.
    regulation = db.scalar(
        select(Regulation).where(
            Regulation.source_id == source_id,
            Regulation.source_url == source_url,
        )
    )

    # If no regulation exists for this URL, try the circular number.
    if regulation is None and metadata.circular_number:
        regulation = db.scalar(
            select(Regulation).where(
                Regulation.source_id == source_id,
                Regulation.circular_number == metadata.circular_number,
            )
        )

    # Create the regulation if it doesn't exist.
    if regulation is None:
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

        db.add(regulation)
        db.flush()

    else:
        # Enrich the existing discovery record.
        if metadata.title:
            regulation.title = metadata.title

        if metadata.circular_number:
            regulation.circular_number = metadata.circular_number

        if metadata.issue_date:
            regulation.published_date = metadata.issue_date

        if metadata.effective_date:
            regulation.effective_date = metadata.effective_date

        regulation.source_url = source_url
        regulation.updated_at = now

    # Check whether this exact document version is already
    # attached to this regulation.
    existing_version = db.scalar(
        select(RegulationVersion).where(
            RegulationVersion.regulation_id == regulation.id,
            RegulationVersion.content_hash == content_hash,
        )
    )

    if existing_version:
        db.commit()
        db.refresh(regulation)
        return regulation

    # Determine the next version number for this regulation.
    latest_version = db.scalar(
        select(RegulationVersion)
        .where(
            RegulationVersion.regulation_id == regulation.id
        )
        .order_by(
            RegulationVersion.version_number.desc()
        )
    )

    next_version = (
        latest_version.version_number + 1
        if latest_version
        else 1
    )

    embedding = generate_embedding(extracted_text)

    version = RegulationVersion(
        regulation_id=regulation.id,
        version_number=next_version,
        document_url=source_url,
        extracted_text=extracted_text,
        content_hash=content_hash,
	embedding=embedding,
        created_at=now,
    )

    db.add(version)
    db.commit()
    db.refresh(regulation)

    return regulation
