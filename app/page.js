"use client";

import { useState } from "react";

const EXAMPLE_INPUT = `A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->`;

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);

  async function handleSubmit() {
    setError("");
    setResult(null);
    setShowJson(false);

    const raw = input.trim();
    if (!raw) {
      setError("Please enter at least one node relationship.");
      return;
    }

    // Parse comma or newline separated input into array
    const data = raw
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    setLoading(true);

    try {
      const res = await fetch("/api/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      setResult(json);
    } catch (err) {
      setError(err.message || "Failed to reach the API. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadExample() {
    setInput(EXAMPLE_INPUT);
    setError("");
    setResult(null);
  }

  return (
    <div className="app-container">
      {/* ── Hero ── */}
      <header className="hero">
        <div className="hero-badge">
          <span className="dot" />
          SRM Full Stack Challenge
        </div>
        <h1>
          <span className="gradient-text">Tree Hierarchy</span>
          <br />
          Analyzer
        </h1>
        <p>
          Parse node relationships, build trees, detect cycles, and visualize
          hierarchical structures — all in real time.
        </p>
      </header>

      {/* ── Input ── */}
      <section className="glass-card input-section">
        <label className="input-label" htmlFor="node-input">
          Node Relationships
        </label>
        <textarea
          id="node-input"
          className="input-textarea"
          placeholder='Enter nodes separated by commas or newlines&#10;e.g. A->B, A->C, B->D'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
          }}
        />
        <div className="input-hint">
          Format: X→Y where X and Y are single uppercase letters (A–Z). Press
          Ctrl+Enter to submit.
        </div>

        <div className="btn-row">
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            id="submit-btn"
          >
            {loading ? (
              <>
                <span className="spinner" /> Processing…
              </>
            ) : (
              <>🚀 Analyze</>
            )}
          </button>
          <button className="btn btn-secondary" onClick={loadExample} id="example-btn">
            Load Example
          </button>
        </div>
      </section>

      {/* ── Error ── */}
      {error && (
        <div className="error-banner" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="results-section">
          {/* Identity */}
          <section className="glass-card">
            <div className="section-title">
              <span className="icon">👤</span> Identity
            </div>
            <div className="identity-card">
              <div className="identity-item">
                <div className="label">User ID</div>
                <div className="value">{result.user_id}</div>
              </div>
              <div className="identity-item">
                <div className="label">Email</div>
                <div className="value">{result.email_id}</div>
              </div>
              <div className="identity-item">
                <div className="label">Roll Number</div>
                <div className="value">{result.college_roll_number}</div>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="glass-card">
            <div className="section-title">
              <span className="icon">📊</span> Summary
            </div>
            <div className="summary-grid">
              <div className="summary-stat">
                <div className="number trees">{result.summary.total_trees}</div>
                <div className="stat-label">Valid Trees</div>
              </div>
              <div className="summary-stat">
                <div className="number cycles">
                  {result.summary.total_cycles}
                </div>
                <div className="stat-label">Cycles</div>
              </div>
              <div className="summary-stat">
                <div className="number root">
                  {result.summary.largest_tree_root || "—"}
                </div>
                <div className="stat-label">Largest Root</div>
              </div>
            </div>
          </section>

          {/* Hierarchies */}
          <section className="glass-card">
            <div className="section-title">
              <span className="icon">🌳</span> Hierarchies
            </div>
            <div className="hierarchy-list">
              {result.hierarchies.map((h, i) => (
                <div className="hierarchy-card" key={i}>
                  <div className="hierarchy-header">
                    <div className="hierarchy-root">
                      <span className="root-label">Root</span>
                      <span className="root-value">{h.root}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {h.has_cycle ? (
                        <span className="badge badge-cycle">⚠ Cycle</span>
                      ) : (
                        <span className="badge badge-tree">✓ Tree</span>
                      )}
                      {h.depth !== undefined && (
                        <span className="badge badge-depth">
                          Depth: {h.depth}
                        </span>
                      )}
                    </div>
                  </div>

                  {h.has_cycle ? (
                    <div className="cycle-message">
                      Cycle detected — all nodes in this group reference each
                      other in a loop. No tree structure can be formed.
                    </div>
                  ) : (
                    <div className="tree-viz">
                      <TreeView data={h.tree} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Invalid Entries */}
          {result.invalid_entries.length > 0 && (
            <section className="glass-card">
              <div className="section-title">
                <span className="icon">❌</span> Invalid Entries
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "0.75rem",
                    color: "var(--accent-red)",
                    fontWeight: 500,
                  }}
                >
                  {result.invalid_entries.length} found
                </span>
              </div>
              <div className="tag-list">
                {result.invalid_entries.map((e, i) => (
                  <span className="tag tag-invalid" key={i}>
                    {e || '""'}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Duplicate Edges */}
          {result.duplicate_edges.length > 0 && (
            <section className="glass-card">
              <div className="section-title">
                <span className="icon">🔁</span> Duplicate Edges
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "0.75rem",
                    color: "var(--accent-orange)",
                    fontWeight: 500,
                  }}
                >
                  {result.duplicate_edges.length} found
                </span>
              </div>
              <div className="tag-list">
                {result.duplicate_edges.map((e, i) => (
                  <span className="tag tag-duplicate" key={i}>
                    {e}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Raw JSON */}
          <div className="json-viewer">
            <button
              className="json-toggle"
              onClick={() => setShowJson(!showJson)}
            >
              {showJson ? "▼" : "▶"} Raw JSON Response
            </button>
            {showJson && (
              <div className="json-block">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="footer">
        Built for SRM Full Stack Engineering Challenge · Pankaj Yadav ·
        AP23110011537
      </footer>
    </div>
  );
}

/* ── Tree Visualizer Component ─────────────────────────────── */
function TreeView({ data }) {
  // data is like { "A": { "B": { "D": {} }, "C": { "E": { "F": {} } } } }
  const rootKey = Object.keys(data)[0];
  if (!rootKey) return null;

  const lines = [];
  renderNode(rootKey, data[rootKey], "", true, true, lines);

  return (
    <>
      {lines.map((line, i) => (
        <div key={i}>
          <span className="tree-branch">{line.prefix}</span>
          <span className="tree-node">{line.label}</span>
        </div>
      ))}
    </>
  );
}

function renderNode(label, children, prefix, isRoot, isLast, lines) {
  if (isRoot) {
    lines.push({ prefix: "", label });
  } else {
    const connector = isLast ? "└── " : "├── ";
    lines.push({ prefix: prefix + connector, label });
  }

  const childKeys = Object.keys(children);
  childKeys.forEach((childKey, idx) => {
    const childIsLast = idx === childKeys.length - 1;
    const newPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");
    renderNode(childKey, children[childKey], newPrefix, false, childIsLast, lines);
  });
}

