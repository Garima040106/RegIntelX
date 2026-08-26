from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.regulation_change import RegulationChange
from backend.app.services.change_detection_service import (
    detect_change,
    preview_change,
)

router = APIRouter(
    prefix="/changes",
    tags=["Regulation Changes"],
)


@router.get("/preview")
def preview_regulation_change(
    previous_version_id: UUID | None = None,
    new_version_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    if new_version_id is None:
        raise HTTPException(
            status_code=400,
            detail="new_version_id is required",
        )

    try:
        return preview_change(
            db=db,
            previous_version_id=previous_version_id,
            new_version_id=new_version_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )


@router.post("")
def create_regulation_change(
    regulation_id: UUID,
    new_version_id: UUID,
    previous_version_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    try:
        change = detect_change(
            db=db,
            regulation_id=regulation_id,
            previous_version_id=previous_version_id,
            new_version_id=new_version_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    return {
        "id": change.id,
        "regulation_id": change.regulation_id,
        "previous_version_id": change.previous_version_id,
        "new_version_id": change.new_version_id,
        "change_type": change.change_type,
        "change_summary": change.change_summary,
        "impact_level": change.impact_level,
        "affected_domains": change.affected_domains,
        "ai_confidence": change.ai_confidence,
        "created_at": change.created_at,
    }


@router.get("/{change_id}")
def get_regulation_change(
    change_id: UUID,
    db: Session = Depends(get_db),
):
    change = db.get(
        RegulationChange,
        change_id,
    )

    if change is None:
        raise HTTPException(
            status_code=404,
            detail="Regulation change not found",
        )

    return {
        "id": change.id,
        "regulation_id": change.regulation_id,
        "previous_version_id": change.previous_version_id,
        "new_version_id": change.new_version_id,
        "change_type": change.change_type,
        "change_summary": change.change_summary,
        "impact_level": change.impact_level,
        "affected_domains": change.affected_domains,
        "ai_confidence": change.ai_confidence,
        "created_at": change.created_at,
    }


@router.get("")
def list_regulation_changes(
    regulation_id: UUID | None = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = select(RegulationChange)

    if regulation_id:
        query = query.where(
            RegulationChange.regulation_id == regulation_id
        )

    changes = db.scalars(
        query
        .order_by(RegulationChange.created_at.desc())
        .limit(limit)
    ).all()

    return [
        {
            "id": change.id,
            "regulation_id": change.regulation_id,
            "previous_version_id": change.previous_version_id,
            "new_version_id": change.new_version_id,
            "change_type": change.change_type,
            "change_summary": change.change_summary,
            "impact_level": change.impact_level,
            "affected_domains": change.affected_domains,
            "ai_confidence": change.ai_confidence,
            "created_at": change.created_at,
        }
        for change in changes
    ]
