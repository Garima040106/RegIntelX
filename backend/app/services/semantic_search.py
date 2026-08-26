from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.regulation import Regulation
from backend.app.models.regulation_version import RegulationVersion
from backend.app.services.embedding_service import generate_embedding


def semantic_search(
    db: Session,
    query: str,
    limit: int = 10,
):
    query_embedding = generate_embedding(query)

    distance = RegulationVersion.embedding.cosine_distance(
        query_embedding
    )

    rows = db.execute(
        select(
            Regulation,
            RegulationVersion,
            distance.label("distance"),
        )
        .join(
            RegulationVersion,
            RegulationVersion.regulation_id == Regulation.id,
        )
        .where(
            RegulationVersion.embedding.is_not(None)
        )
        .order_by(distance)
        .limit(limit)
    ).all()

    results = []

    for regulation, version, distance_value in rows:
        results.append(
            {
                "regulation_id": str(regulation.id),
                "title": regulation.title,
                "circular_number": regulation.circular_number,
                "published_date": regulation.published_date,
                "effective_date": regulation.effective_date,
                "source_url": regulation.source_url,
                "version_id": str(version.id),
                "version_number": version.version_number,
                "similarity": round(
                    1 - float(distance_value),
                    4,
                ),
                "evidence": (
                    version.extracted_text[:4000]
                    if version.extracted_text
                    else None
                ),
            }
        )

    return results
