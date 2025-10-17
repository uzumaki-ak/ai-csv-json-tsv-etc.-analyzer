"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Upload,
  Moon,
  Sun,
  Settings,
  X,
  Download,
  MessageSquare,
  Send,
  FileText,
  Menu,
  Search,
  Trash2,
} from "lucide-react";

const CSVAnalyzer: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [csvData, setCsvData] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [displayData, setDisplayData] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [apiProvider, setApiProvider] = useState("backend");
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [euronKey, setEuronKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("euron");
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [graphType, setGraphType] = useState("auto");
  const [dragActive, setDragActive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") || "dark";
    const savedHistory = JSON.parse(
      localStorage.getItem("queryHistory") || "[]"
    );
    const savedOpenAI = localStorage.getItem("openai_key") || "";
    const savedGemini = localStorage.getItem("gemini_key") || "";
    const savedEuron = localStorage.getItem("euron_key") || "";
    const savedProvider = localStorage.getItem("api_provider") || "backend";
    const savedModel = localStorage.getItem("selected_model") || "euron";
    const savedChats = JSON.parse(localStorage.getItem("chatHistory") || "[]");

    setTheme(savedTheme);
    setHistory(savedHistory);
    setOpenaiKey(savedOpenAI);
    setGeminiKey(savedGemini);
    setEuronKey(savedEuron);
    setApiProvider(savedProvider);
    setSelectedModel(savedModel);
    setChatMessages(savedChats);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const loadHistoryItem = (h: any) => {
    setQuery(h.query);
    setResult(h.result);
    setFileName(h.fileName || fileName);
    setHeaders(h.headers || headers);
    setDisplayData(h.displayData || displayData);
    setError("");
    setShowChat(false);
  };

  const saveApiKeys = () => {
    localStorage.setItem("openai_key", openaiKey);
    localStorage.setItem("gemini_key", geminiKey);
    localStorage.setItem("euron_key", euronKey);
    localStorage.setItem("api_provider", apiProvider);
    localStorage.setItem("selected_model", selectedModel);
    setShowSettings(false);
  };

  const handleDrag = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if ([".csv", ".json", ".tsv"].some((ext) => file.name.endsWith(ext))) {
        processFile(file);
      } else {
        setError("Please upload a CSV, JSON, or TSV file");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = async (file: File) => {
    try {
      const text = await file.text();
      let h: string[] = [];
      let rows: any[] = [];

      if (file.name.endsWith(".csv")) {
        const lines = text.trim().split("\n");
        h = lines[0].split(",").map((x: string) => x.trim());
        for (let i = 1; i < Math.min(6, lines.length); i++) {
          const vals = lines[i].split(",").map((v: string) => v.trim());
          const row: any = {};
          h.forEach((hdr: string, idx: number) => {
            row[hdr] = vals[idx] || "";
          });
          rows.push(row);
        }
      } else if (file.name.endsWith(".json")) {
        const data = JSON.parse(text);

        // Check if this is an analysis report JSON (has result property)
        if (data.result && data.result.type) {
          // It's an analysis report - set the result directly
          setResult(data.result);
          setFileName(data.fileName || file.name);
          setHeaders(data.headers || []);
          setDisplayData(data.preview || []);
          setCsvData(null); // Clear CSV data since we're using a report
          setError("");
          setChatMessages([]);
          return; // Exit early since we handled the report
        }

        // Regular JSON data file
        const arr = Array.isArray(data) ? data : [data];
        h = Object.keys(arr[0] || {});
        rows = arr.slice(0, 5);
      } else if (file.name.endsWith(".tsv")) {
        const lines = text.trim().split("\n");
        h = lines[0].split("\t").map((x: string) => x.trim());
        for (let i = 1; i < Math.min(6, lines.length); i++) {
          const vals = lines[i].split("\t").map((v: string) => v.trim());
          const row: any = {};
          h.forEach((hdr: string, idx: number) => {
            row[hdr] = vals[idx] || "";
          });
          rows.push(row);
        }
      }

      setHeaders(h);
      setFileName(file.name);
      setDisplayData(rows);
      setCsvData(text);
      setResult(null);
      setError("");
      setChatMessages([]);
    } catch (err: any) {
      setError("Failed to read file: " + (err?.message || String(err)));
    }
  };

  const runAnalysis = async () => {
    if (!csvData || !query.trim()) {
      setError("Upload file and enter a query");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const lines = csvData.trim().split("\n");
      const sample = lines.slice(0, 6).join("\n");

      const graphTypeHint =
        graphType === "auto" ? "" : `Prefer ${graphType} chart type. `;

      const prompt = `CSV data sample:\n${sample}\n\nQuery: "${query}"\n\nAnalyze this CSV and return ONLY valid JSON (no markdown, no code blocks) with this exact structure:\n{\n  "type": "bar" | "line" | "pie" | "area" | "table" | "metric",\n  "title": "string",\n  "description": "string",\n  "data": {\n    "labels": ["string"],\n    "values": [number]\n  }\n}\n\nFor table type, use: {"headers": ["string"], "rows": [[any]]}\nFor metric type, use: {"value": "string|number", "label": "string"}\n\n${graphTypeHint}Return ONLY the JSON object, nothing else.`;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          apiProvider,
          openaiKey,
          geminiKey,
          euronKey,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Backend API failed");
      }

      const apiResult = await res.json();

      if (!apiResult.data) {
        throw new Error("Invalid response format from API");
      }

      setResult(apiResult.data);

      const historyItem = {
        query,
        result: apiResult.data,
        timestamp: Date.now(),
        fileName,
        headers,
        displayData,
      };
      const newHistory = [historyItem, ...history.slice(0, 19)];
      setHistory(newHistory);
      localStorage.setItem("queryHistory", JSON.stringify(newHistory));
      localStorage.setItem("queryHistory", JSON.stringify(newHistory));
    } catch (err: any) {
      setError("Analysis failed: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;

    const reportData = {
      fileName,
      query,
      result,
      timestamp: new Date().toISOString(),
      headers,
      preview: displayData,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !result) return;

    const userMsg = { role: "user", content: chatInput };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const prompt = `You are analyzing a CSV report. Current analysis:\nQuery: ${query}\nResult type: ${
        result.type
      }\nResult data: ${JSON.stringify(
        result.data
      )}\n\nUser question: ${chatInput}\n\nProvide a concise, helpful response about this specific report.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          apiProvider,
          openaiKey,
          geminiKey,
          euronKey,
        }),
      });

      const data = await res.json();
      const response = data?.response || "No response";

      const aiMsg = { role: "assistant", content: response };
      const finalMessages = [...updatedMessages, aiMsg];
      setChatMessages(finalMessages);
      localStorage.setItem("chatHistory", JSON.stringify(finalMessages));
    } catch (err: any) {
      const errorMsg = {
        role: "assistant",
        content: "Failed to get response. Please try again.",
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("queryHistory");
  };

  const clearChat = () => {
    setChatMessages([]);
    localStorage.removeItem("chatHistory");
  };

  const filteredHistory = history.filter((h: any) =>
    h.query.toLowerCase().includes(historySearch.toLowerCase())
  );

  const bg = theme === "dark" ? "bg-slate-950" : "bg-slate-50";
  const card =
    theme === "dark"
      ? "bg-slate-900/80 backdrop-blur border-slate-800"
      : "bg-white/80 backdrop-blur border-slate-200";
  const text = theme === "dark" ? "text-slate-50" : "text-slate-950";
  const subtext = theme === "dark" ? "text-slate-400" : "text-slate-600";
  const input =
    theme === "dark"
      ? "bg-slate-800 border-slate-700 text-slate-50"
      : "bg-white border-slate-300 text-slate-950";
  const btn =
    theme === "dark"
      ? "bg-slate-800 hover:bg-slate-700 text-slate-50"
      : "bg-slate-100 hover:bg-slate-200 text-slate-950";
  const primary = "bg-blue-600 hover:bg-blue-700 text-white";

  const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f97316",
    "#22c55e",
    "#06b6d4",
    "#f59e0b",
  ];

  const renderChart = () => {
    if (!result) return null;

    const { type, data, title, description } = result;

    if (type === "bar") {
      const chartData = data.labels.map((l: string, i: number) => ({
        name: l,
        value: data.values[i],
      }));
      return (
        <div className="mt-8">
          <div className="mb-6">
            <h3 className={`text-2xl font-bold ${text} mb-2`}>{title}</h3>
            {description && (
              <p className={`${subtext} text-sm`}>{description}</p>
            )}
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="name"
                stroke={theme === "dark" ? "#64748b" : "#94a3b8"}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke={theme === "dark" ? "#64748b" : "#94a3b8"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === "line") {
      const chartData = data.labels.map((l: string, i: number) => ({
        name: l,
        value: data.values[i],
      }));
      return (
        <div className="mt-8">
          <div className="mb-6">
            <h3 className={`text-2xl font-bold ${text} mb-2`}>{title}</h3>
            {description && (
              <p className={`${subtext} text-sm`}>{description}</p>
            )}
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="name"
                stroke={theme === "dark" ? "#64748b" : "#94a3b8"}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke={theme === "dark" ? "#64748b" : "#94a3b8"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === "area") {
      const chartData = data.labels.map((l: string, i: number) => ({
        name: l,
        value: data.values[i],
      }));
      return (
        <div className="mt-8">
          <div className="mb-6">
            <h3 className={`text-2xl font-bold ${text} mb-2`}>{title}</h3>
            {description && (
              <p className={`${subtext} text-sm`}>{description}</p>
            )}
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="name"
                stroke={theme === "dark" ? "#64748b" : "#94a3b8"}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke={theme === "dark" ? "#64748b" : "#94a3b8"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                fill="#3b82f6"
                stroke="#3b82f6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === "pie") {
      const chartData = data.labels.map((l: string, i: number) => ({
        name: l,
        value: data.values[i],
      }));
      return (
        <div className="mt-8">
          <div className="mb-6">
            <h3 className={`text-2xl font-bold ${text} mb-2`}>{title}</h3>
            {description && (
              <p className={`${subtext} text-sm`}>{description}</p>
            )}
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(e) => `${e.name}: ${e.value}`}
                outerRadius={120}
                fill="#3b82f6"
                dataKey="value"
              >
                {chartData.map((entry: any, i: number) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === "table") {
      return (
        <div className="mt-8">
          <div className="mb-6">
            <h3 className={`text-2xl font-bold ${text} mb-2`}>{title}</h3>
            {description && (
              <p className={`${subtext} text-sm`}>{description}</p>
            )}
          </div>
          <div
            className="overflow-x-auto rounded-lg border"
            style={{
              borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
            }}
          >
            <table className="w-full text-sm">
              <thead
                className={theme === "dark" ? "bg-slate-800" : "bg-slate-100"}
              >
                <tr>
                  {data.headers.map((h: string, i: number) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-left font-semibold ${text}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row: any, i: number) => (
                  <tr
                    key={i}
                    className={
                      theme === "dark"
                        ? "border-t border-slate-800"
                        : "border-t border-slate-200"
                    }
                  >
                    {row.map((cell: any, j: number) => (
                      <td key={j} className={`px-4 py-3 ${subtext}`}>
                        {typeof cell === "object" ? JSON.stringify(cell) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (type === "metric") {
      return (
        <div className="mt-8 text-center py-12">
          <div className={`text-6xl font-bold ${text} mb-3`}>{data.value}</div>
          <div className={`text-xl ${subtext}`}>{data.label}</div>
          {description && (
            <p className={`${subtext} text-sm mt-3`}>{description}</p>
          )}
        </div>
      );
    }

    return null;
  };

  if (!mounted) {
    return <div className={`min-h-screen ${bg}`} />;
  }

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300 flex`}>
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 overflow-hidden ${card} border-r flex flex-col`}
      >
        <div
          className="p-4 border-b"
          style={{ borderColor: theme === "dark" ? "#334155" : "#cbd5e1" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold ${text}`}>History</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`p-1 rounded hover:${btn}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className={`absolute left-3 top-3 w-4 h-4 ${subtext}`} />
            <input
              type="text"
              placeholder="Search history..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className={`w-full pl-10 pr-3 py-2 rounded-lg ${input} border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredHistory.length === 0 ? (
            <div className={`text-center ${subtext} text-sm py-8`}>
              {history.length === 0 ? "No history yet" : "No matching queries"}
            </div>
          ) : (
            filteredHistory.map((h: any, i: number) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  theme === "dark"
                    ? "bg-slate-800 hover:bg-slate-700"
                    : "bg-slate-100 hover:bg-slate-200"
                } cursor-pointer transition-colors group`}
                onClick={() => loadHistoryItem(h)}
              >
                <div className={`text-sm ${text} font-medium truncate`}>
                  {h.query}
                </div>
                <div className={`text-xs ${subtext} mt-1`}>
                  {new Date(h.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div
            className="p-4 border-t"
            style={{ borderColor: theme === "dark" ? "#334155" : "#cbd5e1" }}
          >
            <button
              onClick={clearHistory}
              className={`w-full px-3 py-2 rounded-lg ${btn} border text-sm font-medium transition-colors flex items-center justify-center gap-2`}
              style={{ borderColor: theme === "dark" ? "#334155" : "#cbd5e1" }}
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`${card} border-b p-4 md:p-6`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`p-2 rounded-lg ${btn} border`}
                  style={{
                    borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
                  }}
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className={`text-3xl font-bold ${text}`}>CSV Analyzer</h1>
                <p className={`text-sm ${subtext}`}>AI-powered data insights</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowInstructions(true)}
                className={`p-2 rounded-lg ${btn} border`}
                style={{
                  borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
                }}
                title="Instructions"
              >
                <FileText className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-lg ${btn} border`}
                style={{
                  borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
                }}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${btn} border`}
                style={{
                  borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
                }}
                title="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
            {/* Instructions Modal */}
            {showInstructions && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setShowInstructions(false)}
                />
                <div
                  className={`relative w-full max-w-2xl ${card} border rounded-lg p-6 z-10 max-h-[90vh] overflow-y-auto`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-2xl font-bold ${text}`}>How to Use</h2>
                    <button
                      onClick={() => setShowInstructions(false)}
                      className={`${subtext} hover:${text}`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className={`space-y-4 ${subtext}`}>
                    <div className="flex gap-4">
                      <div
                        className={`${text} font-bold text-lg w-8 flex-shrink-0`}
                      >
                        1
                      </div>
                      <div>
                        <h3 className={`${text} font-semibold mb-1`}>
                          Upload Your File
                        </h3>
                        <p>
                          Supports CSV, JSON, and TSV formats. Click the upload
                          area or drag and drop.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div
                        className={`${text} font-bold text-lg w-8 flex-shrink-0`}
                      >
                        2
                      </div>
                      <div>
                        <h3 className={`${text} font-semibold mb-1`}>
                          Enter Your Query
                        </h3>
                        <p>
                          Ask questions about your data (e.g., "Show top 5 sales
                          by region")
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div
                        className={`${text} font-bold text-lg w-8 flex-shrink-0`}
                      >
                        3
                      </div>
                      <div>
                        <h3 className={`${text} font-semibold mb-1`}>
                          Choose Graph Type
                        </h3>
                        <p>
                          Select from bar, line, area, pie, table, or let AI
                          choose automatically
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div
                        className={`${text} font-bold text-lg w-8 flex-shrink-0`}
                      >
                        4
                      </div>
                      <div>
                        <h3 className={`${text} font-semibold mb-1`}>
                          Analyze & Chat
                        </h3>
                        <p>
                          Get instant insights and ask follow-up questions about
                          your analysis
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div
                        className={`${text} font-bold text-lg w-8 flex-shrink-0`}
                      >
                        5
                      </div>
                      <div>
                        <h3 className={`${text} font-semibold mb-1`}>
                          Download Report
                        </h3>
                        <p>
                          Export your analysis as a JSON report for sharing or
                          archiving
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Section */}
            <div className={`${card} border rounded-lg p-8`}>
              <label
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center cursor-pointer group transition-all ${
                  dragActive ? "bg-blue-500/10 border-blue-500" : ""
                }`}
              >
                <Upload
                  className={`w-12 h-12 mb-3 ${
                    dragActive ? "text-blue-500" : subtext
                  } group-hover:text-blue-500 transition-colors`}
                />
                <span className={`${text} font-semibold text-lg`}>
                  Upload Data File
                </span>
                <span className={`text-sm ${subtext} mt-2 text-center`}>
                  {fileName ||
                    "CSV, JSON, or TSV • Click to browse or drag file here"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preview */}
            {displayData.length > 0 && (
              <div className={`${card} border rounded-lg p-6`}>
                <h2
                  className={`text-sm font-bold mb-4 ${text} uppercase tracking-wide`}
                >
                  Data Preview
                </h2>
                <div
                  className="overflow-x-auto rounded-lg border"
                  style={{
                    borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
                  }}
                >
                  <table className="w-full text-sm">
                    <thead
                      className={
                        theme === "dark" ? "bg-slate-800" : "bg-slate-100"
                      }
                    >
                      <tr>
                        {headers.map((h: string, i: number) => (
                          <th
                            key={i}
                            className={`px-4 py-3 text-left font-semibold ${text}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayData.map((row: any, i: number) => (
                        <tr
                          key={i}
                          className={
                            theme === "dark"
                              ? "border-t border-slate-800"
                              : "border-t border-slate-200"
                          }
                        >
                          {headers.map((h: string, j: number) => (
                            <td key={j} className={`px-4 py-3 ${subtext}`}>
                              {typeof row[h] === "object"
                                ? JSON.stringify(row[h])
                                : row[h]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Query & Options */}
            {csvData && (
              <div className={`${card} border rounded-lg p-6 space-y-4`}>
                <div>
                  <label className={`block text-sm font-semibold ${text} mb-2`}>
                    Your Query
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What insights would you like? (e.g., 'Show revenue trends by month')"
                    className={`w-full px-4 py-3 rounded-lg ${input} border focus:outline-none focus:ring-2 focus:ring-blue-500 text-base`}
                    disabled={loading}
                    onKeyDown={(e) => e.key === "Enter" && runAnalysis()}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-semibold ${text} mb-2`}
                    >
                      Graph Type
                    </label>
                    <select
                      value={graphType}
                      onChange={(e) => setGraphType(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg ${input} border focus:outline-none focus:ring-2 focus:ring-blue-500 text-base`}
                    >
                      <option value="auto">Auto (AI decides)</option>
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="area">Area Chart</option>
                      <option value="pie">Pie Chart</option>
                      <option value="table">Table</option>
                      <option value="metric">Metric</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold ${text} mb-2`}
                    >
                      File Type
                    </label>
                    <select
                      value="csv"
                      className={`w-full px-4 py-3 rounded-lg ${input} border focus:outline-none focus:ring-2 focus:ring-blue-500 text-base`}
                      disabled
                    >
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                      <option value="tsv">TSV</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={runAnalysis}
                  disabled={loading || !query.trim()}
                  className={`w-full px-6 py-3 ${primary} rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base`}
                >
                  {loading ? "Analyzing..." : "Analyze"}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Results */}
            {result && (
              <div className={`${card} border rounded-lg p-6`}>
                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                  <h2
                    className={`text-sm font-bold ${text} uppercase tracking-wide`}
                  >
                    Analysis Results
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowChat((s) => !s)}
                      className={`px-4 py-2 rounded-lg ${btn} border transition-colors text-sm font-medium flex items-center gap-2`}
                      style={{
                        borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </button>
                    <button
                      onClick={downloadReport}
                      className={`px-4 py-2 rounded-lg ${btn} border transition-colors text-sm font-medium flex items-center gap-2`}
                      style={{
                        borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
                {renderChart()}
              </div>
            )}

            {/* Chat */}
            {showChat && result && (
              <div className={`${card} border rounded-lg p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className={`text-sm font-bold ${text} uppercase tracking-wide`}
                  >
                    Ask About Report
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={clearChat}
                      className={`text-xs ${subtext} hover:${text}`}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowChat(false)}
                      className={`${subtext} hover:${text}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  className={`h-80 overflow-y-auto mb-4 p-4 rounded-lg ${
                    theme === "dark" ? "bg-slate-950" : "bg-slate-100"
                  }`}
                >
                  {chatMessages.length === 0 && (
                    <div className={`text-center ${subtext} text-sm py-12`}>
                      Ask questions about your analysis results
                    </div>
                  )}

                  {chatMessages.map((msg: any, i: number) => {
                    const bubbleClass =
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : theme === "dark"
                        ? "bg-slate-800 text-slate-50"
                        : "bg-white text-slate-950";

                    return (
                      <div
                        key={i}
                        className={`mb-3 ${
                          msg.role === "user" ? "text-right" : "text-left"
                        }`}
                      >
                        <div
                          className={`inline-block px-4 py-2 rounded-lg text-sm max-w-[85%] break-words ${bubbleClass}`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}

                  {chatLoading && (
                    <div className="text-left">
                      <div
                        className={`inline-block px-4 py-2 rounded-lg text-sm ${
                          theme === "dark" ? "bg-slate-800" : "bg-white"
                        } ${subtext}`}
                      >
                        Thinking...
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question..."
                    className={`flex-1 px-4 py-2 rounded-lg ${input} border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                    disabled={chatLoading}
                    onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    className={`px-4 py-2 ${primary} rounded-lg disabled:opacity-50 transition-colors`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowSettings(false)}
          />
          <div
            className={`relative w-full max-w-lg mx-auto ${card} border rounded-lg p-6 z-10 max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${text}`}>Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className={`${subtext} hover:${text}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`text-sm font-semibold ${text} block mb-2`}>
                  API Provider
                </label>
                <select
                  value={apiProvider}
                  onChange={(e) => setApiProvider(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg ${input} border text-base focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="backend">Backend (recommended)</option>
                  <option value="frontend">Frontend (use your keys)</option>
                </select>
              </div>

              <div>
                <label className={`text-sm font-semibold ${text} block mb-2`}>
                  Selected Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg ${input} border text-base focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="euron">Euron (Recommended)</option>
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI (GPT-4)</option>
                </select>
              </div>

              <div>
                <label className={`text-sm font-semibold ${text} block mb-2`}>
                  Euron API Key
                </label>
                <input
                  type="password"
                  value={euronKey}
                  onChange={(e) => setEuronKey(e.target.value)}
                  placeholder="Bearer token..."
                  className={`w-full px-4 py-2 rounded-lg ${input} border text-base focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`text-sm font-semibold ${text} block mb-2`}>
                  OpenAI Key
                </label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className={`w-full px-4 py-2 rounded-lg ${input} border text-base focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`text-sm font-semibold ${text} block mb-2`}>
                  Gemini Key
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  className={`w-full px-4 py-2 rounded-lg ${input} border text-base focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div
                className="flex items-center justify-end gap-3 mt-6 pt-4 border-t"
                style={{
                  borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
                }}
              >
                <button
                  onClick={() => setShowSettings(false)}
                  className={`px-4 py-2 rounded-lg ${btn} border text-base font-medium`}
                  style={{
                    borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveApiKeys}
                  className={`px-6 py-2 rounded-lg ${primary} text-base font-medium`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVAnalyzer;
