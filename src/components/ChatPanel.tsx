import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/lib/sessions";
import { askQuestion } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  sessionId: string;
  messages: ChatMessage[];
  onMessagesChange: (msgs: ChatMessage[]) => void;
}

const QuickButtons = ({ onSend, onClear }: { onSend: (text: string) => void; onClear: () => void }) => {
  const buttons = [
    { label: "🔥 热点", value: "热点" },
    { label: "💡 建议", value: "没思路" },
    { label: "📄 论文", value: "推荐核心论文" },
  ];
  return (
    <div className="flex gap-2 px-4 py-2">
      {buttons.map((b) => (
        <button
          key={b.value}
          onClick={() => onSend(b.value)}
          className="px-3 py-1.5 text-sm rounded-full bg-accent text-accent-foreground hover:bg-[hsl(var(--quick-btn-hover))] transition-colors font-medium"
        >
          {b.label}
        </button>
      ))}
      <button
        onClick={onClear}
        className="px-3 py-1.5 text-sm rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium"
      >
        🗑 清空
      </button>
    </div>
  );
};

// 转义正则表达式特殊字符
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 将文本中的 URL 和 Markdown 链接转换为可点击的 HTML
const formatContent = (text: string) => {
  if (!text) return "...";
  
  let processed = text;
  
  // 1. 处理 Markdown 链接 [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const markdownLinks: { text: string; url: string }[] = [];
  let match;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    markdownLinks.push({ text: match[1], url: match[2] });
  }
  
  markdownLinks.forEach((link) => {
    const escapedText = escapeRegex(link.text);
    const escapedUrl = escapeRegex(link.url);
    processed = processed.replace(
      new RegExp(`\\[${escapedText}\\]\\(${escapedUrl}\\)`, 'g'),
      `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline hover:text-blue-700 break-all">${link.text}</a>`
    );
  });
  
  // 2. 处理普通 URL（http:// 或 https:// 开头）
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  processed = processed.replace(urlRegex, (url) => {
    // 如果已经是链接的一部分，跳过
    if (processed.includes(`<a href="${url}"`)) return url;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline hover:text-blue-700 break-all">${url}</a>`;
  });
  
  // 3. 处理 DOI 链接（可选）
  const doiRegex = /(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/gi;
  processed = processed.replace(doiRegex, (doi) => {
    const url = `https://doi.org/${doi}`;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline hover:text-blue-700 break-all">${doi}</a>`;
  });
  
  return <span dangerouslySetInnerHTML={{ __html: processed }} />;
};

const MessageBubble = ({ msg }: { msg: ChatMessage }) => {
  if (!msg || !msg.role) return null;
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex w-full mb-3", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm",
          isUser
            ? "bg-[hsl(var(--chat-user))] text-[hsl(var(--chat-user-foreground))] rounded-br-md"
            : "bg-[hsl(var(--chat-ai))] text-[hsl(var(--chat-ai-foreground))] rounded-bl-md"
        )}
      >
        {formatContent(msg.content)}
      </div>
    </div>
  );
};

export default function ChatPanel({ sessionId, messages, onMessagesChange }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = { role: "user", content: trimmed, timestamp: Date.now() };
      const updated = [...messages, userMsg];
      onMessagesChange(updated);
      setInput("");
      setLoading(true);

      try {
        const answer = await askQuestion(sessionId, trimmed);
        const aiMsg: ChatMessage = { role: "ai", content: answer, timestamp: Date.now() };
        onMessagesChange([...updated, aiMsg]);
      } catch {
        const errMsg: ChatMessage = { role: "ai", content: "⚠️ 请求失败，请检查后端服务是否运行。", timestamp: Date.now() };
        onMessagesChange([...updated, errMsg]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [sessionId, messages, onMessagesChange, loading]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <span className="text-4xl">🧬</span>
            <p className="text-lg font-medium">医学文献智能助手</p>
            <p className="text-sm">输入问题开始探索，或使用快捷按钮</p>
          </div>
        )}
        {messages.filter(msg => msg && msg.role).map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[hsl(var(--chat-ai))] text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick buttons */}
      <QuickButtons onSend={sendMessage} onClear={() => onMessagesChange([])} />

      {/* Input */}
      <div className="px-4 pb-4">
        <div className="flex items-end gap-2 bg-card border rounded-xl p-2 shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的问题..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground max-h-32"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
