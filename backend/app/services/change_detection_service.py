from difflib import SequenceMatcher
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.regulation import Regulation
from backend.app.models.regulation_change import RegulationChange
from backend.app.models.regulation_version import RegulationVersion


def _split_into_chunks(text: str, chunk_size: int = 1200) -> list[str]:
    if not text:
        return []

    paragraphs = [
        paragraph.strip()
        for paragraph in text.split("\n")
        if paragraph.strip()
    ]

    chunks = []
    current = ""

    for paragraph in paragraphs:
        if len(current) + len(paragraph) + 1 <= chunk_size:
            current = (
                f"{current}\n{paragraph}".strip()
            )
        else:
            if current:
                chunks.append(current)

            current = paragraph

    if current:
        chunks.append(current)

    return chunks


def _find_changed_sections(
    old_text: str,
    new_text: str,
) -> list[dict]:

    old_chunks = _split_into_chunks(old_text)
    new_chunks = _split_into_chunks(new_text)

    changes = []

    matcher = SequenceMatcher(
        None,
        old_chunks,
        new_chunks,
    )

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():

        if tag == "equal":
            continue

        old_section = "\n\n".join(
            old_chunks[i1:i2]
        )

        new_section = "\n\n".join(
            new_chunks[j1:j2]
        )

        if tag == "delete":
            change_type = "removed"

        elif tag == "insert":
            change_type = "added"

        else:
            change_type = "modified"

        changes.append(
            {
                "change_type": change_type,
                "previous_text": old_section,
                "new_text": new_section,
            }
        )

    return changes


def _classify_impact(
    changes: list[dict],
) -> str:

    if not changes:
        return "low"

    total_changed_chars = sum(
        len(change["previous_text"])
        + len(change["new_text"])
        for change in changes
    )

    if total_changed_chars > 5000:
        return "high"

    if total_changed_chars > 1500:
        return "medium"

    return "low"


def _build_summary(
    changes: list[dict],
) -> str:

    if not changes:
        return "No material textual changes detected."

    added = sum(
        1
        for change in changes
        if change["change_type"] == "added"
    )

    removed = sum(
        1
        for change in changes
        if change["change_type"] == "removed"
    )

    modified = sum(
        1
        for change in changes
        if change["change_type"] == "modified"
    )

    parts = []

    if added:
        parts.append(f"{added} section(s) added")

    if removed:
        parts.append(f"{removed} section(s) removed")

    if modified:
        parts.append(f"{modified} section(s) modified")

    return "Regulation update detected: " + ", ".join(parts) + "."


def detect_change(
    db: Session,
    regulation_id: UUID,
    previous_version_id: UUID | None,
    new_version_id: UUID,
) -> RegulationChange:

    regulation = db.get(
        Regulation,
        regulation_id,
    )

    if regulation is None:
        raise ValueError("Regulation not found")

    new_version = db.get(
        RegulationVersion,
        new_version_id,
    )

    if new_version is None:
        raise ValueError(
            "New regulation version not found"
        )

    previous_version = None

    if previous_version_id:
        previous_version = db.get(
            RegulationVersion,
            previous_version_id,
        )

        if previous_version is None:
            raise ValueError(
                "Previous regulation version not found"
            )

    old_text = (
        previous_version.extracted_text
        if previous_version
        else ""
    )

    new_text = (
        new_version.extracted_text or ""
    )

    changes = _find_changed_sections(
        old_text,
        new_text,
    )

    impact_level = _classify_impact(
        changes
    )

    change_summary = _build_summary(
        changes
    )

    affected_domains = []

    combined_text = " ".join(
        (
            change["previous_text"]
            + " "
            + change["new_text"]
        ).lower()
        for change in changes
    )

    domain_keywords = {
        "payments": [
            "payment",
            "transaction",
            "settlement",
            "merchant",
        ],
        "kyc": [
            "kyc",
            "customer due diligence",
            "identity",
            "verification",
        ],
        "lending": [
            "loan",
            "lending",
            "borrower",
            "repayment",
        ],
        "data_privacy": [
            "personal data",
            "data protection",
            "privacy",
            "consent",
        ],
        "reporting": [
            "report",
            "reporting",
            "return",
            "submission",
        ],
        "cybersecurity": [
            "cyber",
            "security",
            "incident",
            "authentication",
        ],
    }

    for domain, keywords in domain_keywords.items():
        if any(
            keyword in combined_text
            for keyword in keywords
        ):
            affected_domains.append(domain)

    change = RegulationChange(
        regulation_id=regulation_id,
        previous_version_id=previous_version_id,
        new_version_id=new_version_id,
        change_type=(
            changes[0]["change_type"]
            if changes
            else "no_change"
        ),
        change_summary=change_summary,
        impact_level=impact_level,
        affected_domains=affected_domains,
        ai_confidence=None,
    )

    db.add(change)
    db.commit()
    db.refresh(change)

    return change


def preview_change(
    db: Session,
    previous_version_id: UUID | None,
    new_version_id: UUID,
) -> dict:

    previous_version = None

    if previous_version_id:
        previous_version = db.get(
            RegulationVersion,
            previous_version_id,
        )

        if previous_version is None:
            raise ValueError(
                "Previous regulation version not found"
            )

    new_version = db.get(
        RegulationVersion,
        new_version_id,
    )

    if new_version is None:
        raise ValueError(
            "New regulation version not found"
        )

    old_text = (
        previous_version.extracted_text
        if previous_version
        else ""
    )

    new_text = (
        new_version.extracted_text or ""
    )

    changes = _find_changed_sections(
        old_text,
        new_text,
    )

    return {
        "change_count": len(changes),
        "changes": changes,
        "impact_level": _classify_impact(changes),
        "summary": _build_summary(changes),
    }
