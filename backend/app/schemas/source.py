from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SourceBase(BaseModel):
    name: str
    authority: str
    base_url: str
    source_type: str = "web"
    is_active: bool = True


class SourceCreate(SourceBase):
    pass


class SourceUpdate(BaseModel):
    name: str | None = None
    authority: str | None = None
    base_url: str | None = None
    source_type: str | None = None
    is_active: bool | None = None


class SourceResponse(SourceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
