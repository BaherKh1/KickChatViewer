import express from "express";
import { WebSocketServer } from "ws";
import { createClient } from "@retconned/kick-js";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = 4000;
// Base URL for the unofficial Kick API endpoints
const KICK_API_BASE_URL = "https://kick.com/api/v1";

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT }, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

let client = null;

// Function to fetch emotes from the Kick API
async function fetchEmotes(channelName = null) {
  const allEmotes = {}; // Object to store emote_name: emote_url

  try {
    // 1. Fetch global emotes
    const globalEmotesResponse = await fetch(`${KICK_API_BASE_URL}/emotes`);
    if (globalEmotesResponse.ok) {
      const globalEmotesData = await globalEmotesResponse.json();
      console.log("Raw global emotes data:", JSON.stringify(globalEmotesData, null, 2)); // Log raw data for debugging

      if (Array.isArray(globalEmotesData)) {
        globalEmotesData.forEach(emote => {
          // Assuming the emote object might contain different sized URLs or a direct URL
          // Common patterns: `url`, `src`, `images.url_2x`, `urls.3x` etc.
          // We will try to find a suitable URL.
          const imageUrl = emote.url ||
            (emote.images && (emote.images.url_3x || emote.images.url_2x || emote.images.url_1x)) ||
            emote.src; // Common alternatives

          if (imageUrl && emote.name) {
            allEmotes[`:${emote.name.toLowerCase()}:`] = imageUrl;
          }
        });
        console.log(`Fetched ${Object.keys(allEmotes).length} global emotes.`);
      } else {
        console.warn("Global emotes data is not an array as expected.");
      }
    } else {
      console.warn(`Could not fetch global emotes: ${globalEmotesResponse.status} ${globalEmotesResponse.statusText}`);
    }
  } catch (error) {
    console.error("Error fetching global emotes:", error);
  }

  // 2. Fetch channel-specific emotes if a channel name is provided
  if (channelName) {
    try {
      // First, get channel ID from channel name
      const channelDataResponse = await fetch(`${KICK_API_BASE_URL}/channels/${channelName}`);
      if (channelDataResponse.ok) {
        const channelData = await channelDataResponse.json();
        const channelId = channelData.id;

        const channelEmotesResponse = await fetch(`${KICK_API_BASE_URL}/channels/${channelId}/emotes`);
        if (channelEmotesResponse.ok) {
          const channelEmotesData = await channelEmotesResponse.json();
          console.log(`Raw channel emotes data for ${channelName}:`, JSON.stringify(channelEmotesData, null, 2)); // Log raw data for debugging

          if (Array.isArray(channelEmotesData)) {
            channelEmotesData.forEach(emote => {
              const imageUrl = emote.url ||
                (emote.images && (emote.images.url_3x || emote.images.url_2x || emote.images.url_1x)) ||
                emote.src;

              if (imageUrl && emote.name) {
                // Channel emotes might override global emotes with the same name
                allEmotes[`:${emote.name.toLowerCase()}:`] = imageUrl;
              }
            });
            console.log(`Fetched ${channelEmotesData.length} channel emotes for ${channelName}.`);
          } else {
            console.warn(`Channel emotes data for ${channelName} is not an array as expected.`);
          }
        } else {
          console.warn(`Could not fetch channel emotes for ${channelName}: ${channelEmotesResponse.status} ${channelEmotesResponse.statusText}`);
        }
      } else {
        console.warn(`Could not fetch channel ID for ${channelName}: ${channelDataResponse.status} ${channelDataResponse.statusText}`);
      }
    } catch (error) {
      console.error(`Error fetching channel emotes for ${channelName}:`, error);
    }
  }
  return allEmotes;
}


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

      // Fetch emotes and send them to the frontend
      const emotes = await fetchEmotes(channelName);
      ws.send(JSON.stringify({
        type: "emoteData",
        emotes: emotes
      }));
      console.log("Sent emote data to frontend.");

      // Create a new client for the channel
      // readOnly: true will make the client only read messages from the chat, and disable all other authenticated actions.
      client = createClient(channelName, { logger: true, readOnly: true });

      client.on("ready", () => {
        console.log(`Connected to ${channelName}'s chat`);
      });

      client.on("ChatMessage", (msg) => {
        // Send the full message object to the frontend, in case it contains more data
        ws.send(JSON.stringify({
          type: "chatMessage",
          sender: msg.sender.username,
          content: msg.content,
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