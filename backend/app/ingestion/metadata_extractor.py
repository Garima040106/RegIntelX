import re
from dataclasses import dataclass
from datetime import date


@dataclass
class RegulationMetadata:
    title: str | None
    circular_number: str | None
    issue_date: date | None
    effective_date: date | None


DATE_PATTERN = r"(\d{1,2}[/-]\d{1,2}[/-]\d{4})"


def _parse_date(value: str) -> date | None:
    for fmt in ("%d/%m/%Y", "%d-%m-%Y"):
        try:
            from datetime import datetime

            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue

    return None


def extract_metadata(text: str) -> RegulationMetadata:
    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    title = lines[0] if lines else None

    circular_number = None

    circular_patterns = [
        r"(?:Circular|Notification)\s*(?:No\.?|Number)?\s*[:\-]?\s*([A-Z0-9./_-]+)",
        r"\b([A-Z]{2,10}/\d{1,4}/\d{1,4}/\d{4})\b",
    ]

    for pattern in circular_patterns:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            circular_number = match.group(1)
            break

    dates = re.findall(DATE_PATTERN, text)

    issue_date = _parse_date(dates[0]) if dates else None
    effective_date = _parse_date(dates[1]) if len(dates) > 1 else None

    return RegulationMetadata(
        title=title,
        circular_number=circular_number,
        issue_date=issue_date,
        effective_date=effective_date,
    )
