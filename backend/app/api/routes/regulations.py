from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.regulation import Regulation
from backend.app.models.regulation_version import RegulationVersion

router = APIRouter(
    prefix="/regulations",
    tags=["Regulations"],
)


@router.get("")
def list_regulations(
    db: Session = Depends(get_db),
):
    regulations = db.scalars(
        select(Regulation).order_by(Regulation.created_at.desc())
    ).all()

    return [
        {
            "id": regulation.id,
            "title": regulation.title,
            "circular_number": regulation.circular_number,
            "published_date": regulation.published_date,
            "effective_date": regulation.effective_date,
            "source_url": regulation.source_url,
            "status": regulation.status,
            "summary": regulation.summary,
        }
        for regulation in regulations
    ]


@router.get("/{regulation_id}")
def get_regulation(
    regulation_id: UUID,
    db: Session = Depends(get_db),
):
    regulation = db.get(Regulation, regulation_id)

    if regulation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regulation not found",
        )

    latest_version = db.scalar(
        select(RegulationVersion)
        .where(
            RegulationVersion.regulation_id == regulation.id
        )
        .order_by(
            RegulationVersion.version_number.desc()
        )
    )

    return {
        "id": regulation.id,
        "title": regulation.title,
        "circular_number": regulation.circular_number,
        "published_date": regulation.published_date,
        "effective_date": regulation.effective_date,
        "source_url": regulation.source_url,
        "status": regulation.status,
        "summary": regulation.summary,
        "latest_version": (
            {
                "id": latest_version.id,
                "version_number": latest_version.version_number,
                "document_url": latest_version.document_url,
                "extracted_text": latest_version.extracted_text,
                "content_hash": latest_version.content_hash,
                "created_at": latest_version.created_at,
            }
            if latest_version
            else None
        ),
    }
