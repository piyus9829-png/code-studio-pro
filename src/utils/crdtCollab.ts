import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { CollaboratorUser } from '../types';

export interface YjsCollabOptions {
  roomId: string;
  fileId: string;
  initialContent: string;
  currentUser: {
    id: string;
    name: string;
    color: string;
    avatarColor: string;
    initials: string;
  };
  onRemoteContentChange: (newContent: string) => void;
  onPeersChange: (peers: CollaboratorUser[]) => void;
  onConnectionStatusChange: (status: 'connecting' | 'connected' | 'offline' | 'error') => void;
  onIndexeddbSynced?: (syncedContent: string) => void;
}

/**
 * Real-time Yjs CRDT Room Client Provider with IndexedDB Cross-Session Persistence
 * Handles conflict-free distributed document replication over WebSocket and persistent client-side caching.
 */
export class YjsCollabClient {
  public doc: Y.Doc;
  public yText: Y.Text;
  public indexeddbProvider: IndexeddbPersistence | null = null;
  private ws: WebSocket | null = null;
  private options: YjsCollabOptions;
  private isDestroyed = false;
  private isApplyingRemote = false;
  private reconnectTimer: any = null;
  private peersMap = new Map<string, CollaboratorUser>();
  private offlineUpdateQueue: string[] = [];

  constructor(options: YjsCollabOptions) {
    this.options = options;
    this.doc = new Y.Doc();
    this.yText = this.doc.getText('codetext');

    // 1. Initialize IndexedDB Persistence for offline & cross-session CRDT durability
    try {
      const indexeddbRoomName = `crdt_workspace_${options.roomId}`;
      this.indexeddbProvider = new IndexeddbPersistence(indexeddbRoomName, this.doc);

      this.indexeddbProvider.on('synced', () => {
        if (this.isDestroyed) return;
        const currentText = this.yText.toString();
        if (currentText.length > 0) {
          this.options.onRemoteContentChange(currentText);
          if (this.options.onIndexeddbSynced) {
            this.options.onIndexeddbSynced(currentText);
          }
        } else if (this.options.initialContent && this.yText.length === 0) {
          this.yText.insert(0, this.options.initialContent);
        }
      });
    } catch (idbErr) {
      console.warn('Y-IndexedDB initialization fallback:', idbErr);
      if (options.initialContent && this.yText.length === 0) {
        this.yText.insert(0, options.initialContent);
      }
    }

    // 2. Listen to Yjs local mutations to broadcast CRDT delta updates
    this.doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin === 'remote-ws' || origin === 'init-sync' || origin === 'indexeddb') {
        return; // Don't echo back updates received from remote or local storage
      }

      const base64Update = this.uint8ToBase64(update);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'yjs-update',
          roomId: this.options.roomId,
          update: base64Update,
        }));
      } else {
        this.offlineUpdateQueue.push(base64Update);
      }
    });

    // 3. Observe Y.Text mutations to notify local React editor component
    this.yText.observe((event, transaction) => {
      if (transaction.origin === 'remote-ws' || transaction.origin === 'init-sync' || transaction.origin === 'indexeddb') {
        this.isApplyingRemote = true;
        const currentString = this.yText.toString();
        this.options.onRemoteContentChange(currentString);
        this.isApplyingRemote = false;
      }
    });

    this.connect();
  }

  private uint8ToBase64(arr: Uint8Array): string {
    let binary = '';
    const len = arr.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return window.btoa(binary);
  }

  private base64ToUint8(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Connects to the real-time WebSocket backend with resilience
   */
  public connect() {
    if (this.isDestroyed) return;
    this.options.onConnectionStatusChange('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/collab`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.isDestroyed) {
          this.ws?.close();
          return;
        }

        this.options.onConnectionStatusChange('connected');

        // Join room and send peer profile
        this.ws?.send(JSON.stringify({
          type: 'join-room',
          roomId: this.options.roomId,
          initialContent: this.yText.toString() || this.options.initialContent,
          peer: {
            id: this.options.currentUser.id,
            name: this.options.currentUser.name,
            color: this.options.currentUser.color,
            avatarColor: this.options.currentUser.avatarColor,
            initials: this.options.currentUser.initials,
            line: 1,
            col: 0,
            status: 'active',
            activityMessage: 'Connected to Yjs CRDT room',
            fileId: this.options.fileId,
          },
        }));

        // Flush any offline queued updates
        if (this.offlineUpdateQueue.length > 0) {
          for (const queuedUpdate of this.offlineUpdateQueue) {
            this.ws?.send(JSON.stringify({
              type: 'yjs-update',
              roomId: this.options.roomId,
              update: queuedUpdate,
            }));
          }
          this.offlineUpdateQueue = [];
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'sync-init': {
              if (msg.update) {
                const updateBytes = this.base64ToUint8(msg.update);
                Y.applyUpdate(this.doc, updateBytes, 'init-sync');
              }
              if (msg.peers && Array.isArray(msg.peers)) {
                this.peersMap.clear();
                for (const peer of msg.peers) {
                  this.peersMap.set(peer.id, peer);
                }
                this.options.onPeersChange(Array.from(this.peersMap.values()));
              }
              break;
            }

            case 'yjs-update': {
              if (msg.update) {
                const updateBytes = this.base64ToUint8(msg.update);
                Y.applyUpdate(this.doc, updateBytes, 'remote-ws');
              }
              break;
            }

            case 'peer-joined': {
              if (msg.peer) {
                this.peersMap.set(msg.peer.id, msg.peer);
                this.options.onPeersChange(Array.from(this.peersMap.values()));
              }
              break;
            }

            case 'awareness-update': {
              if (msg.peer) {
                const existing = this.peersMap.get(msg.peer.id) || {
                  id: msg.peer.id,
                  name: msg.peer.name || 'Collaborator',
                  color: msg.peer.color || '#10b981',
                  avatarColor: msg.peer.avatarColor || '#059669',
                  initials: msg.peer.initials || 'CO',
                  line: 1,
                  col: 0,
                  status: 'active',
                  lastActive: Date.now(),
                };
                Object.assign(existing, msg.peer, { lastActive: Date.now() });
                this.peersMap.set(msg.peer.id, existing);
                this.options.onPeersChange(Array.from(this.peersMap.values()));
              }
              break;
            }

            case 'peer-left': {
              if (msg.peerId) {
                this.peersMap.delete(msg.peerId);
                this.options.onPeersChange(Array.from(this.peersMap.values()));
              }
              break;
            }
          }
        } catch (err) {
          console.error('Yjs client message processing error:', err);
        }
      };

      this.ws.onclose = () => {
        if (!this.isDestroyed) {
          this.options.onConnectionStatusChange('offline');
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        if (!this.isDestroyed) {
          this.options.onConnectionStatusChange('error');
        }
      };
    } catch (err) {
      this.options.onConnectionStatusChange('error');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isDestroyed) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  /**
   * Applies local text change into the CRDT Y.Text structure
   */
  public updateLocalContent(newText: string) {
    if (this.isApplyingRemote) return;

    const currentText = this.yText.toString();
    if (currentText === newText) return;

    this.doc.transact(() => {
      // Fast diff-and-replace algorithm to preserve minimal CRDT operations
      let commonPrefix = 0;
      const minLength = Math.min(currentText.length, newText.length);
      while (commonPrefix < minLength && currentText[commonPrefix] === newText[commonPrefix]) {
        commonPrefix++;
      }

      let commonSuffix = 0;
      while (
        commonSuffix < minLength - commonPrefix &&
        currentText[currentText.length - 1 - commonSuffix] === newText[newText.length - 1 - commonSuffix]
      ) {
        commonSuffix++;
      }

      const deleteLength = currentText.length - commonPrefix - commonSuffix;
      const insertText = newText.slice(commonPrefix, newText.length - commonSuffix);

      if (deleteLength > 0) {
        this.yText.delete(commonPrefix, deleteLength);
      }
      if (insertText.length > 0) {
        this.yText.insert(commonPrefix, insertText);
      }
    }, 'local-editor');
  }

  /**
   * Broadcasts local user cursor, selection, and typing status to all peers
   */
  public updateAwareness(cursor: {
    line: number;
    col: number;
    selectionEnd?: { line: number; col: number } | null;
    status?: 'active' | 'typing' | 'idle' | 'navigating' | 'selecting';
    activityMessage?: string;
  }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'awareness-update',
        roomId: this.options.roomId,
        peerUpdate: {
          id: this.options.currentUser.id,
          name: this.options.currentUser.name,
          color: this.options.currentUser.color,
          avatarColor: this.options.currentUser.avatarColor,
          initials: this.options.currentUser.initials,
          line: cursor.line,
          col: cursor.col,
          selectionEnd: cursor.selectionEnd,
          status: cursor.status || 'active',
          activityMessage: cursor.activityMessage,
          fileId: this.options.fileId,
        },
      }));
    }
  }

  /**
   * Disposes WebSocket, IndexedDB persistence, and Yjs Doc resources
   */
  public destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.indexeddbProvider) {
      this.indexeddbProvider.destroy();
      this.indexeddbProvider = null;
    }
    this.doc.destroy();
  }
}
