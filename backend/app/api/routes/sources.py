from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models import RegulatorySource
from backend.app.schemas.source import (
    SourceCreate,
    SourceResponse,
    SourceUpdate,
)

router = APIRouter(
    prefix="/sources",
    tags=["Regulatory Sources"],
)


@router.get(
    "",
    response_model=list[SourceResponse],
)
def list_sources(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(RegulatorySource)
        .order_by(RegulatorySource.name)
    ).all()


@router.get(
    "/{source_id}",
    response_model=SourceResponse,
)
def get_source(
    source_id: UUID,
    db: Session = Depends(get_db),
):
    source = db.get(RegulatorySource, source_id)

    if source is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regulatory source not found",
        )

    return source


@router.post(
    "",
    response_model=SourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_source(
    payload: SourceCreate,
    db: Session = Depends(get_db),
):
    source = RegulatorySource(
        name=payload.name,
        authority=payload.authority,
        base_url=payload.base_url,
        source_type=payload.source_type,
        is_active=payload.is_active,
    )

    db.add(source)
    db.commit()
    db.refresh(source)

    return source


@router.patch(
    "/{source_id}",
    response_model=SourceResponse,
)
def update_source(
    source_id: UUID,
    payload: SourceUpdate,
    db: Session = Depends(get_db),
):
    source = db.get(RegulatorySource, source_id)

    if source is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regulatory source not found",
        )

    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(source, field, value)

    db.commit()
    db.refresh(source)

    return source
