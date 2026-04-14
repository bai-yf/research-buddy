const BASE_URL = "https://127.0.0.1:8000";
#const BASE_URL = "https://fragrant-name-unmindful.ngrok-free.dev";

export async function askQuestion(sessionId: string, question: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, question }),
  });
  if (!res.ok) throw new Error("请求失败");
  const data = await res.json();
  return data.answer;
}

export async function setTopic(sessionId: string, topic: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/set_topic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, topic }),
  });
  if (!res.ok) throw new Error("设置主题失败");
}

export async function getTopic(sessionId: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/get_topic/${sessionId}`);
  if (!res.ok) throw new Error("获取主题失败");
  const data = await res.json();
  return data.topic || "";
}
