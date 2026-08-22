from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class RegulatorySource(Base):
    __tablename__ = "regulatory_sources"

    id: Mapped[UUID] = mapped_column(
	primary_key=True,
	default=uuid4,
	)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    authority: Mapped[str] = mapped_column(String(255), nullable=False)
    base_url: Mapped[str] = mapped_column(Text, nullable=False)
    source_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="web",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
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

    regulations = relationship(
        "Regulation",
        back_populates="source",
    )
