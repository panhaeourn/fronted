import { useState } from "react";
import { apiFetch } from "../../api";
import aiLogo from "../../assets/AI logo.png";
import "./CitoAi.css";

type AiChatResponse = {
  reply: string;
  model: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function CitoAi() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hello, I am CITO AI. Ask me about your lesson, course, study plan, or anything you want explained.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = message.trim();
    if (!trimmed || loading) return;

    setError("");
    setMessage("");
    const nextMessages: ChatMessage[] = [...messages, { role: "user", text: trimmed }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await apiFetch<AiChatResponse>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: trimmed,
          messages: nextMessages.slice(-12),
        }),
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: response.reply || "I could not create an answer this time.",
        },
      ]);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Unable to reach CITO AI.";
      setError(text);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="cito-ai-page">
      <div className="cito-ai-shell">
        <header className="cito-ai-header">
          <div className="cito-ai-title-row">
            <img className="cito-ai-logo" src={aiLogo} alt="" />
            <div>
              <p className="cito-ai-kicker">CITO study assistant</p>
              <h1>CITO AI</h1>
            </div>
          </div>
          <span className="cito-ai-model">GPT-5 mini</span>
        </header>

        <div className="cito-ai-chat" aria-live="polite">
          {messages.map((item, index) => (
            <article
              className={`cito-ai-message cito-ai-message--${item.role}`}
              key={`${item.role}-${index}`}
            >
              <span className="cito-ai-message-label">
                {item.role === "assistant" ? "CITO AI" : "You"}
              </span>
              <p>{item.text}</p>
            </article>
          ))}

          {loading && (
            <article className="cito-ai-message cito-ai-message--assistant">
              <span className="cito-ai-message-label">CITO AI</span>
              <p>Thinking...</p>
            </article>
          )}
        </div>

        {error && <div className="cito-ai-error">{error}</div>}

        <form className="cito-ai-form" onSubmit={sendMessage}>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask CITO AI..."
            rows={3}
          />
          <button type="submit" disabled={loading || !message.trim()}>
            {loading ? "Sending" : "Send"}
          </button>
        </form>
      </div>
    </section>
  );
}
