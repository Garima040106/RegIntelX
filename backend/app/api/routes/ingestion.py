from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.rate_limit import limiter
from backend.app.models import Regulation, RegulatorySource
from backend.app.models.regulation_version import RegulationVersion
from backend.app.ingestion.document_downloader import download_document
from backend.app.ingestion.pdf_extractor import extract_pdf_text
from backend.app.ingestion.metadata_extractor import extract_metadata
from backend.app.ingestion.services.regulation_ingestor import ingest_regulation


router = APIRouter(
    prefix="/ingestion",
    tags=["Ingestion"],
)


@router.post("/rbi")
@limiter.limit("10/minute")
def ingest_rbi(
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        from backend.app.services.rbi_ingestion import fetch_rbi_documents

        result = fetch_rbi_documents(db)

        return {
            "status": "success",
            **result,
        }

    except ValueError as exc:
        return {
            "status": "error",
            "message": str(exc),
        }

    except Exception as exc:
        return {
            "status": "error",
            "message": "RBI ingestion failed",
            "error": str(exc),
        }


@router.post("/rbi/process")
@limiter.limit("5/minute")
def process_rbi(
    request: Request,
    db: Session = Depends(get_db),
):
    source = db.scalars(
        select(RegulatorySource).where(
            RegulatorySource.name == "RBI Notifications"
        )
    ).first()

    if source is None:
        return {
            "status": "error",
            "message": "RBI source is not registered",
        }

    regulations = db.scalars(
        select(Regulation).where(
            Regulation.source_id == source.id
        )
    ).all()

    processed = 0
    skipped = 0
    failed = 0
    errors = []

    for regulation in regulations:
        try:
            # Do not download a document that has already been processed.
            existing_version = db.scalar(
                select(RegulationVersion)
                .where(
                    RegulationVersion.document_url
                    == regulation.source_url
                )
                .order_by(
                    RegulationVersion.version_number.desc()
                )
            )

            if existing_version:
                skipped += 1
                continue

            document = download_document(
                regulation.source_url
            )

            extracted = extract_pdf_text(
                document.content
            )

            if not extracted.text.strip():
                skipped += 1
                continue

            metadata = extract_metadata(
                extracted.text
            )

            ingest_regulation(
                db=db,
                source_id=source.id,
                source_url=regulation.source_url,
                metadata=metadata,
                extracted_text=extracted.text,
            )

            processed += 1

        except Exception as exc:
            db.rollback()

            failed += 1

            errors.append({
                "regulation_id": str(regulation.id),
                "url": regulation.source_url,
                "error": str(exc),
            })

    return {
        "status": "success",
        "total": len(regulations),
        "processed": processed,
        "skipped": skipped,
        "failed": failed,
        "errors": errors[:20],
    }
