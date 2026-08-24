import re
from dataclasses import dataclass
from datetime import date, datetime


@dataclass
class RegulationMetadata:
    title: str | None
    circular_number: str | None
    issue_date: date | None
    effective_date: date | None


DATE_PATTERNS = [
    r"\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b",
    r"\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b",
    r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b",
]


def _parse_date(value: str) -> date | None:
    formats = (
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%d %B %Y",
        "%B %d, %Y",
    )

    for fmt in formats:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            pass

    return None


def _find_date(text: str) -> date | None:
    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            parsed = _parse_date(match.group(0))
            if parsed:
                return parsed

    return None


def _extract_circular_number(text: str) -> str | None:
    patterns = [
        r"\bRBI/\d{4}-\d{2}/\d{1,4}\b",
        r"\bRBI/\d{4}-\d{2,4}/\d{1,4}\b",
        r"\bRBI/[A-Z]{2,10}/\d{4}-\d{2}/\d{1,4}\b",
        r"\b[A-Z]{2,10}\.[A-Z]{2,10}\.[A-Z0-9.]+/\d{1,4}/\d{1,4}/\d{4}-\d{2}\b",
        r"\b[A-Z]{2,10}/[A-Z0-9.-]+/\d{4}-\d{2}\b",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            return match.group(0).strip()

    explicit_patterns = [
        r"(?:Circular|Notification|Letter)\s*(?:No\.?|Number)?\s*[:\-]?\s*([A-Z0-9./_-]+)",
    ]

    for pattern in explicit_patterns:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            return match.group(1).strip()

    return None


def _extract_title(lines: list[str]) -> str | None:
    skip_patterns = [
        r"^reserve bank of india$",
        r"^भारतीय",
        r"^www\\.rbi\\.org\\.in$",
        r"^notifications?$",
        r"^circulars?$",
        r"^notification$",
        r"^circular no",
        r"^rbi/",
        r"^ref\\.",
        r"^dated?:?$",
    ]

    candidates = []

    for line in lines[:100]:
        cleaned = " ".join(line.split()).strip()

        if len(cleaned) < 5:
            continue

        lower = cleaned.lower()

        if any(re.search(pattern, lower) for pattern in skip_patterns):
            continue

        if re.fullmatch(r"[\\d\\s./:-]+", cleaned):
            continue

        if "www.rbi.org.in" in lower:
            continue

        if lower.startswith((
            "please refer",
            "in exercise",
            "the reserve bank",
            "table of contents",
            "chapter i",
            "chapter ii",
            "contents",
        )):
            continue

        candidates.append(cleaned)

    title_keywords = (
        "directions",
        "master direction",
        "framework",
        "guidelines",
        "amendment",
        "notification",
        "circular",
        "sanctions list",
    )

    # First prefer a complete-looking title line.
    for candidate in candidates:
        lower = candidate.lower()

        if any(keyword in lower for keyword in title_keywords):
            # Remove common PDF table-of-contents contamination.
            for marker in (
                " table of contents",
                " contents ",
                " chapter i ",
            ):
                position = lower.find(marker)

                if position != -1:
                    candidate = candidate[:position].strip()
                    break

            # Ignore lines that are clearly body text.
            if len(candidate) > 500:
                continue

            return candidate[:500]

    return candidates[0][:500] if candidates else None

def extract_metadata(text: str) -> RegulationMetadata:
    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    title = _extract_title(lines)

    circular_number = _extract_circular_number(text)

    # RBI documents normally put the issue date near the circular number.
    issue_date = None

    for line in lines[:80]:
        if re.search(r"\bRBI/", line, re.IGNORECASE):
            issue_date = _find_date(line)

            if issue_date:
                break

    if issue_date is None:
        issue_date = _find_date(text[:10000])

    effective_date = None

    effective_patterns = [
        r"(?:effective|applicable|come into force|with effect from)"
        r".{0,80}?("
        + "|".join(DATE_PATTERNS)
        + r")"
    ]

    for pattern in effective_patterns:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            effective_date = _parse_date(match.group(1))
            if effective_date:
                break

    return RegulationMetadata(
        title=title,
        circular_number=circular_number,
        issue_date=issue_date,
        effective_date=effective_date,
    )
