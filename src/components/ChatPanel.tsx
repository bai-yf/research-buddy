import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/lib/sessions";
import { askQuestionStream } from "@/lib/api";  // 改成流式
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

const MessageBubble = ({ msg }: { msg: ChatMessage }) => {
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
        {msg.content}
      </div>
    </div>
  );
};

export default function ChatPanel({ sessionId, messages, onMessagesChange }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentAiIndexRef = useRef<number>(-1);  // 记录当前 AI 消息的索引

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      // 添加用户消息
      const userMsg: ChatMessage = { role: "user", content: trimmed, timestamp: Date.now() };
      const updated = [...messages, userMsg];
      onMessagesChange(updated);
      setInput("");
      setLoading(true);

      // 添加一个空的 AI 消息占位
      const aiPlaceholder: ChatMessage = { role: "ai", content: "", timestamp: Date.now() };
      const withPlaceholder = [...updated, aiPlaceholder];
      onMessagesChange(withPlaceholder);
      currentAiIndexRef.current = withPlaceholder.length - 1;

      try {
        // 使用流式请求
        await askQuestionStream(
          sessionId,
          trimmed,
          // onChunk: 逐字追加
          (chunk: string) => {
            setLoading(false); // 收到第一个 chunk 时关闭 loading
            onMessagesChange((prev) => {
              const newMessages = [...prev];
              const lastMsg = newMessages[currentAiIndexRef.current];
              if (lastMsg && lastMsg.role === "ai") {
                lastMsg.content += chunk;
              }
              return newMessages;
            });
          },
          // onComplete: 完成
          (fullAnswer: string) => {
            console.log("流式完成");
            setLoading(false);
            inputRef.current?.focus();
          },
          // onError: 错误
          (error: string) => {
            console.error("流式错误:", error);
            onMessagesChange((prev) => {
              const newMessages = [...prev];
              const lastMsg = newMessages[currentAiIndexRef.current];
              if (lastMsg && lastMsg.role === "ai") {
                lastMsg.content = `⚠️ 请求失败: ${error}`;
              }
              return newMessages;
            });
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("请求错误:", error);
        onMessagesChange((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[currentAiIndexRef.current];
          if (lastMsg && lastMsg.role === "ai") {
            lastMsg.content = "⚠️ 请求失败，请检查后端服务是否运行。";
          }
          return newMessages;
        });
        setLoading(false);
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
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && messages[messages.length - 1]?.content === "" && (
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
