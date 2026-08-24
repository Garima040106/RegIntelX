import re
from dataclasses import dataclass


@dataclass
class RegulationSummary:
    summary: str
    key_points: list[str]


def clean_line(line: str) -> str:
    return " ".join(line.split()).strip()


def is_contact_or_header(line: str) -> bool:
    lower = line.lower()

    patterns = [
        "tel:",
        "telephone",
        "email:",
        "e-mail:",
        "fax:",
        "www.rbi.org.in",
        "rbi.org.in",
        "हिंदी आसान है",
        "इसका प्रयोग",
        "मुंबई - 400001",
        "mumbai - 400001",
        "central office building",
        "department of regulation",
        "department of supervision",
        "caution: rbi never sends",
    ]

    return any(pattern in lower for pattern in patterns)


def is_toc_line(line: str) -> bool:
    # Typical RBI table-of-contents entries.
    if "................................................................" in line:
        return True

    # Lines ending in a page number.
    if re.search(r"\.{3,}\s*\d+\s*$", line):
        return True

    return False


def is_noise(line: str) -> bool:
    if len(line) < 25:
        return True

    if is_contact_or_header(line):
        return True

    if is_toc_line(line):
        return True

    return False


def find_body_start(lines: list[str]) -> int:
    """
    Try to find where the actual regulatory document begins.
    RBI documents commonly have an Introduction or numbered paragraph
    after the title/header/table of contents.
    """

    for i, line in enumerate(lines):
        lower = line.lower()

        if lower in {
            "introduction",
            "background",
            "applicability",
            "short title and commencement",
        }:
            # Prefer a nearby substantive paragraph.
            for j in range(i + 1, min(i + 8, len(lines))):
                if len(lines[j]) > 60 and not is_noise(lines[j]):
                    return j

        # Numbered regulatory paragraphs such as:
        # "1. These Directions..."
        if re.match(r"^\d+\.\s+", line):
            return i

        # Paragraphs beginning with common regulatory language.
        if re.match(
            r"^(these directions|these guidelines|the reserve bank|"
            r"it has been decided|in exercise of|pursuant to)",
            lower,
        ):
            return i

    return 0


def extract_summary(text: str) -> RegulationSummary:
    if not text:
        return RegulationSummary(
            summary="No text available.",
            key_points=[],
        )

    raw_lines = [
        clean_line(line)
        for line in text.splitlines()
    ]

    raw_lines = [
        line
        for line in raw_lines
        if line
    ]

    start = find_body_start(raw_lines)

    lines = raw_lines[start:]

    lines = [
        line
        for line in lines
        if not is_noise(line)
    ]

    if not lines:
        return RegulationSummary(
            summary="No usable regulatory text found.",
            key_points=[],
        )

    body = " ".join(lines)

    # Remove repeated whitespace and obvious page-number fragments.
    body = re.sub(r"\s+", " ", body).strip()

    sentences = re.split(
        r"(?<=[.!?])\s+",
        body,
    )

    sentences = [
        sentence.strip()
        for sentence in sentences
        if len(sentence.strip()) >= 50
    ]

    # Avoid producing an enormous raw extract.
    key_points = sentences[:6]

    summary = " ".join(key_points)

    if len(summary) > 2000:
        summary = (
            summary[:2000]
            .rsplit(" ", 1)[0]
            + "..."
        )

    return RegulationSummary(
        summary=summary,
        key_points=key_points,
    )
