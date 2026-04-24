// ─── Edge Parser ────────────────────────────────────────────
// Validates raw input strings and separates them into valid edges,
// invalid entries, and duplicate edges per PRD rules.

const EDGE_REGEX = /^([A-Z])->([A-Z])$/;

/**
 * Parse and validate an array of raw input strings.
 * @param {string[]} data - Raw input array (e.g. ["A->B", "hello", "A->B"])
 * @returns {{ validEdges: {parent: string, child: string}[], invalidEntries: string[], duplicateEdges: string[] }}
 */
export function parseEdges(data) {
  const validEdges = [];
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();

  for (const raw of data) {
    // Handle non-string entries
    if (typeof raw !== "string") {
      invalidEntries.push(String(raw));
      continue;
    }

    // Trim whitespace first (PRD rule)
    const trimmed = raw.trim();

    // Empty string check
    if (trimmed === "") {
      invalidEntries.push(raw);
      continue;
    }

    // Match against valid pattern X->Y where X,Y are single uppercase letters
    const match = trimmed.match(EDGE_REGEX);

    if (!match) {
      invalidEntries.push(trimmed);
      continue;
    }

    const parent = match[1];
    const child = match[2];

    // Self-loop check (A->A is invalid per PRD)
    if (parent === child) {
      invalidEntries.push(trimmed);
      continue;
    }

    const edgeKey = `${parent}->${child}`;

    // Duplicate check
    if (seenEdges.has(edgeKey)) {
      // Only add to duplicate_edges once per pair
      if (!duplicateEdges.includes(edgeKey)) {
        duplicateEdges.push(edgeKey);
      }
      continue;
    }

    seenEdges.add(edgeKey);
    validEdges.push({ parent, child, key: edgeKey });
  }

  return { validEdges, invalidEntries, duplicateEdges };
}
