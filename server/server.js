// server/server.js
import express from "express";
import { WebSocketServer } from "ws";
import { createClient } from "@retconned/kick-js";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = 4000;

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT }, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

let client = null;

wss.on("connection", (ws) => {
  console.log("Frontend connected to WebSocket");

  ws.on("message", async (message) => {
    const data = JSON.parse(message);

    if (data.type === "joinChannel") {
      const { channelName } = data;
      console.log(`Connecting to Kick channel: ${channelName}`);

      // Disconnect old client if any
      if (client) {
        try {
          client.disconnect();
        } catch (err) {
          console.error("Error disconnecting previous client:", err);
        }
        client = null;
      }

      // Create a new client for the channel
      // readOnly: true will make the client only read messages from the chat, and disable all other authenticated actions.
      client = createClient(channelName, { logger: true, readOnly: true });

      client.on("ready", () => {
        console.log(`Connected to ${channelName}'s chat`);
      });

      client.on("ChatMessage", (msg) => {
        ws.send(JSON.stringify({
          type: "chatMessage",
          sender: msg.sender.username,
          content: msg.content
        }));
      });

      client.on("error", (err) => {
        ws.send(JSON.stringify({
          type: "error",
          message: err.message || "Unknown error"
        }));
      });

    }
  });

  ws.on("close", () => {
    console.log("Frontend disconnected");
  });
});
