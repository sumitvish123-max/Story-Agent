// src/App.jsx
// ─────────────────────────────────────────────────────────
// ROOT COMPONENT — the top of the React tree.
// This is the first component React renders.
// It wires together: the hook (state/logic) + all the UI panels.
//
// COMPONENT TREE:
//   App
//   ├── header (title + tab buttons)
//   ├── error toast
//   └── active tab panel:
//       ├── WritePanel
//       ├── StoryPanel
//       ├── MemoryPanel
//       └── SettingsPanel
// ─────────────────────────────────────────────────────────

import { useState } from "react";
import { useStory } from "./hooks/useStory";
import { WritePanel } from "./ui/components/WritePanel";
import { StoryPanel } from "./ui/components/StoryPanel";
import { MemoryPanel, SettingsPanel } from "./ui/components/SidePanels";

// Tab definitions — drives both the buttons and which panel renders
const TABS = [
    { id: "write", label: "Write" },
    { id: "story", label: "Story" },
    { id: "memory", label: "Memory" },
    { id: "settings", label: "Settings" },
];

export default function App() {
    // Active tab state — "write" | "story" | "memory" | "settings"
    const [activeTab, setActiveTab] = useState("write");

    // All story logic comes from the hook
    const {
        chunks,
        summary,
        isLoading,
        error,
        lastPolished,
        addInput,
        editChunk,
        compressMemory,
        resetStory,
        switchModel,
    } = useStory();

    // Word count of the full story
    const wordCount = chunks
        .map((c) => c.polished)
        .join(" ")
        .split(/\s+/) // split by any whitespace — \s+ is a regex like Python's \s+
        .filter(Boolean).length; // remove empty strings

    return (
        <div style={styles.app}>
            {/* ── Header ─────────────────────────────────────── */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Story Writer</h1>
                    <p style={styles.subtitle}>
                        Write rough — AI polishes, remembers, builds.
                    </p>
                </div>

                {/* Word count badge */}
                {wordCount > 0 && (
                    <div style={styles.wordBadge}>{wordCount} words</div>
                )}

                {/* Reset button */}
                <button
                    style={styles.resetBtn}
                    onClick={() => {
                        if (
                            window.confirm(
                                "Start a new story? This will clear everything.",
                            )
                        )
                            resetStory();
                    }}
                >
                    New Story
                </button>
            </div>

            {/* ── Tabs ───────────────────────────────────────── */}
            <div style={styles.tabs}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        style={{
                            ...styles.tab,
                            ...(activeTab === tab.id ? styles.tabActive : {}), // spread = merge objects
                        }}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        {/* Show chunk count badge on Story tab */}
                        {tab.id === "story" && chunks.length > 0 && (
                            <span style={styles.tabBadge}>{chunks.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Error Toast ────────────────────────────────── */}
            {error && <div style={styles.errorToast}>{error}</div>}

            {/* ── Active Panel ───────────────────────────────── */}
            <div style={styles.content}>
                {/* Conditional rendering — like Python's if/elif */}
                {activeTab === "write" && (
                    <WritePanel
                        isLoading={isLoading}
                        lastPolished={lastPolished}
                        onSubmit={addInput}
                    />
                )}

                {activeTab === "story" && (
                    <StoryPanel
                        chunks={chunks}
                        summary={summary}
                        onEditChunk={editChunk}
                    />
                )}

                {activeTab === "memory" && (
                    <MemoryPanel
                        chunks={chunks}
                        summary={summary}
                        onCompress={compressMemory}
                        isLoading={isLoading}
                    />
                )}

                {activeTab === "settings" && (
                    <SettingsPanel
                        onSwitchModel={switchModel}
                        isLoading={isLoading}
                    />
                )}
            </div>
        </div>
    );
}

const styles = {
    app: {
        maxWidth: "860px",
        margin: "0 auto",
        padding: "1.5rem 1rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
    },
    title: {
        fontSize: "20px",
        fontWeight: "500",
        margin: "0 0 2px",
        color: "#1a1a1a",
    },
    subtitle: {
        fontSize: "13px",
        color: "#888",
        margin: 0,
    },
    wordBadge: {
        marginLeft: "auto",
        background: "#E1F5EE",
        color: "#085041",
        fontSize: "12px",
        padding: "3px 10px",
        borderRadius: "6px",
        fontWeight: "500",
    },
    resetBtn: {
        padding: "6px 14px",
        borderRadius: "8px",
        border: "0.5px solid #e0e0e0",
        background: "white",
        fontSize: "13px",
        cursor: "pointer",
    },
    tabs: {
        display: "flex",
        gap: "4px",
        borderBottom: "0.5px solid #e0e0e0",
        marginBottom: "1.5rem",
    },
    tab: {
        padding: "8px 16px",
        fontSize: "14px",
        cursor: "pointer",
        border: "none",
        background: "none",
        color: "#888",
        borderBottom: "2px solid transparent",
        marginBottom: "-1px",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    tabActive: {
        color: "#1a1a1a",
        borderBottom: "2px solid #1a1a1a",
        fontWeight: "500",
    },
    tabBadge: {
        background: "#EEEDFE",
        color: "#3C3489",
        fontSize: "11px",
        padding: "1px 6px",
        borderRadius: "10px",
        fontWeight: "500",
    },
    errorToast: {
        background: "#fff0f0",
        border: "0.5px solid #ffcccc",
        color: "#a32d2d",
        fontSize: "13px",
        padding: "10px 14px",
        borderRadius: "8px",
        marginBottom: "1rem",
    },
    content: {
        minHeight: "400px",
    },
};
