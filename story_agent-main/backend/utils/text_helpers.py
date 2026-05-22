# utils/text_helpers.py
# ─────────────────────────────────────────────────────────
# UTILITY FUNCTIONS — small helpers used across the backend.
# Pure functions: they take input and return output, no side effects.
# ─────────────────────────────────────────────────────────


def word_count(text: str) -> int:
    """Count words in a string. Splits on any whitespace."""
    if not text or not text.strip():
        return 0
    return len(text.split())


def truncate(text: str, max_chars: int = 100) -> str:
    """
    Shorten text to max_chars for display (e.g. chunk previews).
    Adds '...' if truncated.
    """
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "..."


def join_chunks(chunks: list, separator: str = "\n\n") -> str:
    """
    Join a list of chunk objects into one story string.
    chunks    : list of Chunk dataclass objects
    separator : what to put between paragraphs
    """
    return separator.join(chunk.polished for chunk in chunks)


def build_diff(old_text: str, new_text: str) -> dict:
    """
    Simple diff — returns old and new side by side.
    A proper word-level diff can be added later with the 'difflib' library.
    For now the frontend just shows old vs new in two boxes.
    """
    return {
        "old": old_text,
        "new": new_text,
        "changed": old_text != new_text,
    }