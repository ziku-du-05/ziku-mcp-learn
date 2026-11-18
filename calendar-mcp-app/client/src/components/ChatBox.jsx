import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function createMessageId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function ChatBox({ disabled = false }) {
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState([
    {
      id: createMessageId(),
      role: "assistant",
      content:
        "আপনার Google Calendar সম্পর্কে প্রশ্ন করুন।",
    },
  ]);

  // AI request-এর loading state
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(event) {
    event.preventDefault();

    const cleanInput = input.trim();

    // Empty message বা loading অবস্থায় নতুন request পাঠাব না
    if (!cleanInput || isLoading || disabled) {
      return;
    }

    const userMessage = {
      id: createMessageId(),
      role: "user",
      content: cleanInput,
    };

    // User message সঙ্গে সঙ্গে UI-তে দেখানো হচ্ছে
    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
    ]);

    setInput("");

    // API request শুরুর আগে loading চালু
    setIsLoading(true);

    try {
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          message: cleanInput,
          timezone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? "AI response পাওয়া যায়নি।"
        );
      }

      // AI response chat history-তে যোগ করা হচ্ছে
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: createMessageId(),
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error) {
      // Error-কেও assistant message হিসেবে দেখানো হচ্ছে
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: createMessageId(),
          role: "assistant",
          content: `দুঃখিত, একটি সমস্যা হয়েছে: ${error.message}`,
          isError: true,
        },
      ]);
    } finally {
      // সফল বা ব্যর্থ—দুই ক্ষেত্রেই loading বন্ধ হবে
      setIsLoading(false);
    }
  }

  return (
    <section className="chat-section">
      <h2>🤖 Calendar AI Assistant</h2>

      {disabled && (
        <p className="notice">
          AI assistant ব্যবহারের আগে Google Calendar
          connect করুন।
        </p>
      )}

      <div
        className="chat-messages"
        aria-live="polite"
        aria-busy={isLoading}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={[
              "chat-message",
              message.role,
              message.isError ? "chat-error" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <strong>
              {message.role === "user"
                ? "You"
                : "Assistant"}
            </strong>

            <p>{message.content}</p>
          </div>
        ))}

        {/* AI response-এর জন্য অপেক্ষার সময় এটি দেখা যাবে */}
        {isLoading && (
          <div
            className="chat-message assistant loading-message"
            role="status"
          >
            <div className="loading-heading">
              <span
                className="spinner"
                aria-hidden="true"
              />

              <strong>Assistant is thinking</strong>
            </div>

            <div
              className="typing-indicator"
              aria-label="AI response তৈরি করছে"
            >
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <form className="chat-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          disabled={disabled || isLoading}
          placeholder={
            isLoading
              ? "AI response তৈরি করছে..."
              : "আগামী ৭ দিনে আমার কী কী event আছে?"
          }
          onChange={(event) => {
            setInput(event.target.value);
          }}
        />

        <button
          type="submit"
          className="button send-button"
          disabled={
            disabled || isLoading || !input.trim()
          }
        >
          {isLoading ? (
            <>
              <span
                className="button-spinner"
                aria-hidden="true"
              />
              Sending...
            </>
          ) : (
            "Send"
          )}
        </button>
      </form>
    </section>
  );
}

export default ChatBox;