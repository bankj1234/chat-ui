"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "@/components/Sidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import { getConfig, isConfigured, getSystemPrompt } from "@/lib/config";
import { Message } from "@/lib/types";
import { MessageSquare, Settings } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // session_id ใหม่ต่อ 1 การสนทนา รีเซ็ตเมื่อกด New Chat
  const sessionIdRef = useRef<string>(uuidv4());

  useEffect(() => {
    const cfg = getConfig();
    setConfigured(isConfigured(cfg));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = uuidv4();
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const cfg = getConfig();
      if (!isConfigured(cfg)) {
        router.push("/config");
        return;
      }

      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      const systemPrompt = {
        role: "system",
        content: getSystemPrompt(),
      };

      const history = [
        systemPrompt,
        ...[...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      try {
        // สร้าง metadata จาก config
        const metadata: Record<string, unknown> = {
          session_id: sessionIdRef.current,
        };
        if (cfg!.piiDetection) metadata.pii_detection = 1;
        if (cfg!.guardrailModel) metadata.guardrail_model = 1;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            model: cfg!.model,
            apiKey: cfg!.apiKey,
            endpoint: cfg!.endpoint,
            ...(cfg!.user ? { user: cfg!.user } : {}),
            ...(cfg!.guardrails && cfg!.guardrails.length > 0 ? { guardrails: cfg!.guardrails } : {}),
            metadata,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Request failed");
        }

        // Handle SSE streaming
        const assistantId = uuidv4();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
          },
        ]);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break outer;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + delta }
                      : m
                  )
                );
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } catch (err) {
        const rawMessage = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        // ครอบคลุมทั้ง input guardrail (500) และ output guardrail (400)
        const isGuardrailBlock = rawMessage.includes("Violated guardrail policy");
        const message = isGuardrailBlock ? "ขออภัยด้วยครับ โฮมมี่ไม่สามารถให้ข้อมูลได้ [Guardrail BLOCK]" : rawMessage;
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: "assistant",
            content: message,
            timestamp: new Date(),
            error: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, router]
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onNewChat={handleNewChat} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="font-semibold text-gray-800">Chat</h1>
          {!configured && (
            <Link
              href="/config"
              className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
            >
              <Settings size={14} />
              <span>ตั้งค่าก่อนใช้งาน</span>
            </Link>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-4">
              <MessageSquare size={48} className="opacity-30" />
              <div>
                <p className="text-lg font-medium text-gray-500">ยินดีต้อนรับ!</p>
                <p className="text-sm mt-1">
                  {configured
                    ? "พิมพ์ข้อความเพื่อเริ่มสนทนา"
                    : "กรุณาตั้งค่า LiteLLM ก่อนใช้งาน"}
                </p>
                {!configured && (
                  <Link
                    href="/config"
                    className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Settings size={14} />
                    ไปที่หน้าตั้งค่า
                  </Link>
                )}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <ChatInput onSend={handleSend} disabled={loading || !configured} />
          {!configured && (
            <p className="text-xs text-center text-amber-500 mt-2">
              กรุณา{" "}
              <Link href="/config" className="underline">
                ตั้งค่า LiteLLM
              </Link>{" "}
              ก่อนใช้งาน
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
