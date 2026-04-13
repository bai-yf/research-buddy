import { useState, useEffect, useCallback } from "react";
import AppSidebar from "@/components/AppSidebar";
import ChatPanel from "@/components/ChatPanel";
import {
  type Session,
  type ChatMessage,
  loadSessions,
  saveSessions,
  getActiveSessionId,
  setActiveSessionId,
  createSession,
} from "@/lib/sessions";

export default function Index() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const loaded = loadSessions();
    if (loaded.length > 0) return loaded;
    const first = createSession();
    return [first];
  });

  const [activeId, setActiveId] = useState<string>(() => {
    const stored = getActiveSessionId();
    if (stored && sessions.some((s) => s.id === stored)) return stored;
    return sessions[0]?.id || "";
  });

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    setActiveSessionId(activeId);
  }, [activeId]);

  const activeSession = sessions.find((s) => s.id === activeId);

  const handleNew = useCallback(() => {
    const s = createSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (next.length === 0) {
          const fresh = createSession();
          setActiveId(fresh.id);
          return [fresh];
        }
        if (id === activeId) setActiveId(next[0].id);
        return next;
      });
    },
    [activeId]
  );

  const handleMessagesChange = useCallback(
    (msgs: ChatMessage[]) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const name = msgs.length > 0 ? msgs[0].content.slice(0, 20) : "新会话";
          return { ...s, messages: msgs, name };
        })
      );
    },
    [activeId]
  );

  const handleTopicChange = useCallback(
    (id: string, topic: string) => {
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, topic } : s)));
    },
    []
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNew}
        onDelete={handleDelete}
        onTopicChange={handleTopicChange}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {activeSession && (
          <ChatPanel
            key={activeId}
            sessionId={activeId}
            messages={activeSession.messages}
            onMessagesChange={handleMessagesChange}
          />
        )}
      </main>
    </div>
  );
}
