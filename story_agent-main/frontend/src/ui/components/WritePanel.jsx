// src/ui/components/WritePanel.jsx
// ─────────────────────────────────────────────────────────
// WRITE PANEL — the main input area.
// User types rough text here, clicks Polish, sees the AI output.
//
// WHAT IS JSX?
// JSX looks like HTML but it's JavaScript. React converts it to real DOM.
//   <div className="box">Hello</div>
// Note: use "className" not "class" (class is a reserved word in JS).
//
// PROPS — like function arguments in Python:
//   function WritePanel({ isLoading, onSubmit }) { ... }
//   is like    def write_panel(is_loading, on_submit): ...
//   The parent passes props:  <WritePanel isLoading={true} onSubmit={fn} />
// ─────────────────────────────────────────────────────────

import { useState } from "react";

// Props this component receives from App.jsx:
// isLoading    — bool: show spinner while AI is working
// lastPolished — string: the most recent AI output
// onSubmit     — function: called when user clicks Polish

export function WritePanel({ isLoading, lastPolished, onSubmit }) {
    // Local state — only this component cares about the textarea value
    const [rawText, setRawText] = useState("");

    // Called when user clicks the button
    const handleSubmit = async () => {
        if (!rawText.trim()) return; // do nothing if empty. .trim() removes whitespace

        const result = await onSubmit(rawText); // calls addInput() from useStory
        if (result) {
            setRawText(""); // clear the textarea only if AI succeeded
        }
    };

    // Handle Ctrl+Enter to submit (keyboard shortcut)
    const handleKeyDown = (e) => {
        // e.ctrlKey = Ctrl held, e.key = which key was pressed
        if (e.ctrlKey && e.key === "Enter") {
            handleSubmit();
        }
    };

    return (
        <div style={styles.panel}>
            {/* Input section */}
            <div style={styles.card}>
                <label style={styles.label}>Your rough input</label>
                <p style={styles.hint}>
                    Just write freely — bad grammar, incomplete sentences,
                    anything.
                </p>

                <textarea
                    style={styles.textarea}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)} // update state on every keystroke
                    onKeyDown={handleKeyDown}
                    placeholder={
                        "e.g. 'girl go market forget money, meet old man give apple but feel suspicious'"
                    }
                    rows={5}
                    disabled={isLoading} // disable while AI is working
                />

                <div style={styles.buttonRow}>
                    <button
                        style={{
                            ...styles.button,
                            ...(isLoading ? styles.buttonDisabled : {}),
                        }}
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? "Polishing..." : "Polish & Add to Story"}
                    </button>

                    <button
                        style={styles.buttonSecondary}
                        onClick={() => setRawText("")}
                        disabled={isLoading}
                    >
                        Clear
                    </button>

                    <span style={styles.hint}>or Ctrl+Enter</span>
                </div>
            </div>

            {/* Output section — only shows if there's output */}
            {lastPolished && (
                <div style={styles.card}>
                    <label style={styles.label}>Latest polished output</label>
                    <div style={styles.output}>{lastPolished}</div>
                </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
                <div style={styles.loadingRow}>
                    <div style={styles.spinner} />
                    <span style={styles.hint}>AI is writing...</span>
                </div>
            )}
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────
// In React, styles are JS objects. CSS property names are camelCase:
//   CSS: font-size: 14px   →   JS: fontSize: "14px"
//   CSS: background-color  →   JS: backgroundColor
const styles = {
    panel: {
        display: "flex",
        flexDirection: "column", // stack children vertically
        gap: "1rem", // space between children
    },
    card: {
        background: "white",
        border: "0.5px solid #e0e0e0",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
    },
    label: {
        fontSize: "11px",
        fontWeight: "500",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#888",
        display: "block",
        marginBottom: "6px",
    },
    hint: {
        fontSize: "12px",
        color: "#999",
        marginBottom: "8px",
    },
    textarea: {
        width: "100%",
        border: "0.5px solid #e0e0e0",
        borderRadius: "8px",
        padding: "10px 12px",
        fontSize: "14px",
        lineHeight: "1.6",
        resize: "vertical", // user can drag to resize vertically
        fontFamily: "inherit", // use same font as the rest of the app
        boxSizing: "border-box", // include padding in width calculation
    },
    buttonRow: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        marginTop: "10px",
        flexWrap: "wrap",
    },
    button: {
        padding: "8px 18px",
        borderRadius: "8px",
        fontSize: "14px",
        cursor: "pointer",
        border: "none",
        background: "#1a1a1a",
        color: "white",
        fontFamily: "inherit",
    },
    buttonDisabled: {
        opacity: 0.5,
        cursor: "not-allowed",
    },
    buttonSecondary: {
        padding: "8px 18px",
        borderRadius: "8px",
        fontSize: "14px",
        cursor: "pointer",
        border: "0.5px solid #e0e0e0",
        background: "white",
        fontFamily: "inherit",
    },
    output: {
        background: "#f9f9f9",
        borderRadius: "8px",
        padding: "1rem 1.25rem",
        fontSize: "14px",
        lineHeight: "1.8",
        whiteSpace: "pre-wrap", // preserve line breaks
    },
    loadingRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 0",
    },
    spinner: {
        width: "16px",
        height: "16px",
        border: "2px solid #e0e0e0",
        borderTopColor: "#333",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },
};
