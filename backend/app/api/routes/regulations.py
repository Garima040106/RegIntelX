from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.regulation import Regulation
from backend.app.models.regulation_version import RegulationVersion

router = APIRouter(
    prefix="/regulations",
    tags=["Regulations"],
)


def regulation_response(regulation):
    return {
        "id": regulation.id,
        "title": regulation.title,
        "circular_number": regulation.circular_number,
        "published_date": regulation.published_date,
        "effective_date": regulation.effective_date,
        "source_url": regulation.source_url,
        "status": regulation.status,
        "summary": regulation.summary,
    }


@router.get("/search")
def search_regulations(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    search = f"%{q}%"

    regulations = db.scalars(
        select(Regulation)
        .where(
            or_(
                Regulation.title.ilike(search),
                Regulation.circular_number.ilike(search),
                Regulation.summary.ilike(search),
            )
        )
        .order_by(Regulation.created_at.desc())
    ).all()

    return [
        regulation_response(regulation)
        for regulation in regulations
    ]


@router.get("")
def list_regulations(
    status_filter: str | None = Query(None, alias="status"),
    published_from: date | None = None,
    published_to: date | None = None,
    effective_from: date | None = None,
    effective_to: date | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = select(Regulation)

    if status_filter:
        query = query.where(
            Regulation.status == status_filter
        )

    if published_from:
        query = query.where(
            Regulation.published_date >= published_from
        )

    if published_to:
        query = query.where(
            Regulation.published_date <= published_to
        )

    if effective_from:
        query = query.where(
            Regulation.effective_date >= effective_from
        )

    if effective_to:
        query = query.where(
            Regulation.effective_date <= effective_to
        )

    total = db.scalar(
        select(func.count()).select_from(
            query.subquery()
        )
    )

    regulations = db.scalars(
        query
        .order_by(Regulation.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [
            regulation_response(regulation)
            for regulation in regulations
        ],
    }


@router.get("/{regulation_id}/versions")
def list_regulation_versions(
    regulation_id: UUID,
    db: Session = Depends(get_db),
):
    regulation = db.get(Regulation, regulation_id)

    if regulation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regulation not found",
        )

    versions = db.scalars(
        select(RegulationVersion)
        .where(
            RegulationVersion.regulation_id == regulation_id
        )
        .order_by(
            RegulationVersion.version_number.desc()
        )
    ).all()

    return [
        {
            "id": version.id,
            "version_number": version.version_number,
            "document_url": version.document_url,
            "content_hash": version.content_hash,
            "created_at": version.created_at,
        }
        for version in versions
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
        **regulation_response(regulation),
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
