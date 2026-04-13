import { useState } from "react";
import { Plus, Trash2, MessageSquare, BookOpen, Pencil, Check, X } from "lucide-react";
import type { Session } from "@/lib/sessions";
import { setTopic } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  sessions: Session[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onTopicChange: (id: string, topic: string) => void;
}

export default function AppSidebar({ sessions, activeId, onSelect, onNew, onDelete, onTopicChange }: AppSidebarProps) {
  const active = sessions.find((s) => s.id === activeId);
  const [editingTopic, setEditingTopic] = useState(false);
  const [topicDraft, setTopicDraft] = useState("");

  const startEdit = () => {
    setTopicDraft(active?.topic || "");
    setEditingTopic(true);
  };

  const saveTopic = async () => {
    if (!active) return;
    const val = topicDraft.trim();
    onTopicChange(active.id, val);
    try {
      await setTopic(active.id, val);
    } catch { /* silent */ }
    setEditingTopic(false);
  };

  return (
    <aside className="w-72 h-full flex flex-col bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))]">
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-base">文献智能体</h1>
        </div>
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          新建会话
        </button>
      </div>

      {/* Topic */}
      {active && (
        <div className="px-4 py-3 border-b border-[hsl(var(--sidebar-border))]">
          <p className="text-xs text-muted-foreground mb-1">研究方向</p>
          {editingTopic ? (
            <div className="flex items-center gap-1">
              <input
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveTopic()}
                className="flex-1 text-sm bg-card border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                placeholder="输入研究方向..."
              />
              <button onClick={saveTopic} className="p-1 text-primary hover:bg-accent rounded">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setEditingTopic(false)} className="p-1 text-muted-foreground hover:bg-accent rounded">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-sm truncate flex-1">{active.topic || "未设置"}</span>
              <button onClick={startEdit} className="p-1 text-muted-foreground hover:text-primary hover:bg-accent rounded transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Session list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-colors text-sm",
              s.id === activeId ? "bg-accent text-accent-foreground" : "hover:bg-muted"
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate flex-1">{s.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
