from datetime import datetime
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class RegulationVersion(Base):
    __tablename__ = "regulation_versions"

    id: Mapped[UUID] = mapped_column(primary_key=True,default=uuid4,)

    regulation_id: Mapped[UUID] = mapped_column(
        ForeignKey("regulations.id"),
        nullable=False,
    )

    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    document_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    extracted_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    content_hash: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(768),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
    	DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )

    regulation = relationship(
        "Regulation",
        back_populates="versions",
    )
