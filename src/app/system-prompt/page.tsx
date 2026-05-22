"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  getSystemPrompt,
  saveSystemPrompt,
  clearSystemPrompt,
  DEFAULT_SYSTEM_PROMPT,
} from "@/lib/config";
import { Bot, RotateCcw, Save } from "lucide-react";

export default function SystemPromptPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrompt(getSystemPrompt());
  }, []);

  const handleSave = () => {
    saveSystemPrompt(prompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setPrompt(DEFAULT_SYSTEM_PROMPT);
    clearSystemPrompt();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onNewChat={() => router.push("/")} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-2">
          <Bot size={20} className="text-blue-600" />
          <h1 className="font-semibold text-gray-800">System Prompt</h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-sm text-gray-500">
              กำหนด system prompt ที่จะถูกส่งไปพร้อมกับทุกการสนทนา
              เพื่อควบคุมพฤติกรรมของ chatbot
            </p>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={18}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono leading-relaxed"
              placeholder="ใส่ system prompt ที่ต้องการ..."
            />

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save size={15} />
                บันทึก
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-colors"
              >
                <RotateCcw size={15} />
                รีเซ็ตเป็นค่าเริ่มต้น
              </button>
              {saved && (
                <span className="text-sm text-green-600">บันทึกแล้ว ✓</span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
