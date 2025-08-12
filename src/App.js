import React, { useState, useEffect, useRef } from "react";

const App = () => {
  const [channelName, setChannelName] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [emoteMap, setEmoteMap] = useState({});
  const wsRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:4000");

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chatMessage") {
        setMessages((prev) => [...prev, { sender: data.sender, content: data.content }]);
      } else if (data.type === "error") {
        setError(data.message);
      } else if (data.type === "emoteData") {
        setEmoteMap(data.emotes);
        console.log("Emote data received from server:", data.emotes);
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

  const renderMessageContent = (content) => {
    const parts = content.split(/(\s+|:[a-zA-Z0-9_]+:)/g);

    return parts.map((part, index) => {
      if (!part || part.trim() === '') return <span key={index}>{part}</span>;

      if (part.startsWith(':') && part.endsWith(':') && part.length > 2) {
        const emoteKey = part.toLowerCase();
        if (emoteMap[emoteKey]) {
          return (
            <img
              key={index}
              src={emoteMap[emoteKey]}
              alt={emoteKey}
              title={emoteKey}
              className="inline-block w-6 h-6 mx-0.5 align-middle"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/24x24/FF0000/FFFFFF?text=X"; }}
            />
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-6 font-inter">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-4xl flex flex-col h-[90vh]">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-green-400 drop-shadow-lg tracking-tight">
            Kick Chat Viewer 💬
          </h1>
          <p className="mt-2 text-gray-400">View live chat messages from your favorite Kick channels.</p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-8 w-full max-w-lg mx-auto">
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="Enter a Kick channel name (e.g., xqc)"
            className="p-4 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 flex-grow text-lg"
          />
          <button
            type="submit"
            className="px-8 py-4 bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Connect
          </button>
        </form>

        {error && (
          <div className="bg-red-800 bg-opacity-30 text-red-300 p-4 rounded-xl mb-6 w-full text-center shadow-inner border border-red-700">
            <p className="font-medium text-lg">Error: {error} 😟</p>
            <p className="text-sm mt-1">Please double-check the channel name and ensure the server is running.</p>
          </div>
        )}

        <div className="flex-grow bg-gray-700 rounded-xl shadow-inner p-6 overflow-y-auto w-full flex flex-col space-y-3 chat-container">
          {messages.length === 0 && !error && (
            <p className="text-gray-400 text-center flex-grow flex items-center justify-center text-xl font-medium">
              Waiting for messages... <br /> Type a channel name and click 'Connect'! 🚀
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-150 break-words group">
              <span className="font-bold text-blue-400 mr-2">{msg.sender}:</span>
              <span className="text-gray-200">{renderMessageContent(msg.content)}</span>
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>
      </div>
    </div>
  );
};

export default App;