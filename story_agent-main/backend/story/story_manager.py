# story/story_manager.py
# ─────────────────────────────────────────────────────────
# STORY MANAGER
# Orchestrates the whole story workflow.
# It connects MemoryManager + AIClient together.
# Think of it as the "director" — it tells everyone what to do.
# ─────────────────────────────────────────────────────────

from api.ai_client import AIClient
from memory.memory_manager import MemoryManager


class StoryManager:
    """
    Main controller for the story writing process.
    The Flask API routes will call methods on this class.
    """

    def __init__(self, ai_client: AIClient):
        self.ai_client      = ai_client
        self.memory_manager = MemoryManager(ai_client)  # pass AI client to memory manager

    def add_input(self, raw_text: str) -> dict:
        """
        Main action: user submits rough text → AI polishes it → stored in memory.
        Returns everything the frontend needs to update the UI.
        """
        # Step 1: Build the current story context
        context = self.memory_manager.build_context()

        # Step 2: Ask AI to polish the rough input
        polished = self.ai_client.polish(raw_text, context)

        # Step 3: Add the new chunk to memory (may trigger auto-compress)
        compressed = self.memory_manager.add_chunk(raw_text, polished)

        # Step 4: Return result to the API route
        return {
            "polished":   polished,
            "compressed": compressed,       # True if auto-compress happened
            "state":      self.memory_manager.get_state(),  # full updated state
        }

    def edit_chunk(self, chunk_id: int, instruction: str) -> dict:
        """
        User selected a paragraph and gave an instruction to change it.
        Returns the old text and the new rewritten text (for diff view).
        """
        # Find the chunk in memory
        chunk = self._find_chunk(chunk_id)
        if not chunk:
            raise ValueError(f"Chunk {chunk_id} not found")

        old_text = chunk.polished

        # Build context (summary only, not the chunk itself — AI shouldn't repeat it)
        context = self.memory_manager.memory.summary or ""

        # Ask AI to rewrite just that chunk
        new_text = self.ai_client.edit_chunk(old_text, instruction, context)

        # Replace the chunk in memory
        self.memory_manager.replace_chunk(chunk_id, new_text)

        return {
            "chunk_id": chunk_id,
            "old_text": old_text,
            "new_text": new_text,
            "state":    self.memory_manager.get_state(),
        }

    def compress_now(self) -> dict:
        """
        Manually trigger memory compression (user clicked 'Compress now' button).
        """
        self.memory_manager.compress()
        return {
            "message": "Compressed successfully",
            "state":   self.memory_manager.get_state(),
        }

    def get_state(self) -> dict:
        """Return the full story state (called when frontend loads/refreshes)."""
        return self.memory_manager.get_state()

    def reset(self):
        """Start a completely new story."""
        from memory.memory_manager import MemoryManager
        self.memory_manager = MemoryManager(self.ai_client)

    def load_story(self, data: dict):
        """Load a previously saved story from JSON data."""
        self.memory_manager.load_from_dict(data)

    def _find_chunk(self, chunk_id: int):
        """Private helper — find a chunk by its id."""
        for chunk in self.memory_manager.memory.chunks:
            if chunk.id == chunk_id:
                return chunk
        return None  # not found