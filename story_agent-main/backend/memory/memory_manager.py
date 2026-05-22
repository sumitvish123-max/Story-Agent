# memory/memory_manager.py
# ─────────────────────────────────────────────────────────
# MEMORY MANAGER
# Handles the rolling summary + recent chunks system.
# This is what keeps the AI context small even for long stories.
# ─────────────────────────────────────────────────────────

from dataclasses import dataclass, field, asdict  # dataclass = cleaner way to define data objects
from typing import List, Optional
from config import MEMORY_CONFIG


@dataclass
class Chunk:
    """
    Represents one polished paragraph/chunk of the story.
    dataclass automatically creates __init__, __repr__ etc.
    """
    id:        int          # unique number for this chunk  e.g. 1, 2, 3
    raw:       str          # what the user typed (rough)
    polished:  str          # what the AI returned (clean)
    timestamp: str          # when it was created  e.g. "2024-01-15T10:30:00"

    def to_dict(self):
        """Convert to plain dictionary (needed for JSON serialization)."""
        return asdict(self)


@dataclass
class StoryMemory:
    """
    The full memory state of a story.
    This is what gets saved to disk / sent to frontend.
    """
    chunks:            List[Chunk] = field(default_factory=list)  # recent chunks kept in full
    summary:           str = ""        # compressed summary of older chunks
    total_chunks_ever: int = 0         # counter — never resets, even after compression
    title:             str = "Untitled Story"

    def to_dict(self):
        return {
            "chunks":            [c.to_dict() for c in self.chunks],
            "summary":           self.summary,
            "total_chunks_ever": self.total_chunks_ever,
            "title":             self.title,
        }

    @classmethod
    def from_dict(cls, data: dict):
        """Rebuild a StoryMemory object from a saved dictionary."""
        chunks = [Chunk(**c) for c in data.get("chunks", [])]
        return cls(
            chunks=chunks,
            summary=data.get("summary", ""),
            total_chunks_ever=data.get("total_chunks_ever", 0),
            title=data.get("title", "Untitled Story"),
        )


class MemoryManager:
    """
    Manages the story's memory — adding chunks, compressing when needed.
    Does NOT call the AI directly; it receives the AI client as a dependency.
    This is called "dependency injection" — makes testing easier.
    """

    def __init__(self, ai_client):
        self.ai_client = ai_client  # GeminiClient or OllamaClient
        self.memory    = StoryMemory()

    def add_chunk(self, raw: str, polished: str) -> bool:
        """
        Add a new polished chunk to memory.
        Returns True if compression was triggered, False otherwise.
        """
        from datetime import datetime

        self.memory.total_chunks_ever += 1

        new_chunk = Chunk(
            id=self.memory.total_chunks_ever,
            raw=raw,
            polished=polished,
            timestamp=datetime.now().isoformat(),  # ISO format: "2024-01-15T10:30:00"
        )
        self.memory.chunks.append(new_chunk)

        # Check if we should auto-compress
        new_chunks_since_last_compress = len(self.memory.chunks)  # chunks not yet summarized
        should_compress = new_chunks_since_last_compress >= MEMORY_CONFIG["max_chunks_before_compress"]

        if should_compress:
            self.compress()
            return True  # tells caller that compression happened

        return False

    def compress(self):
        """
        Compress all current chunks into a summary.
        After compression: summary is updated, old chunks are deleted,
        only the last N recent chunks are kept in full.
        """
        if len(self.memory.chunks) < 2:
            return  # not enough chunks to bother compressing

        # Build the full story text from ALL current chunks
        full_text = "\n\n".join(chunk.polished for chunk in self.memory.chunks)

        # If there's already an older summary, include it so we don't lose that history
        if self.memory.summary:
            full_text = f"[Earlier summary]\n{self.memory.summary}\n\n[Recent chapters]\n{full_text}"

        # Ask the AI to summarize everything
        self.memory.summary = self.ai_client.summarize(full_text)

        # Keep only the last N chunks in full detail
        keep = MEMORY_CONFIG["recent_chunks_to_keep"]
        self.memory.chunks = self.memory.chunks[-keep:]  # Python slice: last N items

    def build_context(self) -> str:
        """
        Build the context string that gets sent with every AI request.
        Format: summary (if exists) + recent chunks.
        This is what keeps the AI aware of the full story.
        """
        parts = []  # we'll join these into one string at the end

        if self.memory.summary:
            parts.append(f"STORY SUMMARY (earlier events):\n{self.memory.summary}")

        if self.memory.chunks:
            recent_text = "\n\n".join(c.polished for c in self.memory.chunks)
            parts.append(f"RECENT STORY:\n{recent_text}")

        return "\n\n---\n\n".join(parts)  # join with a separator line

    def replace_chunk(self, chunk_id: int, new_text: str):
        """
        Replace one chunk's polished text (used by the select-to-edit feature).
        Finds the chunk by its id and updates it.
        """
        for chunk in self.memory.chunks:
            if chunk.id == chunk_id:
                chunk.polished = new_text
                return
        raise ValueError(f"Chunk with id {chunk_id} not found in recent chunks.")

    def load_from_dict(self, data: dict):
        """Load a previously saved story into memory."""
        self.memory = StoryMemory.from_dict(data)

    def get_state(self) -> dict:
        """Return the current memory state as a dictionary (for saving / sending to frontend)."""
        return self.memory.to_dict()