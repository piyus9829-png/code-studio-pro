import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import * as Y from 'yjs';

export interface CollabPeer {
  id: string;
  name: string;
  color: string;
  avatarColor: string;
  initials: string;
  line: number;
  col: number;
  selectionEnd?: { line: number; col: number } | null;
  status: 'active' | 'typing' | 'idle' | 'navigating' | 'selecting';
  activityMessage?: string;
  fileId?: string;
  lastActive: number;
  ws: WebSocket;
}

interface CollabRoom {
  roomId: string;
  doc: Y.Doc;
  peers: Map<string, CollabPeer>;
  createdAt: number;
  lastActivity: number;
}

// In-memory Room State Registry for CRDT Docs
const activeRooms = new Map<string, CollabRoom>();

/**
 * Gets or creates a collaborative Y.Doc room
 */
export function getOrCreateRoom(roomId: string, initialContent?: string): CollabRoom {
  let room = activeRooms.get(roomId);
  if (!room) {
    const doc = new Y.Doc();
    if (initialContent) {
      const yText = doc.getText('codetext');
      yText.insert(0, initialContent);
    }
    room = {
      roomId,
      doc,
      peers: new Map(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
    activeRooms.set(roomId, room);
  }
  return room;
}

/**
 * Returns summary of all active rooms for telemetry/dashboard
 */
export function getActiveCollabRoomsSummary() {
  const rooms: Array<{
    roomId: string;
    peerCount: number;
    createdAt: number;
    lastActivity: number;
    textLength: number;
  }> = [];

  for (const [roomId, room] of activeRooms.entries()) {
    rooms.push({
      roomId,
      peerCount: room.peers.size,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
      textLength: room.doc.getText('codetext').length,
    });
  }

  return rooms;
}

/**
 * Setup WebSocket Server attached to Express HTTP server for real-time Yjs CRDT synchronization
 */
export function setupYjsWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({
    noServer: true,
  });

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
    
    // Accept /ws/collab and /yjs WebSocket connections
    if (pathname.startsWith('/ws/collab') || pathname.startsWith('/yjs')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentPeerId: string | null = null;
    let isAlive = true;

    ws.on('pong', () => {
      isAlive = true;
    });

    ws.on('message', (messageBuffer: Buffer | string) => {
      try {
        const text = messageBuffer.toString('utf-8');
        const msg = JSON.parse(text);

        switch (msg.type) {
          case 'join-room': {
            const { roomId, peer, initialContent } = msg;
            if (!roomId || !peer?.id) return;

            currentRoomId = roomId;
            currentPeerId = peer.id;

            const room = getOrCreateRoom(roomId, initialContent);
            room.lastActivity = Date.now();

            const collabPeer: CollabPeer = {
              ...peer,
              ws,
              lastActive: Date.now(),
            };
            room.peers.set(peer.id, collabPeer);

            // 1. Send initial sync update to newly joined client
            const stateUpdate = Y.encodeStateAsUpdate(room.doc);
            const base64Update = Buffer.from(stateUpdate).toString('base64');
            const currentDocText = room.doc.getText('codetext').toString();

            // Prepare list of existing peers
            const peerList = Array.from(room.peers.values())
              .filter(p => p.id !== peer.id)
              .map(p => ({
                id: p.id,
                name: p.name,
                color: p.color,
                avatarColor: p.avatarColor,
                initials: p.initials,
                line: p.line,
                col: p.col,
                selectionEnd: p.selectionEnd,
                status: p.status,
                activityMessage: p.activityMessage,
                fileId: p.fileId,
                lastActive: p.lastActive,
              }));

            ws.send(JSON.stringify({
              type: 'sync-init',
              roomId,
              update: base64Update,
              content: currentDocText,
              peers: peerList,
            }));

            // 2. Broadcast peer-joined to all other peers in the room
            const joinNotification = JSON.stringify({
              type: 'peer-joined',
              roomId,
              peer: {
                id: peer.id,
                name: peer.name,
                color: peer.color,
                avatarColor: peer.avatarColor,
                initials: peer.initials,
                line: peer.line || 1,
                col: peer.col || 0,
                selectionEnd: peer.selectionEnd || null,
                status: peer.status || 'active',
                activityMessage: peer.activityMessage || 'Joined workspace',
                fileId: peer.fileId,
                lastActive: Date.now(),
              },
            });

            for (const otherPeer of room.peers.values()) {
              if (otherPeer.id !== peer.id && otherPeer.ws.readyState === WebSocket.OPEN) {
                otherPeer.ws.send(joinNotification);
              }
            }
            break;
          }

          case 'yjs-update': {
            // CRDT binary delta update
            const { roomId, update } = msg;
            if (!roomId || !update) return;

            const room = activeRooms.get(roomId);
            if (!room) return;

            room.lastActivity = Date.now();
            const updateBuffer = Buffer.from(update, 'base64');
            const updateUint8 = new Uint8Array(updateBuffer);

            // Apply update to authoritative Y.Doc
            try {
              Y.applyUpdate(room.doc, updateUint8, 'websocket-remote');
            } catch (applyErr) {
              console.error('CRDT update apply error:', applyErr);
            }

            // Broadcast CRDT update to other peers in the room
            const broadcastMsg = JSON.stringify({
              type: 'yjs-update',
              roomId,
              senderId: currentPeerId,
              update,
            });

            for (const peer of room.peers.values()) {
              if (peer.id !== currentPeerId && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(broadcastMsg);
              }
            }
            break;
          }

          case 'awareness-update': {
            // Live Cursor & Presence
            const { roomId, peerUpdate } = msg;
            if (!roomId || !peerUpdate?.id) return;

            const room = activeRooms.get(roomId);
            if (!room) return;

            const existingPeer = room.peers.get(peerUpdate.id);
            if (existingPeer) {
              Object.assign(existingPeer, peerUpdate, { lastActive: Date.now() });
            }

            const broadcastMsg = JSON.stringify({
              type: 'awareness-update',
              roomId,
              peer: peerUpdate,
            });

            for (const peer of room.peers.values()) {
              if (peer.id !== peerUpdate.id && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(broadcastMsg);
              }
            }
            break;
          }

          case 'doc-init-if-empty': {
            const { roomId, content } = msg;
            if (!roomId || !content) return;

            const room = activeRooms.get(roomId);
            if (room && room.doc.getText('codetext').length === 0) {
              room.doc.getText('codetext').insert(0, content);
              const stateUpdate = Y.encodeStateAsUpdate(room.doc);
              const base64Update = Buffer.from(stateUpdate).toString('base64');

              const syncMsg = JSON.stringify({
                type: 'yjs-update',
                roomId,
                update: base64Update,
              });

              for (const peer of room.peers.values()) {
                if (peer.ws.readyState === WebSocket.OPEN) {
                  peer.ws.send(syncMsg);
                }
              }
            }
            break;
          }

          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket collab message error:', err);
      }
    });

    const cleanupPeer = () => {
      if (currentRoomId && currentPeerId) {
        const room = activeRooms.get(currentRoomId);
        if (room) {
          room.peers.delete(currentPeerId);
          
          // Broadcast peer-left to remaining peers
          const leaveMsg = JSON.stringify({
            type: 'peer-left',
            roomId: currentRoomId,
            peerId: currentPeerId,
          });

          for (const peer of room.peers.values()) {
            if (peer.ws.readyState === WebSocket.OPEN) {
              peer.ws.send(leaveMsg);
            }
          }

          // Clean up empty rooms after 30 minutes of inactivity
          if (room.peers.size === 0 && Date.now() - room.lastActivity > 1800000) {
            activeRooms.delete(currentRoomId);
          }
        }
      }
    };

    ws.on('close', cleanupPeer);
    ws.on('error', cleanupPeer);
  });

  // Heartbeat interval to detect stale connections
  const interval = setInterval(() => {
    wss.clients.forEach((client: any) => {
      if (client.isAlive === false) return client.terminate();
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}
