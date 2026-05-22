export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  error?: boolean;
}

export interface ChatRequest {
  messages: { role: string; content: string }[];
  model: string;
  apiKey: string;
  endpoint: string;
  user?: string;
  guardrails?: string[];
  metadata?: {
    pii_detection?: number;
    guardrail_model?: number;
    session_id?: string;
  };
}
