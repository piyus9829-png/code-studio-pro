import React, { useState, useRef, useEffect } from 'react';
import { CollaboratorUser } from '../types';
import { 
  Users, 
  UserPlus, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronDown, 
  Crosshair, 
  Radio,
  Check,
  Eye,
  EyeOff,
  Copy,
  Link,
  Zap,
  Globe,
  Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CollaborativePresenceBarProps {
  collaborators: CollaboratorUser[];
  isSessionPaused: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'offline' | 'error';
  activeRoomId?: string;
  currentUser?: { id: string; name: string; color: string; initials: string };
  onJoinRoom?: (roomId: string) => void;
  onTogglePause: () => void;
  onAddCollaborator: () => void;
  onResetCollaborators: () => void;
  onJumpToCollaborator: (line: number) => void;
  showCursors: boolean;
  onToggleShowCursors: () => void;
}

export const CollaborativePresenceBar: React.FC<CollaborativePresenceBarProps> = ({
  collaborators,
  isSessionPaused,
  connectionStatus = 'connected',
  activeRoomId = 'workspace_main',
  currentUser,
  onJoinRoom,
  onTogglePause,
  onAddCollaborator,
  onResetCollaborators,
  onJumpToCollaborator,
  showCursors,
  onToggleShowCursors,
}) => {
  const { requirePremium } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [roomInput, setRoomInput] = useState(activeRoomId);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRoomInput(activeRoomId);
  }, [activeRoomId]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEditingRoom(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const totalMembersCount = collaborators.length + 1; // including self

  const handleOpenCollabMenu = () => {
    requirePremium('Live Collaboration', () => {
      setIsOpen(prev => !prev);
    });
  };

  const handleCopyShareLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('collabRoom', activeRoomId);
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback copy text
      try {
        await navigator.clipboard.writeText(activeRoomId);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch {}
    }
  };

  const handleApplyRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInput.trim() && onJoinRoom) {
      onJoinRoom(roomInput.trim());
      setIsEditingRoom(false);
    }
  };

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {/* Collaboration Session Pill Button */}
      <button
        onClick={handleOpenCollabMenu}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer font-sans ${
          isOpen
            ? 'bg-indigo-950/90 border-indigo-500/70 text-indigo-200 ring-2 ring-indigo-500/30'
            : isSessionPaused
            ? 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800'
            : connectionStatus === 'connected'
            ? 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 text-slate-200'
            : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
        }`}
        title="Live Multi-User Collaborative Session (Yjs CRDT)"
      >
        {/* Live Pulse Indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {!isSessionPaused && connectionStatus === 'connected' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isSessionPaused
                  ? 'bg-amber-400'
                  : connectionStatus === 'connected'
                  ? 'bg-emerald-400'
                  : connectionStatus === 'connecting'
                  ? 'bg-sky-400 animate-pulse'
                  : 'bg-rose-400'
              }`}
            />
          </span>
          <span className="font-medium text-[11px] hidden md:inline flex items-center gap-1">
            <span>{isSessionPaused ? 'CRDT Paused' : 'Yjs Live'}</span>
          </span>
        </div>

        {/* Stacked User Avatar Circles */}
        <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
          {currentUser && (
            <div
              className="w-5 h-5 rounded-full border border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-1 ring-white/20"
              style={{ backgroundColor: currentUser.color }}
              title={`You (${currentUser.name})`}
            >
              {currentUser.initials}
            </div>
          )}
          {collaborators.slice(0, 3).map((user) => (
            <div
              key={user.id}
              className="w-5 h-5 rounded-full border border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow-sm transition-transform hover:scale-110"
              style={{ backgroundColor: user.color }}
              title={`${user.name} (Ln ${user.line}, Col ${user.col})`}
            >
              {user.initials}
            </div>
          ))}
          {collaborators.length > 3 && (
            <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-[9px] font-medium text-slate-300">
              +{collaborators.length - 3}
            </div>
          )}
        </div>

        <span className="text-[11px] font-mono text-slate-400">({totalMembersCount})</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-84 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden font-sans text-xs animate-fade-in divide-y divide-slate-800">
          {/* Popover Header */}
          <div className="p-3 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-slate-100 text-xs">Yjs CRDT Real-Time Session</h4>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    {connectionStatus === 'connected' ? 'Synced' : connectionStatus}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {isSessionPaused ? 'Real-time sync paused' : 'Conflict-free replicated data editing'}
                </p>
              </div>
            </div>

            {/* Quick Session Play/Pause */}
            <button
              onClick={onTogglePause}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                isSessionPaused
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={isSessionPaused ? 'Resume live sync' : 'Pause live sync'}
            >
              {isSessionPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
            </button>
          </div>

          {/* Room Link & Share Section */}
          <div className="p-2.5 bg-slate-950/40 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-400" />
                Active Room:
              </span>
              <button
                onClick={() => setIsEditingRoom(!isEditingRoom)}
                className="text-indigo-400 hover:text-indigo-300 text-[10px] underline cursor-pointer"
              >
                {isEditingRoom ? 'Cancel' : 'Change Room'}
              </button>
            </div>

            {isEditingRoom ? (
              <form onSubmit={handleApplyRoom} className="flex gap-1.5">
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="Enter room ID..."
                  className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs cursor-pointer"
                >
                  Join
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px]">
                <span className="text-slate-300 truncate max-w-[180px]">#{activeRoomId}</span>
                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-sans transition-colors cursor-pointer"
                  title="Copy shareable workspace room URL"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3 text-indigo-400" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Share Room'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Collaborators List */}
          <div className="p-2 space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
            {/* Self User */}
            {currentUser && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/20">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm shrink-0 ring-1 ring-indigo-400/50"
                    style={{ backgroundColor: currentUser.color }}
                  >
                    {currentUser.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-200 truncate">{currentUser.name}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">You</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Current active editor</p>
                  </div>
                </div>
              </div>
            )}

            {collaborators.length === 0 && (
              <div className="p-3 text-center text-slate-500 text-[11px] italic">
                No other peers in this room yet. Share the room link or invite a peer to start real-time co-editing!
              </div>
            )}

            {collaborators.map((user) => (
              <div
                key={user.id}
                className="group flex items-center justify-between p-2 rounded-lg bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/60 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm shrink-0 relative"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.initials}
                    {user.status === 'typing' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-200 truncate">{user.name}</span>
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider"
                        style={{
                          backgroundColor: `${user.color}20`,
                          color: user.color,
                        }}
                      >
                        Ln {user.line}:{user.col}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user.activityMessage || (user.status === 'typing' ? 'Typing via Yjs...' : 'Viewing code')}
                    </p>
                  </div>
                </div>

                {/* Jump to Cursor Button */}
                <button
                  onClick={() => {
                    onJumpToCollaborator(user.line);
                    setIsOpen(false);
                  }}
                  className="shrink-0 p-1.5 rounded-md hover:bg-indigo-600 text-slate-400 hover:text-white transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                  title={`Jump to ${user.name}'s cursor (Line ${user.line})`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Session Footer Controls */}
          <div className="p-2.5 bg-slate-950/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleShowCursors}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                title="Toggle visibility of remote user cursor carets & badges"
              >
                {showCursors ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                <span>{showCursors ? 'Cursors' : 'Hidden'}</span>
              </button>

              <button
                onClick={onResetCollaborators}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                title="Reset session peers"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={onAddCollaborator}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors cursor-pointer shadow-sm"
              title="Add peer session simulator"
            >
              <UserPlus className="w-3 h-3" />
              <span>Simulate Peer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
