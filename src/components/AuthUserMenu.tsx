import React, { useState, useRef, useEffect } from "react";
import { 
  ShieldCheck, 
  Crown, 
  LogIn, 
  LogOut, 
  User, 
  ChevronDown, 
  Sparkles,
  Smartphone,
  Mail,
  Zap,
  CheckCircle2,
  Lock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AuthUserMenu: React.FC = () => {
  const { 
    user, 
    profile, 
    isAdmin, 
    isPremium,
    isAnonymous,
    loading, 
    setAuthModalOpen, 
    setProtectionCenterOpen, 
    openPremiumGate,
    signOutUser 
  } = useAuth();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="h-7 w-20 bg-slate-800 animate-pulse rounded-lg"></div>
    );
  }

  // Not signed in at all
  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => openPremiumGate('Pro Subscription')}
          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
          title="Upgrade to CloudIDE Studio Pro"
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Upgrade</span>
        </button>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
          title="Sign in with Google, GitHub, or other accounts"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </button>
      </div>
    );
  }

  const getProviderBadge = (provider?: string) => {
    switch (provider) {
      case "google":
        return <span className="text-[10px] text-blue-300 font-medium">Google OAuth</span>;
      case "github":
        return <span className="text-[10px] text-slate-300 font-medium">GitHub OAuth</span>;
      case "facebook":
        return <span className="text-[10px] text-indigo-300 font-medium">Facebook</span>;
      case "whatsapp":
      case "phone":
        return <span className="text-[10px] text-green-300 font-medium">WhatsApp / OTP</span>;
      case "anonymous":
        return <span className="text-[10px] text-amber-300 font-medium">Guest (Free)</span>;
      default:
        return <span className="text-[10px] text-purple-300 font-medium">Email Auth</span>;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-1.5">
        {/* If Not Premium (Free user or Guest), show Upgrade to Pro button */}
        {!isPremium && (
          <button
            onClick={() => openPremiumGate('Pro Subscription')}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Subscribe to CloudIDE Studio Pro to unlock AI, Collab & Cloud Workspaces"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Upgrade Pro</span>
          </button>
        )}

        {/* Protection Platform shortcut button for Master Admin */}
        {isAdmin && (
          <button
            onClick={() => setProtectionCenterOpen(true)}
            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Open Protection Platform & Admin Center"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Admin Shield</span>
          </button>
        )}

        {/* User Profile Pill Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition-colors cursor-pointer"
        >
          <img
            src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
            alt={user.displayName || "User"}
            className="w-5 h-5 rounded-full object-cover bg-slate-900"
          />
          <span className="text-xs font-medium max-w-[90px] truncate hidden sm:inline">
            {isAnonymous ? "Guest User" : (profile?.displayName || user.displayName || user.email?.split("@")[0] || "Developer")}
          </span>
          {isAdmin ? (
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : isPremium ? (
            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">FREE</span>
          )}
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-68 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* User Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <img
                src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                alt={user.displayName || "User"}
                className="w-8 h-8 rounded-full object-cover bg-slate-950 border border-indigo-500/40"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-white truncate">
                    {isAnonymous ? "Guest Session" : (profile?.displayName || user.displayName || "Cloud Developer")}
                  </p>
                </div>
                <div className="mt-0.5">
                  {isAdmin ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5 text-amber-400" /> MASTER ADMIN (LIFETIME)
                    </span>
                  ) : isPremium ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-emerald-400" /> PRO (ACTIVE)
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 inline-block">
                      FREE TIER (BASIC CODING)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-1">{user.email || "No email (Guest mode)"}</p>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Authentication:</span>
              <span>{getProviderBadge(profile?.provider || (isAnonymous ? "anonymous" : "email"))}</span>
            </div>

            {/* Feature Status */}
            <div className="mt-1.5 text-[11px] flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>{isPremium ? "All Premium Studio Tools Unlocked" : "Single-file coding & execution only"}</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {!isPremium && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  openPremiumGate('Pro Subscription');
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-bold text-amber-300 hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Upgrade to Studio Pro (Unlock All)</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setProtectionCenterOpen(true);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-amber-300 hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Protection Platform & Admin Center</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                setAuthModalOpen(true);
              }}
              className="w-full px-3.5 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-indigo-400" />
              <span>{isAnonymous ? "Sign in with Google / GitHub" : "Switch Account / Manage Logins"}</span>
            </button>
          </div>

          {/* Sign Out Button */}
          <div className="pt-1 mt-1 border-t border-slate-800">
            <button
              onClick={() => {
                setIsOpen(false);
                signOutUser();
              }}
              className="w-full px-3.5 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isAnonymous ? "End Guest Session" : "Sign Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
