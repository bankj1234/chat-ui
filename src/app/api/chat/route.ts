import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, model, apiKey, endpoint, user, guardrails, metadata } = await req.json();

    if (!model || !apiKey || !endpoint) {
      return NextResponse.json(
        { error: "Missing configuration: model, apiKey, or endpoint" },
        { status: 400 }
      );
    }

    const baseUrl = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
    const url = `${baseUrl}/chat/completions`;

    // Build request body — include optional guardrail fields only when present
    const bodyPayload: Record<string, unknown> = { model, messages, stream: true };
    if (user) bodyPayload.user = user;
    if (guardrails && guardrails.length > 0) bodyPayload.guardrails = guardrails;
    if (metadata && Object.keys(metadata).length > 0) bodyPayload.metadata = metadata;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `LiteLLM error ${response.status}: ${text}` },
        { status: response.status }
      );
    }

    // Stream the response back to the client
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
