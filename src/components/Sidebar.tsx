"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Settings, Plus, Bot } from "lucide-react";

interface Props {
  onNewChat?: () => void;
}

export default function Sidebar({ onNewChat }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 text-white flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-400" />
          <span className="font-semibold text-lg">LiteLLM Chat</span>
        </div>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-600 hover:bg-gray-800 text-sm transition-colors"
        >
          <Plus size={16} />
          <span>สนทนาใหม่</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        <Link
          href="/"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/"
              ? "bg-gray-700 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <MessageSquare size={16} />
          <span>Chat</span>
        </Link>
        <Link
          href="/config"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/config"
              ? "bg-gray-700 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <Settings size={16} />
          <span>ตั้งค่า LiteLLM</span>
        </Link>
        <Link
          href="/system-prompt"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/system-prompt"
              ? "bg-gray-700 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <Bot size={16} />
          <span>System Prompt</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
        Powered by LiteLLM
      </div>
    </aside>
  );
}
