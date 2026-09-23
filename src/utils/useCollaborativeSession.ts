import { useState, useEffect, useRef, useCallback } from 'react';
import { CollaboratorUser } from '../types';
import { YjsCollabClient } from './crdtCollab';

interface UseCollaborativeSessionProps {
  content: string;
  fileId: string;
  enabled?: boolean;
  roomId?: string;
  onRemoteContentChange?: (newContent: string) => void;
  currentCursor?: { line: number; col: number; selectionEnd?: { line: number; col: number } | null };
}

const DEFAULT_USER_COLORS = [
  { color: '#10b981', avatarColor: '#059669' }, // Emerald
  { color: '#f59e0b', avatarColor: '#d97706' }, // Amber
  { color: '#8b5cf6', avatarColor: '#7c3aed' }, // Violet
  { color: '#ec4899', avatarColor: '#db2777' }, // Pink
  { color: '#06b6d4', avatarColor: '#0891b2' }, // Cyan
  { color: '#3b82f6', avatarColor: '#2563eb' }, // Blue
];

/**
 * Returns or generates a persistent local client ID and avatar for Yjs sessions
 */
function getLocalCollabUser() {
  try {
    const stored = localStorage.getItem('cloudide_collab_user');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}

  const randomIdx = Math.floor(Math.random() * DEFAULT_USER_COLORS.length);
  const colorPair = DEFAULT_USER_COLORS[randomIdx];
  const userNum = Math.floor(Math.random() * 900 + 100);
  const newUser = {
    id: `peer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: `Dev ${userNum}`,
    color: colorPair.color,
    avatarColor: colorPair.avatarColor,
    initials: `D${userNum.toString().slice(0, 1)}`,
  };

  try {
    localStorage.setItem('cloudide_collab_user', JSON.stringify(newUser));
  } catch {}

  return newUser;
}

export function useCollaborativeSession({
  content,
  fileId,
  enabled = true,
  roomId: propRoomId,
  onRemoteContentChange,
  currentCursor,
}: UseCollaborativeSessionProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorUser[]>([]);
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline' | 'error'>('connecting');
  const [activeRoomId, setActiveRoomId] = useState<string>(() => {
    // Check URL params for room
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('collabRoom');
      if (urlRoom) return urlRoom;
    } catch {}
    return propRoomId || `collab_room_${fileId || 'main'}`;
  });

  const [sessionStartTime] = useState(() => Date.now());
  const yjsClientRef = useRef<YjsCollabClient | null>(null);
  const currentUser = useRef(getLocalCollabUser()).current;

  // Initialize and manage Yjs Client instance
  useEffect(() => {
    if (!enabled || !fileId) {
      if (yjsClientRef.current) {
        yjsClientRef.current.destroy();
        yjsClientRef.current = null;
      }
      return;
    }

    const client = new YjsCollabClient({
      roomId: activeRoomId,
      fileId,
      initialContent: content,
      currentUser,
      onRemoteContentChange: (newContent) => {
        if (!isSessionPaused && onRemoteContentChange) {
          onRemoteContentChange(newContent);
        }
      },
      onPeersChange: (peers) => {
        setCollaborators(peers);
      },
      onConnectionStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });

    yjsClientRef.current = client;

    return () => {
      client.destroy();
      yjsClientRef.current = null;
    };
  }, [activeRoomId, fileId, enabled]);

  // Sync local text updates into Yjs CRDT structure
  useEffect(() => {
    if (yjsClientRef.current && !isSessionPaused) {
      yjsClientRef.current.updateLocalContent(content);
    }
  }, [content, isSessionPaused]);

  // Broadcast cursor awareness updates when user moves cursor or selects text
  useEffect(() => {
    if (yjsClientRef.current && currentCursor && !isSessionPaused) {
      yjsClientRef.current.updateAwareness({
        line: currentCursor.line,
        col: currentCursor.col,
        selectionEnd: currentCursor.selectionEnd,
        status: 'active',
        activityMessage: 'Editing via Yjs CRDT',
      });
    }
  }, [currentCursor?.line, currentCursor?.col, currentCursor?.selectionEnd, isSessionPaused]);

  // Change or join a new collaborative room
  const joinRoom = useCallback((newRoomId: string) => {
    if (!newRoomId || newRoomId === activeRoomId) return;
    setActiveRoomId(newRoomId);

    // Update URL query parameter without page reload
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('collabRoom', newRoomId);
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [activeRoomId]);

  // Toggle Session Pause/Resume
  const toggleSessionPause = useCallback(() => {
    setIsSessionPaused((prev) => !prev);
  }, []);

  // Add extra peer for local testing/demo
  const addCollaborator = useCallback(() => {
    const userNum = Math.floor(Math.random() * 800 + 100);
    const colorPair = DEFAULT_USER_COLORS[Math.floor(Math.random() * DEFAULT_USER_COLORS.length)];
    const mockPeer: CollaboratorUser = {
      id: `sim_peer_${Date.now()}`,
      name: `Colleague ${userNum}`,
      color: colorPair.color,
      avatarColor: colorPair.avatarColor,
      initials: `C${userNum.toString().slice(0, 1)}`,
      line: Math.max(1, Math.floor(Math.random() * 10) + 1),
      col: Math.floor(Math.random() * 20),
      status: 'typing',
      activityMessage: 'Real-time CRDT sync',
      lastActive: Date.now(),
    };
    setCollaborators((prev) => [...prev, mockPeer]);
  }, []);

  const removeCollaborator = useCallback((id: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const resetCollaborators = useCallback(() => {
    setCollaborators([]);
    setIsSessionPaused(false);
  }, []);

  return {
    collaborators,
    isSessionPaused,
    connectionStatus,
    activeRoomId,
    currentUser,
    sessionStartTime,
    joinRoom,
    toggleSessionPause,
    addCollaborator,
    removeCollaborator,
    resetCollaborators,
  };
}
