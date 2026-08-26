from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.compliance_map import ComplianceMap
from backend.app.services.compliance_map_service import (
    create_maps_for_change,
)

router = APIRouter(
    tags=["Compliance Maps"],
)


def map_response(compliance_map: ComplianceMap):
    return {
        "id": compliance_map.id,
        "regulation_id": compliance_map.regulation_id,
        "change_id": compliance_map.change_id,
        "title": compliance_map.title,
        "description": compliance_map.description,
        "priority": compliance_map.priority,
        "status": compliance_map.status,
        "due_date": compliance_map.due_date,
        "risk_score": compliance_map.risk_score,
        "required_evidence": compliance_map.required_evidence,
        "created_at": compliance_map.created_at,
        "updated_at": compliance_map.updated_at,
    }


@router.post("/from-change/{change_id}")
def generate_maps(
    change_id: UUID,
    db: Session = Depends(get_db),
):
    try:
        maps = create_maps_for_change(
            db=db,
            change_id=change_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    return {
        "change_id": change_id,
        "count": len(maps),
        "items": [
            map_response(compliance_map)
            for compliance_map in maps
        ],
    }


@router.get("")
def list_maps(
    regulation_id: UUID | None = None,
    change_id: UUID | None = None,
    status: str | None = None,
    priority: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = select(ComplianceMap)

    if regulation_id:
        query = query.where(
            ComplianceMap.regulation_id == regulation_id
        )

    if change_id:
        query = query.where(
            ComplianceMap.change_id == change_id
        )

    if status:
        query = query.where(
            ComplianceMap.status == status
        )

    if priority:
        query = query.where(
            ComplianceMap.priority == priority
        )

    maps = db.scalars(
        query
        .order_by(ComplianceMap.created_at.desc())
        .limit(limit)
    ).all()

    return [
        map_response(compliance_map)
        for compliance_map in maps
    ]


@router.get("/{map_id}")
def get_map(
    map_id: UUID,
    db: Session = Depends(get_db),
):
    compliance_map = db.get(
        ComplianceMap,
        map_id,
    )

    if compliance_map is None:
        raise HTTPException(
            status_code=404,
            detail="Compliance MAP not found",
        )

    return map_response(compliance_map)


@router.patch("/{map_id}/status")
def update_map_status(
    map_id: UUID,
    status: str,
    db: Session = Depends(get_db),
):
    allowed_statuses = {
        "pending",
        "in_progress",
        "completed",
        "dismissed",
    }

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. "
                "Use pending, in_progress, "
                "completed, or dismissed."
            ),
        )

    compliance_map = db.get(
        ComplianceMap,
        map_id,
    )

    if compliance_map is None:
        raise HTTPException(
            status_code=404,
            detail="Compliance MAP not found",
        )

    compliance_map.status = status

    db.commit()
    db.refresh(compliance_map)

    return map_response(compliance_map)
