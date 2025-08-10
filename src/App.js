import React, { useState, useEffect, useRef } from "react";

const App = () => {
  const [channelName, setChannelName] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [emoteMap, setEmoteMap] = useState({}); // New state for storing fetched emotes
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
      } else if (data.type === "emoteData") {
        // Update emote map when received from the server
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

  // Function to render message content, replacing emote names with images
  const renderMessageContent = (content) => {
    // Split the content by words and potential emote patterns
    const parts = content.split(/(\s+|:[a-zA-Z0-9_]+:)/g);

    return parts.map((part, index) => {
      if (!part || part.trim() === '') return <span key={index}>{part}</span>;

      // Check if the part matches an emote format like :emote_name:
      if (part.startsWith(':') && part.endsWith(':') && part.length > 2) {
        const emoteKey = part.toLowerCase(); // e.g., ":lul:"
        // Use the fetched emoteMap instead of hypotheticalKickEmotes
        if (emoteMap[emoteKey]) {
          return (
            <img
              key={index}
              src={emoteMap[emoteKey]}
              alt={emoteKey}
              title={emoteKey} // Add title for hover text
              className="inline-block w-6 h-6 mx-0.5 align-middle"
              onError={(e) => { e.target.onerror = null; e.target.src = "[https://placehold.co/24x24/FF0000/FFFFFF?text=X](https://placehold.co/24x24/FF0000/FFFFFF?text=X)"; }} // Fallback for broken images
            />
          );
        }
      }
      // Render regular text or unrecognized emote text
      return <span key={index}>{part}</span>;
    });
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 font-inter">
      <h1 className="text-4xl font-extrabold mb-6 text-green-400 drop-shadow-lg">Kick Chat Viewer 💬</h1>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-6 w-full max-w-md">
        <input
          type="text"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="Enter Kick channel name (e.g., xqc)"
          className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 flex-grow"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
        >
          Connect
        </button>
      </form>

      {error && (
        <div className="bg-red-900 bg-opacity-70 text-red-300 p-4 rounded-lg mb-6 w-full max-w-2xl text-center shadow-inner">
          <p className="font-medium">Error: {error} 😟</p>
          <p className="text-sm mt-1">Please ensure the channel name is correct and the server is running.</p>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow-xl p-4 h-96 overflow-y-auto w-full max-w-2xl flex flex-col space-y-2">
        {messages.length === 0 && !error && (
          <p className="text-gray-500 text-center flex-grow flex items-center justify-center">
            Waiting for messages... Type a channel name to connect! 🚀
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="mb-0.5 p-1 rounded hover:bg-gray-700 transition-colors duration-100 break-words">
            <span className="font-bold text-blue-400">{msg.sender}: </span>
            <span className="text-gray-200">{renderMessageContent(msg.content)}</span>
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>
    </div>
  );
};

export default App;