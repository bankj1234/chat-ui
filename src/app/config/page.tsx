"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getConfig, saveConfig, clearConfig, LiteLLMConfig, DEFAULT_CONFIG } from "@/lib/config";
import {
  Settings,
  Save,
  Trash2,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
  Check,
  AlertCircle,
} from "lucide-react";

export default function ConfigPage() {
  const router = useRouter();
  const [form, setForm] = useState<LiteLLMConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [guardrailsRaw, setGuardrailsRaw] = useState("");

  // Model list state
  const [models, setModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cfg = getConfig();
    if (cfg) {
      setForm({ ...DEFAULT_CONFIG, ...cfg });
      setGuardrailsRaw((cfg.guardrails ?? []).join(", "));
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleChange = (field: keyof LiteLLMConfig, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    // Reset model list when connection info changes
    if (field === "apiKey" || field === "endpoint") {
      setModels([]);
      setModelError(null);
    }
  };

  // แปลง guardrails string เป็น array (comma-separated)
  const parseGuardrails = (raw: string): string[] =>
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const canFetch = form.apiKey.trim() && form.endpoint.trim();

  const handleFetchModels = async () => {
    if (!canFetch) return;
    setFetchingModels(true);
    setModelError(null);
    setModels([]);

    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: form.apiKey.trim(),
          endpoint: form.endpoint.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ดึง model list ไม่สำเร็จ");
      setModels(data.models);
      if (data.models.length === 0) {
        setModelError("ไม่พบ model จาก endpoint นี้");
      }
    } catch (err) {
      setModelError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setFetchingModels(false);
    }
  };

  const handleSelectModel = (model: string) => {
    handleChange("model", model);
    setDropdownOpen(false);
    setSearch("");
  };

  const filteredModels = models.filter((m) =>
    m.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    const trimmed: LiteLLMConfig = {
      model: form.model.trim(),
      apiKey: form.apiKey.trim(),
      endpoint: form.endpoint.trim(),
      user: form.user?.trim() || "",
      guardrails: form.guardrails ?? [],
      piiDetection: form.piiDetection ?? false,
      guardrailModel: form.guardrailModel ?? false,
    };
    saveConfig(trimmed);
    setSaved(true);
    setTimeout(() => router.push("/"), 800);
  };

  const handleClear = () => {
    clearConfig();
    setForm(DEFAULT_CONFIG);
    setGuardrailsRaw("");
    setModels([]);
    setModelError(null);
    setSaved(false);
  };

  const isValid = form.model.trim() && form.apiKey.trim() && form.endpoint.trim();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-2">
          <Settings size={18} className="text-gray-500" />
          <h1 className="font-semibold text-gray-800">ตั้งค่า LiteLLM</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
              <p className="text-sm text-gray-500 leading-relaxed">
                กรอก Endpoint และ API Key จากนั้นกด{" "}
                <span className="font-medium text-gray-700">โหลด Model</span>{" "}
                เพื่อดึงรายการ model มาเลือก ข้อมูลจะบันทึกไว้ใน{" "}
                <span className="font-medium text-gray-700">localStorage</span> เท่านั้น
              </p>

              {/* Step 1 — Endpoint */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1.5">1</span>
                  Endpoint URL
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="url"
                  value={form.endpoint}
                  onChange={(e) => handleChange("endpoint", e.target.value)}
                  placeholder="https://your-litellm.example.com/"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <p className="text-xs text-gray-400">
                  ตัวอย่าง:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    https://do-cap-litellm-dev.scg-wedo.tech/
                  </code>
                </p>
              </div>

              {/* Step 2 — API Key */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1.5">2</span>
                  API Key
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={form.apiKey}
                    onChange={(e) => handleChange("apiKey", e.target.value)}
                    placeholder="sk-xxxxxx"
                    className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Step 3 — Fetch + Select Model */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1.5">3</span>
                  เลือก Model
                  <span className="text-red-500 ml-0.5">*</span>
                </label>

                {/* Fetch button */}
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={!canFetch || fetchingModels}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw
                    size={14}
                    className={fetchingModels ? "animate-spin" : ""}
                  />
                  {fetchingModels ? "กำลังโหลด..." : "โหลดรายการ Model"}
                </button>

                {/* Error */}
                {modelError && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                    <span>{modelError}</span>
                  </div>
                )}

                {/* Dropdown — shown after fetch */}
                {models.length > 0 && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <span className={form.model ? "text-gray-800" : "text-gray-400"}>
                        {form.model || "— เลือก model —"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {/* Search */}
                        <div className="px-3 py-2 border-b border-gray-100">
                          <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหา model..."
                            className="w-full text-sm outline-none bg-gray-50 px-2 py-1.5 rounded-md border border-gray-200 placeholder-gray-400"
                          />
                        </div>

                        {/* List */}
                        <ul className="max-h-52 overflow-y-auto">
                          {filteredModels.length === 0 ? (
                            <li className="px-3 py-3 text-sm text-gray-400 text-center">
                              ไม่พบ model ที่ค้นหา
                            </li>
                          ) : (
                            filteredModels.map((m) => (
                              <li key={m}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectModel(m)}
                                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors"
                                >
                                  <span className="text-gray-800">{m}</span>
                                  {form.model === m && (
                                    <Check size={14} className="text-blue-600 flex-shrink-0" />
                                  )}
                                </button>
                              </li>
                            ))
                          )}
                        </ul>

                        <div className="px-3 py-1.5 border-t border-gray-100 text-xs text-gray-400 text-right">
                          {filteredModels.length} / {models.length} models
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual input fallback — shown when no models fetched yet */}
                {models.length === 0 && !fetchingModels && (
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    placeholder="หรือพิมพ์ชื่อ model เอง เช่น cap-vertex-gemini-2.0-flash-001"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-500 placeholder-gray-400"
                  />
                )}
              </div>

              {/* Selected model badge */}
              {form.model && models.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <Check size={14} />
                  <span>
                    Model ที่เลือก:{" "}
                    <span className="font-medium">{form.model}</span>
                  </span>
                </div>
              )}

              {/* Step 4 — User ID */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1.5">4</span>
                  User ID
                  <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.user ?? ""}
                  onChange={(e) => handleChange("user", e.target.value)}
                  placeholder="เช่น userid_123"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Step 5 — Guardrails */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1.5">5</span>
                  Guardrails
                  <span className="ml-1 text-xs text-gray-400 font-normal">(คั่นด้วย comma)</span>
                </label>
                <input
                  type="text"
                  value={guardrailsRaw}
                  onChange={(e) => setGuardrailsRaw(e.target.value)}
                  onBlur={(e) => handleChange("guardrails", parseGuardrails(e.target.value))}
                  placeholder="เช่น chayakorn-output-guardrail, chayakorn-input-guardrail"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {parseGuardrails(guardrailsRaw).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {parseGuardrails(guardrailsRaw).map((g) => (
                      <span
                        key={g}
                        className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 6 — Metadata toggles */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-1.5">6</span>
                  Metadata Options
                </label>
                <div className="flex flex-col gap-3 pl-1">
                  {/* pii_detection */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={form.piiDetection ?? false}
                        onChange={(e) => handleChange("piiDetection", e.target.checked)}
                      />
                      <div
                        className={`w-10 h-5 rounded-full transition-colors ${
                          form.piiDetection ? "bg-blue-500" : "bg-gray-200"
                        }`}
                      />
                      <div
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          form.piiDetection ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 font-medium">PII Detection</p>
                      <p className="text-xs text-gray-400">ส่ง <code className="bg-gray-100 px-1 rounded">pii_detection: 1</code> ใน metadata</p>
                    </div>
                  </label>

                  {/* guardrail_model */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={form.guardrailModel ?? false}
                        onChange={(e) => handleChange("guardrailModel", e.target.checked)}
                      />
                      <div
                        className={`w-10 h-5 rounded-full transition-colors ${
                          form.guardrailModel ? "bg-blue-500" : "bg-gray-200"
                        }`}
                      />
                      <div
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          form.guardrailModel ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 font-medium">Guardrail Model</p>
                      <p className="text-xs text-gray-400">ส่ง <code className="bg-gray-100 px-1 rounded">guardrail_model: 1</code> ใน metadata</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={!isValid}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 text-sm font-medium rounded-lg transition-colors"
                >
                  {saved ? (
                    <>
                      <CheckCircle size={16} />
                      บันทึกแล้ว!
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      บันทึกการตั้งค่า
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300 text-sm rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  ล้างข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
