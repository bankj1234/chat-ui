import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, endpoint } = await req.json();

    if (!apiKey || !endpoint) {
      return NextResponse.json(
        { error: "Missing apiKey or endpoint" },
        { status: 400 }
      );
    }

    const baseUrl = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
    const url = `${baseUrl}/models`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch models (${response.status}): ${text}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // OpenAI-compatible format: { data: [{ id: "model-name", ... }] }
    const models: string[] = (data?.data ?? [])
      .map((m: { id?: string }) => m.id)
      .filter(Boolean)
      .sort();

    return NextResponse.json({ models });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
