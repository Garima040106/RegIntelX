from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class Regulation(Base):
    __tablename__ = "regulations"

    id: Mapped[UUID] = mapped_column(
	primary_key=True,
	default=uuid4,
    )

    source_id: Mapped[UUID] = mapped_column(
        ForeignKey("regulatory_sources.id"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    circular_number: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    published_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    effective_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    source_url: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="active",
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
	DateTime(timezone=True),
    	nullable=False,
    	default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
    	DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    source = relationship(
        "RegulatorySource",
        back_populates="regulations",
    )

    versions = relationship(
        "RegulationVersion",
        back_populates="regulation",
        cascade="all, delete-orphan",
    )
