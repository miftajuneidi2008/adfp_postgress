// server.ts

import { WebSocketServer, WebSocket } from 'ws';
import { Client } from 'pg';
import url from 'url';

// Load environment variables (especially DATABASE_URL)
require('dotenv').config();

const WEBSOCKET_PORT = 3001; // A separate port from your Next.js app

/**
 * A map to store active client connections.
 * Key: userId (string)
 * Value: WebSocket instance
 */
const clients = new Map<string, WebSocket>();

// 1. --- WebSocket Server Setup ---
const wss = new WebSocketServer({ port: WEBSOCKET_PORT });

wss.on('connection', (ws, req) => {
  try {
    // Best Practice: Authenticate the user here. For this example, we trust the userId
    // from the URL, but in production, you should use a short-lived auth token (JWT).
    const parameters = new url.URL(req.url!, `http://${req.headers.host}`).searchParams;
    const userId = parameters.get('userId');

    if (!userId) {
      console.warn('Connection rejected: No userId provided.');
      ws.close(1008, 'User ID is required'); // 1008: Policy Violation
      return;
    }

    // If a user opens a new tab, close their old connection to prevent duplicates.
    if (clients.has(userId)) {
      clients.get(userId)?.close(1012, 'New connection established'); // 1012: Service Restart
    }
    
    clients.set(userId, ws);
    console.log(`[WebSocket] Client connected: ${userId}`);

    ws.on('close', () => {
      // Only remove the client if it's the same instance that's closing.
      if (clients.get(userId) === ws) {
        clients.delete(userId);
        console.log(`[WebSocket] Client disconnected: ${userId}`);
      }
    });

    ws.on('error', (error) => {
      console.error(`[WebSocket] Error for user ${userId}:`, error);
    });

  } catch (error) {
    console.error('[WebSocket] Error during connection setup:', error);
    ws.close();
  }
});

console.log(`[WebSocket] Server running on ws://localhost:${WEBSOCKET_PORT}`);


// 2. --- PostgreSQL Listener Setup ---
async function listenForDatabaseNotifications() {
  const listenerClient = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await listenerClient.connect();
    // Listen to the same channel name defined in the SQL trigger
    await listenerClient.query('LISTEN new_notification');
    console.log('[PostgreSQL] Listener connected and listening for notifications...');

    listenerClient.on('notification', (msg) => {
      if (msg.channel === 'new_notification' && msg.payload) {
        try {
          const notificationData = JSON.parse(msg.payload);
          const recipientId = notificationData.user_id;

          // Find the recipient's WebSocket connection in our map
          const recipientSocket = clients.get(recipientId);

          // Best Practice: Check if the client is connected and the socket is open before sending
          if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
            recipientSocket.send(JSON.stringify(notificationData));
            console.log(`[PostgreSQL] Pushed notification to client: ${recipientId}`);
          }
        } catch (error) {
          console.error('[PostgreSQL] Error processing notification payload:', error);
        }
      }
    });

    // Best Practice: Handle client disconnection to gracefully shut down
    listenerClient.on('end', () => {
      console.log('[PostgreSQL] Listener client disconnected. Attempting to reconnect...');
      setTimeout(listenForDatabaseNotifications, 5000); // Reconnect after 5 seconds
    });

  } catch (error) {
    console.error('[PostgreSQL] Listener failed to connect:', error);
    setTimeout(listenForDatabaseNotifications, 5000);
  }
}

// Start the PostgreSQL listener
listenForDatabaseNotifications();