
// src/utils/textHelpers.js
// ─────────────────────────────────────────────────────────
// UTILITY FUNCTIONS — small helpers used across the frontend.
// Mirror of the Python utils/text_helpers.py
// ─────────────────────────────────────────────────────────


/**
 * Count words in a string.
 * .trim()   = remove leading/trailing whitespace (like Python's .strip())
 * .split()  = split into array  (like Python's .split())
 * .filter(Boolean) = remove empty strings from the array
 * .length   = array length      (like Python's len())
 */
export function wordCount(text) {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}


/**
 * Shorten text to maxChars for display (e.g. chunk previews in memory panel).
 * slice(0, n) is like Python's [:n]
 */
export function truncate(text, maxChars = 100) {
    if (!text) return "";
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trimEnd() + "...";
}


/**
 * Format a timestamp string into a readable date.
 * "2024-01-15T10:30:00" → "Jan 15, 10:30"
 *
 * new Date() = Python's datetime.fromisoformat()
 * toLocaleDateString() = format to local date string
 */
export function formatTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
        month: "short",   // "Jan"
        day: "numeric", // "15"
        hour: "2-digit", // "10"
        minute: "2-digit", // "30"
    });
}


/**
 * Join all chunks into one full story string.
 * chunks : array of { polished, ... } objects
 * .map() is like Python's list comprehension:
 *   chunks.map(c => c.polished)   ≈   [c.polished for c in chunks]
 * .join() is like Python's "\n\n".join(list)
 */
export function joinChunks(chunks) {
    return chunks.map(c => c.polished).join("\n\n");
}


/**
 * Copy text to clipboard.
 * Returns a Promise — use with await.
 * navigator.clipboard is the browser's clipboard API.
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}


/**
 * Download text as a .txt file.
 * Creates a temporary <a> link, clicks it, then removes it.
 * This is the standard JS trick for triggering file downloads.
 */
export function downloadAsText(text, filename = "story.txt") {
    // Blob = a file-like object in memory (like Python's BytesIO)
    const blob = new Blob([text], { type: "text/plain" });

    // URL.createObjectURL() creates a temporary URL pointing to the blob
    const url = URL.createObjectURL(blob);

    // Create a hidden <a> tag and click it to trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    // Clean up the temporary URL
    URL.revokeObjectURL(url);
}