from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.regulation import Regulation

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

    return {
        "id": regulation.id,
        "title": regulation.title,
        "circular_number": regulation.circular_number,
        "published_date": regulation.published_date,
        "effective_date": regulation.effective_date,
        "source_url": regulation.source_url,
        "status": regulation.status,
    }
