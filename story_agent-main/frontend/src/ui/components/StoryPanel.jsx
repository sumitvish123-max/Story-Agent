// src/ui/components/StoryPanel.jsx
// ─────────────────────────────────────────────────────────
// STORY PANEL — shows the full story, chunk by chunk.
// KEY FEATURE: user can click any chunk to open the edit chat.
// ─────────────────────────────────────────────────────────

import { useState } from "react";

// Props:
// chunks      — array of chunk objects from useStory
// summary     — the compressed memory string
// onEditChunk — function: called when user submits an edit instruction

export function StoryPanel({ chunks, summary, onEditChunk }) {
    // Which chunk is currently selected for editing? null = none selected
    const [selectedChunk, setSelectedChunk] = useState(null);

    // The edit instruction the user types
    const [instruction, setInstruction] = useState("");

    // Diff view state — shows old vs new after an edit
    const [diff, setDiff] = useState(null); // { oldText, newText } or null

    const [isEditing, setIsEditing] = useState(false);

    // Called when user clicks "Edit this" on a chunk
    const openEdit = (chunk) => {
        setSelectedChunk(chunk);
        setInstruction(""); // clear previous instruction
        setDiff(null); // clear previous diff
    };

    const closeEdit = () => {
        setSelectedChunk(null);
        setDiff(null);
    };

    // Called when user submits the edit instruction
    const submitEdit = async () => {
        if (!instruction.trim() || !selectedChunk) return;

        setIsEditing(true);
        const result = await onEditChunk(selectedChunk.id, instruction);
        setIsEditing(false);

        if (result) {
            setDiff({ oldText: result.oldText, newText: result.newText });
        }
    };

    // User accepted the edit — close the panel
    const acceptEdit = () => {
        closeEdit();
    };

    if (chunks.length === 0 && !summary) {
        return (
            <div style={styles.empty}>
                Your story will appear here as you add content...
            </div>
        );
    }

    return (
        <div style={styles.panel}>
            {/* Summary badge — shows if memory has been compressed */}
            {summary && (
                <div style={styles.summaryBadge}>
                    Earlier events compressed into memory
                </div>
            )}

            {/* Chunk list */}
            {chunks.map((chunk, index) => (
                <div key={chunk.id} style={styles.chunkWrapper}>
                    {/* Chunk header */}
                    <div style={styles.chunkHeader}>
                        <span style={styles.chunkNum}>Part {index + 1}</span>
                        <button
                            style={styles.editBtn}
                            onClick={() => openEdit(chunk)}
                        >
                            Edit this chunk
                        </button>
                    </div>

                    {/* Chunk text */}
                    <p style={styles.chunkText}>{chunk.polished}</p>
                </div>
            ))}

            {/* ── Edit Panel (appears below when a chunk is selected) ── */}
            {selectedChunk && (
                <div style={styles.editPanel}>
                    <div style={styles.editHeader}>
                        <span style={styles.editTitle}>
                            Editing: Part{" "}
                            {chunks.findIndex(
                                (c) => c.id === selectedChunk.id,
                            ) + 1}
                        </span>
                        <button style={styles.closeBtn} onClick={closeEdit}>
                            ✕
                        </button>
                    </div>

                    {/* Show the chunk text as context */}
                    <div style={styles.selectedText}>
                        {selectedChunk.polished}
                    </div>

                    {/* Diff view — appears after AI rewrites */}
                    {diff ? (
                        <div style={styles.diffBox}>
                            <div style={styles.diffOld}>
                                <div style={styles.diffLabel}>Before</div>
                                <p style={styles.diffText}>{diff.oldText}</p>
                            </div>
                            <div style={styles.diffNew}>
                                <div style={styles.diffLabel}>
                                    After (AI rewrite)
                                </div>
                                <p style={styles.diffText}>{diff.newText}</p>
                            </div>
                            <div style={styles.diffActions}>
                                <button
                                    style={styles.acceptBtn}
                                    onClick={acceptEdit}
                                >
                                    Accept
                                </button>
                                <button
                                    style={styles.rejectBtn}
                                    onClick={() => setDiff(null)}
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Instruction input */
                        <div>
                            <label style={styles.label}>
                                What do you want to change?
                            </label>
                            <textarea
                                style={styles.instructionInput}
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                placeholder="e.g. make this more dramatic, fix the dialogue, add more description..."
                                rows={3}
                            />
                            <div style={styles.buttonRow}>
                                <button
                                    style={styles.submitBtn}
                                    onClick={submitEdit}
                                    disabled={isEditing}
                                >
                                    {isEditing
                                        ? "Rewriting..."
                                        : "Rewrite this chunk"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    panel: { display: "flex", flexDirection: "column", gap: "1rem" },
    empty: {
        color: "#999",
        fontSize: "14px",
        padding: "2rem",
        textAlign: "center",
        fontStyle: "italic",
    },
    summaryBadge: {
        background: "#E1F5EE",
        color: "#085041",
        fontSize: "12px",
        padding: "6px 12px",
        borderRadius: "6px",
        textAlign: "center",
    },
    chunkWrapper: {
        background: "white",
        border: "0.5px solid #e0e0e0",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
    },
    chunkHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
    },
    chunkNum: {
        fontSize: "11px",
        fontWeight: "500",
        color: "#999",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
    },
    editBtn: {
        fontSize: "12px",
        padding: "4px 10px",
        borderRadius: "6px",
        border: "0.5px solid #e0e0e0",
        background: "white",
        cursor: "pointer",
        color: "#555",
    },
    chunkText: {
        fontSize: "15px",
        lineHeight: "1.9",
        color: "#1a1a1a",
        margin: 0,
        whiteSpace: "pre-wrap",
    },
    editPanel: {
        background: "#f8f8ff",
        border: "1px solid #c8c5f5",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
    },
    editHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
    },
    editTitle: { fontSize: "13px", fontWeight: "500", color: "#333" },
    closeBtn: {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "16px",
        color: "#999",
    },
    selectedText: {
        background: "#eeedf8",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "13px",
        color: "#444",
        marginBottom: "12px",
        lineHeight: "1.7",
    },
    label: {
        fontSize: "12px",
        color: "#777",
        display: "block",
        marginBottom: "6px",
    },
    instructionInput: {
        width: "100%",
        border: "0.5px solid #ddd",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "13px",
        fontFamily: "inherit",
        boxSizing: "border-box",
        resize: "vertical",
    },
    buttonRow: { display: "flex", gap: "8px", marginTop: "8px" },
    submitBtn: {
        padding: "7px 16px",
        borderRadius: "8px",
        border: "none",
        background: "#534AB7",
        color: "white",
        fontSize: "13px",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    diffBox: { display: "flex", flexDirection: "column", gap: "10px" },
    diffOld: {
        background: "#fff0f0",
        borderRadius: "8px",
        padding: "10px 14px",
    },
    diffNew: {
        background: "#f0fff4",
        borderRadius: "8px",
        padding: "10px 14px",
    },
    diffLabel: {
        fontSize: "11px",
        fontWeight: "500",
        color: "#888",
        marginBottom: "6px",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
    },
    diffText: { fontSize: "13px", lineHeight: "1.7", margin: 0, color: "#333" },
    diffActions: { display: "flex", gap: "8px" },
    acceptBtn: {
        padding: "7px 16px",
        borderRadius: "8px",
        border: "none",
        background: "#1D9E75",
        color: "white",
        fontSize: "13px",
        cursor: "pointer",
    },
    rejectBtn: {
        padding: "7px 16px",
        borderRadius: "8px",
        border: "0.5px solid #ddd",
        background: "white",
        fontSize: "13px",
        cursor: "pointer",
    },
};
