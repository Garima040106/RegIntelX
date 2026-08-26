from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class ComplianceMap(Base):
    __tablename__ = "maps"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    regulation_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "regulations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    change_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "regulation_changes.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    priority: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="medium",
    )

    status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="pending",
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    risk_score: Mapped[float | None] = mapped_column(
        nullable=True,
    )

    required_evidence: Mapped[str | None] = mapped_column(
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
