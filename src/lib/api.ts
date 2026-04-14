const BASE_URL = "http://127.0.0.1:8000";
//const BASE_URL = "https://fragrant-name-unmindful.ngrok-free.dev";
//const BASE_URL = "https://small-buttons-learn.loca.lt";

// 带超时的 fetch
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = 600000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function askQuestion(sessionId: string, question: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/ask`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ session_id: sessionId, question }),
    }, 600000); // 600秒超时
    
    if (!res.ok) throw new Error(`请求失败: ${res.status}`);
    const data = await res.json();
    return data.answer;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return "请求超时，后端处理时间较长，请稍后重试。";
    }
    throw error;
  }
}

export async function setTopic(sessionId: string, topic: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/set_topic`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify({ session_id: sessionId, topic }),
  });
  if (!res.ok) throw new Error("设置主题失败");
}

export async function getTopic(sessionId: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/get_topic/${sessionId}`, {
    headers: {
      "ngrok-skip-browser-warning": "true"
    }
  });
  if (!res.ok) throw new Error("获取主题失败");
  const data = await res.json();
  return data.topic || "";
}
