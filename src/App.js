import React, { useState, useEffect, useRef } from "react";

const App = () => {
  const [channelName, setChannelName] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Connect to backend WebSocket
    wsRef.current = new WebSocket("ws://localhost:4000");

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chatMessage") {
        setMessages((prev) => [...prev, { sender: data.sender, content: data.content }]);
      } else if (data.type === "error") {
        setError(data.message);
      }
    };

    return () => {
      wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessages([]);
    setError(null);
    wsRef.current.send(JSON.stringify({
      type: "joinChannel",
      channelName
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Kick Chat Viewer</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="Enter Kick channel name"
          className="p-2 rounded bg-gray-800 border border-gray-700"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
        >
          Connect
        </button>
      </form>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto w-full max-w-2xl">
        {messages.map((msg, i) => (
          <div key={i} className="mb-2">
            <span className="font-bold text-green-400">{msg.sender}: </span>
            <span>{msg.content}</span>
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>
    </div>
  );
};

export default App;
