import { NextResponse } from "next/server";
import { parseEdges } from "@/lib/parser";
import { buildHierarchies } from "@/lib/tree-builder";
import { USER_IDENTITY } from "@/lib/constants";

// ─── CORS Preflight ─────────────────────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// ─── POST /bfhl ─────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate request shape
    if (!body || !Array.isArray(body.data)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected { data: string[] }" },
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Step 1: Parse & validate edges
    const { validEdges, invalidEntries, duplicateEdges } = parseEdges(body.data);

    // Step 2: Build hierarchies & summary
    const { hierarchies, summary } = buildHierarchies(validEdges);

    // Step 3: Compose response
    const response = {
      ...USER_IDENTITY,
      hierarchies,
      invalid_entries: invalidEntries,
      duplicate_edges: duplicateEdges,
      summary,
    };

    return NextResponse.json(response, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("POST /bfhl error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}
