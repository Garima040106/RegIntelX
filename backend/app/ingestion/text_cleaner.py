import re


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")

    # Normalize whitespace while preserving paragraph breaks.
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Join words split across lines with a hyphen.
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)

    return text.strip()
