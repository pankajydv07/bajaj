// ─── Tree Builder & Cycle Detector ─────────────────────────
// Constructs hierarchies from validated edges, detects cycles,
// computes depth, and generates summary statistics.

/**
 * Build hierarchies from valid, deduplicated edges.
 * Handles: multi-parent diamond case, cycle detection, depth, summary.
 *
 * @param {{ parent: string, child: string, key: string }[]} edges
 * @returns {{ hierarchies: object[], summary: object }}
 */
export function buildHierarchies(edges) {
  // ── Step 1: Build adjacency list & track child assignments ──
  const adjacency = {};    // parent -> [child, ...]
  const childOf = {};      // child -> parent (first-encountered wins)
  const allNodes = new Set();

  for (const { parent, child } of edges) {
    allNodes.add(parent);
    allNodes.add(child);

    // Diamond / multi-parent: first parent wins, discard subsequent
    if (childOf[child] !== undefined) {
      continue;
    }

    childOf[child] = parent;
    if (!adjacency[parent]) adjacency[parent] = [];
    adjacency[parent].push(child);
  }

  // ── Step 2: Find connected components ──
  const visited = new Set();
  const components = []; // each component is a Set of nodes

  function dfsCollect(node, component) {
    if (visited.has(node)) return;
    visited.add(node);
    component.add(node);

    // Follow children
    if (adjacency[node]) {
      for (const child of adjacency[node]) {
        dfsCollect(child, component);
      }
    }

    // Follow parent
    if (childOf[node] !== undefined) {
      dfsCollect(childOf[node], component);
    }
  }

  for (const node of allNodes) {
    if (!visited.has(node)) {
      const component = new Set();
      dfsCollect(node, component);
      components.push(component);
    }
  }

  // ── Step 3: Process each component ──
  const hierarchies = [];

  for (const component of components) {
    // Find root: a node in this component that never appears as a child
    const roots = [];
    for (const node of component) {
      if (childOf[node] === undefined || !component.has(childOf[node])) {
        // Node has no parent, or its parent is outside this component
        if (childOf[node] === undefined) {
          roots.push(node);
        }
      }
    }

    // Detect cycle: does this component have a cycle?
    const hasCycle = detectCycle(component, adjacency);

    if (hasCycle) {
      // Pure cycle or cycle in component
      // Root = lexicographically smallest node if no valid root
      const root = roots.length > 0
        ? roots.sort()[0]
        : [...component].sort()[0];

      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
    } else {
      // Valid tree
      const root = roots.sort()[0]; // lexicographically smallest if multiple
      const tree = buildTree(root, adjacency);
      const depth = computeDepth(tree);

      const hierarchy = {
        root,
        tree,
        depth,
      };
      // Do NOT include has_cycle for non-cyclic trees (PRD rule)
      hierarchies.push(hierarchy);
    }
  }

  // ── Step 4: Generate summary ──
  const validTrees = hierarchies.filter((h) => !h.has_cycle);
  const totalCycles = hierarchies.filter((h) => h.has_cycle).length;

  let largestTreeRoot = "";
  let maxDepth = 0;

  for (const tree of validTrees) {
    if (
      tree.depth > maxDepth ||
      (tree.depth === maxDepth && tree.root < largestTreeRoot)
    ) {
      maxDepth = tree.depth;
      largestTreeRoot = tree.root;
    }
  }

  const summary = {
    total_trees: validTrees.length,
    total_cycles: totalCycles,
    largest_tree_root: largestTreeRoot || "",
  };

  return { hierarchies, summary };
}

/**
 * Detect if a component contains a cycle using DFS coloring.
 * WHITE=0 (unvisited), GRAY=1 (in-stack), BLACK=2 (done)
 */
function detectCycle(component, adjacency) {
  const color = {};
  for (const node of component) {
    color[node] = 0; // WHITE
  }

  function dfs(node) {
    color[node] = 1; // GRAY
    if (adjacency[node]) {
      for (const child of adjacency[node]) {
        if (!component.has(child)) continue;
        if (color[child] === 1) return true;  // back-edge = cycle
        if (color[child] === 0 && dfs(child)) return true;
      }
    }
    color[node] = 2; // BLACK
    return false;
  }

  for (const node of component) {
    if (color[node] === 0) {
      if (dfs(node)) return true;
    }
  }
  return false;
}

/**
 * Recursively build a nested tree object from root.
 * Example: { "A": { "B": { "D": {} }, "C": {} } }
 */
function buildTree(node, adjacency) {
  const children = {};
  if (adjacency[node]) {
    for (const child of adjacency[node]) {
      children[child] = buildTreeChildren(child, adjacency);
    }
  }
  return { [node]: children };
}

/**
 * Build children subtree (without wrapping in node key again).
 */
function buildTreeChildren(node, adjacency) {
  const children = {};
  if (adjacency[node]) {
    for (const child of adjacency[node]) {
      children[child] = buildTreeChildren(child, adjacency);
    }
  }
  return children;
}

/**
 * Compute depth = number of nodes on longest root-to-leaf path.
 * Input is a tree like { "A": { "B": {}, "C": {} } }
 */
function computeDepth(tree) {
  function measure(obj) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return 0;

    let maxChildDepth = 0;
    for (const key of keys) {
      const childDepth = measure(obj[key]);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }
    return 1 + maxChildDepth;
  }

  return measure(tree);
}
