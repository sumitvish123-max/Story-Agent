// src/ui/components/MemoryPanel.jsx
// Shows memory status: summary + chunk list + compress button

export function MemoryPanel({ chunks, summary, onCompress, isLoading }) {
    return (
        <div style={styles.panel}>
            {/* How it works explanation */}
            <div style={styles.card}>
                <div style={styles.title}>How memory works</div>
                <p style={styles.text}>
                    Old chunks are compressed into a summary. New writing always
                    uses the summary + last {chunks.length} recent chunks as
                    context. Context stays small no matter how long the story
                    gets.
                </p>
            </div>

            {/* Summary box */}
            <div style={styles.card}>
                <div style={styles.sectionLabel}>Compressed summary</div>
                {summary ? (
                    <p style={styles.summaryText}>{summary}</p>
                ) : (
                    <p style={styles.empty}>
                        No summary yet. Will be created automatically after a
                        few chunks.
                    </p>
                )}
            </div>

            {/* Chunk list */}
            <div style={styles.card}>
                <div style={styles.sectionLabel}>
                    Recent chunks in context ({chunks.length})
                </div>
                {chunks.length === 0 ? (
                    <p style={styles.empty}>No chunks yet.</p>
                ) : (
                    chunks.map((chunk, i) => (
                        <div key={chunk.id} style={styles.chunkItem}>
                            <span style={styles.chunkLabel}>Chunk {i + 1}</span>
                            <span style={styles.chunkPreview}>
                                {chunk.polished.slice(0, 80)}...{" "}
                                {/* slice = Python's [:80] */}
                            </span>
                            <span style={styles.wordCount}>
                                {chunk.polished.split(" ").length}w{" "}
                                {/* split by space, count words */}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Compress button */}
            <button
                style={styles.compressBtn}
                onClick={onCompress}
                disabled={isLoading || chunks.length < 2}
            >
                {isLoading ? "Compressing..." : "Compress memory now"}
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// src/ui/components/SettingsPanel.jsx
// ─────────────────────────────────────────────────────────

import { useState } from "react";

export function SettingsPanel({ onSwitchModel, isLoading }) {
    const [selectedModel, setSelectedModel] = useState("gemini");

    const handleSwitch = () => {
        onSwitchModel(selectedModel);
    };

    return (
        <div style={styles.panel}>
            <div style={styles.card}>
                <div style={styles.title}>Model selection</div>

                {/* Model radio buttons */}
                <div style={styles.optionRow}>
                    <label style={styles.optionLabel}>
                        <input
                            type="radio"
                            value="gemini"
                            checked={selectedModel === "gemini"}
                            onChange={(e) => setSelectedModel(e.target.value)}
                        />
                        <span>
                            <strong>Gemini Flash</strong> — Cloud, fast, needs
                            API key
                        </span>
                    </label>
                </div>

                <div style={styles.optionRow}>
                    <label style={styles.optionLabel}>
                        <input
                            type="radio"
                            value="ollama"
                            checked={selectedModel === "ollama"}
                            onChange={(e) => setSelectedModel(e.target.value)}
                        />
                        <span>
                            <strong>Ollama (llama3)</strong> — Local, private,
                            no API key
                        </span>
                    </label>
                </div>

                <button
                    style={styles.switchBtn}
                    onClick={handleSwitch}
                    disabled={isLoading}
                >
                    {isLoading ? "Switching..." : "Apply"}
                </button>
            </div>

            {/* Setup instructions */}
            <div style={styles.card}>
                <div style={styles.title}>Setup guide</div>
                <div style={styles.step}>
                    <b>Gemini:</b> Get a free API key at aistudio.google.com →
                    paste in .env file
                </div>
                <div style={styles.step}>
                    <b>Ollama:</b> Install from ollama.ai → run{" "}
                    <code>ollama pull llama3</code> → then{" "}
                    <code>ollama serve</code>
                </div>
            </div>
        </div>
    );
}

// Shared styles for both panels
const styles = {
    panel: { display: "flex", flexDirection: "column", gap: "1rem" },
    card: {
        background: "white",
        border: "0.5px solid #e0e0e0",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
    },
    title: {
        fontSize: "14px",
        fontWeight: "500",
        color: "#1a1a1a",
        marginBottom: "8px",
    },
    text: { fontSize: "13px", color: "#666", lineHeight: "1.6" },
    sectionLabel: {
        fontSize: "11px",
        fontWeight: "500",
        color: "#999",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: "10px",
    },
    summaryText: {
        fontSize: "13px",
        color: "#333",
        lineHeight: "1.7",
        whiteSpace: "pre-wrap",
    },
    empty: { fontSize: "13px", color: "#aaa", fontStyle: "italic" },
    chunkItem: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "0.5px solid #f0f0f0",
    },
    chunkLabel: {
        fontSize: "11px",
        fontWeight: "500",
        color: "#555",
        minWidth: "55px",
    },
    chunkPreview: { fontSize: "12px", color: "#777", flex: 1 },
    wordCount: { fontSize: "11px", color: "#aaa" },
    compressBtn: {
        padding: "8px 18px",
        borderRadius: "8px",
        border: "0.5px solid #e0e0e0",
        background: "white",
        fontSize: "14px",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    optionRow: { marginBottom: "12px" },
    optionLabel: {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        cursor: "pointer",
        fontSize: "14px",
        color: "#333",
    },
    switchBtn: {
        marginTop: "8px",
        padding: "8px 18px",
        borderRadius: "8px",
        border: "none",
        background: "#1a1a1a",
        color: "white",
        fontSize: "14px",
        cursor: "pointer",
    },
    step: {
        fontSize: "13px",
        color: "#555",
        marginBottom: "8px",
        lineHeight: "1.6",
    },
};
