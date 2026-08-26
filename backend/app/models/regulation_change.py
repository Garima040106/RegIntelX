from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, Text, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class RegulationChange(Base):
    __tablename__ = "regulation_changes"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    regulation_id: Mapped[UUID] = mapped_column(
        ForeignKey("regulations.id", ondelete="CASCADE"),
        nullable=False,
    )

    previous_version_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "regulation_versions.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    new_version_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "regulation_versions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    change_type: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    change_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    impact_level: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="medium",
    )

    affected_domains: Mapped[list[str]] = mapped_column(
        ARRAY(Text),
        nullable=False,
        default=list,
    )

    ai_confidence: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 4),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )

    regulation = relationship(
        "Regulation",
        back_populates="changes",
    )

    previous_version = relationship(
        "RegulationVersion",
        foreign_keys=[previous_version_id],
    )

    new_version = relationship(
        "RegulationVersion",
        foreign_keys=[new_version_id],
    )
