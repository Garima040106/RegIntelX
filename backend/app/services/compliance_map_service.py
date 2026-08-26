from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from backend.app.models.compliance_map import ComplianceMap
from backend.app.models.regulation_change import RegulationChange


DOMAIN_ACTIONS = {
    "payments": {
        "team": "Payments",
        "action": "Review payment processing and transaction controls against the updated requirement.",
        "evidence": "Payment workflow configuration, transaction controls, and latest compliance review.",
    },
    "kyc": {
        "team": "KYC / Compliance",
        "action": "Review customer verification and KYC controls against the updated requirement.",
        "evidence": "KYC policy, verification workflow, and sample compliance records.",
    },
    "lending": {
        "team": "Lending / Risk",
        "action": "Review lending policies, borrower workflows, and repayment controls.",
        "evidence": "Lending policy, underwriting rules, and repayment workflow documentation.",
    },
    "data_privacy": {
        "team": "Privacy / Engineering",
        "action": "Review personal-data handling, consent, retention, and privacy controls.",
        "evidence": "Data-flow documentation, consent records, and privacy policy.",
    },
    "reporting": {
        "team": "Regulatory Reporting",
        "action": "Review regulatory reporting workflows and confirm the updated requirement is reflected.",
        "evidence": "Reporting configuration, latest regulatory return, and submission evidence.",
    },
    "cybersecurity": {
        "team": "Security",
        "action": "Review security controls, authentication, and incident-response procedures.",
        "evidence": "Security controls, incident-response policy, and latest control assessment.",
    },
}


def _priority_from_impact(impact_level: str) -> str:
    impact = (impact_level or "medium").lower()

    if impact == "high":
        return "high"

    if impact == "low":
        return "low"

    return "medium"


def _risk_score_from_impact(impact_level: str) -> Decimal:
    impact = (impact_level or "medium").lower()

    scores = {
        "low": Decimal("25.00"),
        "medium": Decimal("55.00"),
        "high": Decimal("85.00"),
    }

    return scores.get(
        impact,
        Decimal("55.00"),
    )


def _due_date_from_impact(impact_level: str) -> date:
    impact = (impact_level or "medium").lower()

    days = {
        "high": 7,
        "medium": 14,
        "low": 30,
    }

    return date.today() + timedelta(
        days=days.get(impact, 14)
    )


def create_maps_for_change(
    db: Session,
    change_id: UUID,
) -> list[ComplianceMap]:

    change = db.get(
        RegulationChange,
        change_id,
    )

    if change is None:
        raise ValueError(
            "Regulation change not found"
        )

    existing_maps = (
        db.query(ComplianceMap)
        .filter(
            ComplianceMap.change_id == change_id
        )
        .all()
    )

    if existing_maps:
        return existing_maps

    domains = change.affected_domains or []

    if not domains:
        domains = ["reporting"]

    priority = _priority_from_impact(
        change.impact_level
    )

    risk_score = _risk_score_from_impact(
        change.impact_level
    )

    due_date = _due_date_from_impact(
        change.impact_level
    )

    created_maps = []

    for domain in domains:
        action = DOMAIN_ACTIONS.get(
            domain,
            {
                "team": "Compliance",
                "action": "Review the updated regulation and determine the required business and control changes.",
                "evidence": "Documented compliance assessment and supporting control evidence.",
            },
        )

        title = (
            f"{action['team']}: "
            f"Review regulatory change"
        )

        description = (
            f"{change.change_summary} "
            f"{action['action']}"
        )

        compliance_map = ComplianceMap(
            regulation_id=change.regulation_id,
            change_id=change.id,
            title=title,
            description=description,
            priority=priority,
            status="pending",
            due_date=due_date,
            risk_score=risk_score,
            required_evidence=action["evidence"],
        )

        db.add(compliance_map)
        created_maps.append(compliance_map)

    db.commit()

    for compliance_map in created_maps:
        db.refresh(compliance_map)

    return created_maps
