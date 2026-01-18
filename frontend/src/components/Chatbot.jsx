import { useState } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const response = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_message: userMsg.text }),
    });

    const data = await response.json();

    const botMsg = { sender: "bot", text: data.bot_response };
    setMessages((prev) => [...prev, botMsg]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.chatbox}>
        {messages.length === 0 && (
          <div style={styles.emptyHint}>
            👋 Ask me about your expenses
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf:
                msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
        />
        <button style={styles.button} onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "350px",
  },

  chatbox: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
    marginBottom: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    backgroundColor: "#fafafa",
    borderRadius: "6px",
  },

  message: {
    maxWidth: "85%",
    padding: "6px 8px",
    fontSize: "14px",
    lineHeight: "1.4",
    backgroundColor: "#eaeaea",
    borderRadius: "6px",
    wordWrap: "break-word",
  },

  emptyHint: {
    fontSize: "13px",
    color: "#888",
  },

  inputRow: {
    display: "flex",
    gap: "6px",
  },

  input: {
    flex: 1,
    padding: "6px",
  },

  button: {
    padding: "6px 12px",
  },
};
