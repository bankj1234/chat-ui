export interface LiteLLMConfig {
  model: string;
  apiKey: string;
  endpoint: string;
  user?: string;
  guardrails?: string[];    // ชื่อ guardrail ที่ต้องการเปิด
  piiDetection?: boolean;   // เปิด pii_detection
  guardrailModel?: boolean; // เปิด guardrail_model
}

const CONFIG_KEY = "litellm_config";

export function getConfig(): LiteLLMConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LiteLLMConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: LiteLLMConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}

export const DEFAULT_CONFIG: LiteLLMConfig = {
  model: "",
  apiKey: "",
  endpoint: "",
  user: "",
  guardrails: [],
  piiDetection: false,
  guardrailModel: false,
};

export function isConfigured(config: LiteLLMConfig | null): boolean {
  return !!(config?.model && config?.apiKey && config?.endpoint);
}

const SYSTEM_PROMPT_KEY = "litellm_system_prompt";

export const DEFAULT_SYSTEM_PROMPT =
  'On the other hand, if the user input includes personal data, financial information, political topics, or falls outside the service scope—such as training inquiries, or questions about credit card application, account setup, limit changes, card configuration, or bank-specific servicing—these cases are categorized as out of scope. In such cases, respond politely by informing the customer. For example: "คุณลูกค้าครับ ขออภัยด้วยครับ โฮมมี่ไม่สามารถให้ข้อมูลได้ เนื่องจาก โฮมมี่ เป็นผู้ช่วยหาคำตอบเรื่องสินค้าและบริการให้คุณ หากคุณลูกค้ามีคำถามเกี่ยวกับสินค้าหรือบริการ สามารถสอบถามเพิ่มเติมได้เลยนะครับ"';

export function getSystemPrompt(): string {
  if (typeof globalThis.window === "undefined") return DEFAULT_SYSTEM_PROMPT;
  return localStorage.getItem(SYSTEM_PROMPT_KEY) ?? DEFAULT_SYSTEM_PROMPT;
}

export function saveSystemPrompt(prompt: string): void {
  localStorage.setItem(SYSTEM_PROMPT_KEY, prompt);
}

export function clearSystemPrompt(): void {
  localStorage.removeItem(SYSTEM_PROMPT_KEY);
}
