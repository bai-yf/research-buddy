const BASE_URL = "https://fragrant-name-unmindful.ngrok-free.dev";

// 流式请求
export async function askQuestionStream(
  sessionId: string, 
  question: string,
  onChunk: (chunk: string) => void,
  onComplete: (fullAnswer: string) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/ask_stream`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ session_id: sessionId, question }),
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = decoder.decode(value);
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') {
              fullAnswer += data.content;
              onChunk(data.content);
            } else if (data.type === 'end') {
              onComplete(fullAnswer);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error: any) {
    onError(error.message);
  }
}

// 保留非流式接口作为备选
export async function askQuestion(sessionId: string, question: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify({ session_id: sessionId, question }),
  });
  if (!res.ok) throw new Error("请求失败");
  const data = await res.json();
  return data.answer;
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
