export interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: number;
}

export interface Session {
  id: string;
  name: string;
  topic: string;
  messages: ChatMessage[];
  createdAt: number;
}

const STORAGE_KEY = "med_lit_sessions";
const ACTIVE_KEY = "med_lit_active_session";

function generateSessionId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `session_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveSessionId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function createSession(): Session {
  return {
    id: generateSessionId(),
    name: "新会话",
    topic: "",
    messages: [],
    createdAt: Date.now(),
  };
}
