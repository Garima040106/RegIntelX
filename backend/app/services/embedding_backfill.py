from sqlalchemy import select

from backend.app.core.database import SessionLocal
from backend.app.models.regulation_version import RegulationVersion
from backend.app.services.embedding_service import generate_embedding


def backfill_embeddings():
    db = SessionLocal()

    try:
        versions = db.scalars(
            select(RegulationVersion)
            .where(
                RegulationVersion.embedding.is_(None),
                RegulationVersion.extracted_text.is_not(None),
            )
            .order_by(RegulationVersion.created_at)
        ).all()

        total = len(versions)
        processed = 0
        skipped = 0
        failed = 0

        print("Versions needing embeddings:", total)

        for version in versions:
            text = version.extracted_text.strip()

            if not text:
                skipped += 1
                continue

            try:
                version.embedding = generate_embedding(text)
                db.commit()

                processed += 1

                print(
                    f"[{processed}/{total}] "
                    f"Version {version.version_number} embedded"
                )

            except Exception as exc:
                db.rollback()
                failed += 1

                print(
                    f"FAILED version {version.id}: {exc}"
                )

        print("\n===== BACKFILL COMPLETE =====")
        print("Processed:", processed)
        print("Skipped:", skipped)
        print("Failed:", failed)

    finally:
        db.close()


if __name__ == "__main__":
    backfill_embeddings()
