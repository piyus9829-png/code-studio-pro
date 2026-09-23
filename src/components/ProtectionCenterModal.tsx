import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Activity, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Search, 
  Crown, 
  UserCheck, 
  UserX, 
  X, 
  Cpu, 
  Zap, 
  Database,
  Globe,
  Sliders,
  CheckCircle,
  Clock,
  Radio,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { 
  db, 
  AppUserProfile, 
  SecurityEventLog, 
  ADMIN_EMAIL, 
  logSecurityAudit 
} from "../lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDocs
} from "firebase/firestore";

export const ProtectionCenterModal: React.FC = () => {
  const { 
    isProtectionCenterOpen, 
    setProtectionCenterOpen, 
    isAdmin, 
    user, 
    protectionConfig, 
    updateProtectionConfig 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "security_logs" | "firewall">("overview");
  const [userList, setUserList] = useState<AppUserProfile[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityEventLog[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Real-time Firestore users listener
  useEffect(() => {
    if (!isProtectionCenterOpen) return;
    const usersCol = collection(db, "users");
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const users: AppUserProfile[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as AppUserProfile);
      });
      setUserList(users);
    }, (err) => {
      console.warn("User list snapshot note:", err);
    });

    return () => unsubscribe();
  }, [isProtectionCenterOpen]);

  // Real-time Firestore security logs listener
  useEffect(() => {
    if (!isProtectionCenterOpen) return;
    const logsCol = collection(db, "security_logs");
    const q = query(logsCol, orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: SecurityEventLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setSecurityLogs(logs);
    }, (err) => {
      console.warn("Security logs snapshot note:", err);
    });

    return () => unsubscribe();
  }, [isProtectionCenterOpen]);

  if (!isProtectionCenterOpen) return null;

  const handleToggleMaintenance = async () => {
    if (!isAdmin) return;
    setIsUpdating(true);
    try {
      await updateProtectionConfig({
        maintenanceMode: !protectionConfig?.maintenanceMode
      });
      setStatusMessage(`Maintenance Mode ${!protectionConfig?.maintenanceMode ? "ENABLED" : "DISABLED"}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleLockdown = async () => {
    if (!isAdmin) return;
    setIsUpdating(true);
    try {
      await updateProtectionConfig({
        emergencyLockdown: !protectionConfig?.emergencyLockdown
      });
      setStatusMessage(`Emergency Lockdown ${!protectionConfig?.emergencyLockdown ? "ACTIVATED" : "DEACTIVATED"}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRateLimitChange = async (limitVal: number) => {
    if (!isAdmin) return;
    try {
      await updateProtectionConfig({
        rateLimitPerMinute: limitVal
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleUserRole = async (targetUser: AppUserProfile) => {
    if (!isAdmin) return;
    if (targetUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      alert("The primary master admin (tarun98293@gmail.com) role cannot be changed.");
      return;
    }
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    try {
      await updateDoc(doc(db, "users", targetUser.uid), { role: newRole });
      await logSecurityAudit({
        eventType: "role_change",
        userId: targetUser.uid,
        userEmail: targetUser.email,
        threatLevel: "warning",
        details: `Role changed to ${newRole.toUpperCase()} by ${user?.email}`,
      });
    } catch (err: any) {
      alert("Failed to update user role: " + err.message);
    }
  };

  const handleToggleUserStatus = async (targetUser: AppUserProfile) => {
    if (!isAdmin) return;
    if (targetUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      alert("The primary master admin cannot be suspended.");
      return;
    }
    const newStatus = targetUser.status === "suspended" ? "active" : "suspended";
    try {
      await updateDoc(doc(db, "users", targetUser.uid), { status: newStatus });
      await logSecurityAudit({
        eventType: "security_alert",
        userId: targetUser.uid,
        userEmail: targetUser.email,
        threatLevel: newStatus === "suspended" ? "critical" : "info",
        details: `User status changed to ${newStatus.toUpperCase()} by ${user?.email}`,
      });
    } catch (err: any) {
      alert("Failed to update user status: " + err.message);
    }
  };

  const filteredUsers = userList.filter((u) => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.provider?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-5xl h-[85vh] bg-[#14141f] border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#181827] border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Protection Platform & Master Admin Center
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  TARUN98293 OWNER TIER
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Multi-Tenant Access Control, DDoS Mitigation, Cloud Firestore Auth & Runtime Defense
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {statusMessage && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                {statusMessage}
              </span>
            )}
            <button
              onClick={() => setProtectionCenterOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 bg-[#12121a] border-b border-gray-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Platform Health</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Governance ({userList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("firewall")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "firewall"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Protection Shields</span>
            </button>
            <button
              onClick={() => setActiveTab("security_logs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "security_logs"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Security Audit Trail ({securityLogs.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Firestore Live Stream</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0f0f17]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Top Quick Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#161626] border border-blue-500/20 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Protection Status</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-white flex items-center gap-2">
                    <span>Active Shield</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                  <p className="text-[11px] text-emerald-400/80 mt-1">DDoS & Sandbox Guard Active</p>
                </div>

                <div className="p-4 rounded-xl bg-[#161626] border border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Registered Accounts</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white">{userList.length}</div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {userList.filter(u => u.role === "admin").length} Admins • {userList.filter(u => u.status === "active").length} Active
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#161626] border border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Worker Threads</span>
                    <Cpu className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white">24 Semaphore</div>
                  <p className="text-[11px] text-purple-300 mt-1">Non-blocking VM Isolates</p>
                </div>

                <div className="p-4 rounded-xl bg-[#161626] border border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Rate Limit Ceiling</span>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white">
                    {protectionConfig?.rateLimitPerMinute || 240} <span className="text-xs font-normal text-gray-400">req/min</span>
                  </div>
                  <p className="text-[11px] text-amber-300 mt-1">DDoS Throttling Guard</p>
                </div>
              </div>

              {/* Master Control Switches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#161626] border border-gray-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        System Maintenance Mode
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        When enabled, non-admin visitors will see a maintenance notice while preserving IDE access for tarun98293@gmail.com.
                      </p>
                    </div>
                    <button
                      onClick={handleToggleMaintenance}
                      disabled={isUpdating}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        protectionConfig?.maintenanceMode
                          ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {protectionConfig?.maintenanceMode ? "ENABLED" : "DISABLED"}
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#161626] border border-gray-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        Emergency Runtime Lockdown
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Instantly freezes all active Node/Python/SQL code execution processes in case of abnormal resource spikes or zero-day threats.
                      </p>
                    </div>
                    <button
                      onClick={handleToggleLockdown}
                      disabled={isUpdating}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        protectionConfig?.emergencyLockdown
                          ? "bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {protectionConfig?.emergencyLockdown ? "LOCKED DOWN" : "OFF (NORMAL)"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Supported Identity Providers info */}
              <div className="p-5 rounded-2xl bg-[#161626] border border-gray-800">
                <h3 className="text-sm font-bold text-white mb-3">Multi-Provider Auth Matrix</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#11111d] border border-gray-800 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <div>
                      <div className="text-xs font-semibold text-white">Google OAuth</div>
                      <div className="text-[10px] text-gray-400">OpenID Connect</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#11111d] border border-gray-800 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <div>
                      <div className="text-xs font-semibold text-white">GitHub OAuth</div>
                      <div className="text-[10px] text-gray-400">Developer SSO</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#11111d] border border-gray-800 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <div>
                      <div className="text-xs font-semibold text-white">Facebook Login</div>
                      <div className="text-[10px] text-gray-400">Meta Social</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#11111d] border border-gray-800 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <div>
                      <div className="text-xs font-semibold text-white">WhatsApp & SMS</div>
                      <div className="text-[10px] text-gray-400">2FA OTP Shield</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER GOVERNANCE */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by email, name or provider..."
                    className="w-full pl-9 pr-4 py-2 bg-[#161626] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="text-xs text-gray-400">
                  Showing {filteredUsers.length} of {userList.length} accounts
                </div>
              </div>

              <div className="bg-[#161626] border border-gray-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#12121e] text-gray-400 border-b border-gray-800">
                      <tr>
                        <th className="py-3 px-4 font-semibold">User</th>
                        <th className="py-3 px-4 font-semibold">Auth Provider</th>
                        <th className="py-3 px-4 font-semibold">Role</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Last Active</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {filteredUsers.map((u) => {
                        const isMasterAdmin = u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                        return (
                          <tr key={u.uid} className="hover:bg-gray-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <img 
                                  src={u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`} 
                                  alt={u.displayName} 
                                  className="w-7 h-7 rounded-full bg-gray-700 object-cover"
                                />
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    <span>{u.displayName || "Anonymous User"}</span>
                                    {isMasterAdmin && (
                                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                                    )}
                                  </div>
                                  <div className="text-[11px] text-gray-400">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="capitalize px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 border border-gray-700 text-[11px]">
                                {u.provider || "google"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                u.role === "admin" 
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" 
                                  : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                              }`}>
                                {u.role?.toUpperCase() || "USER"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                u.status === "suspended"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              }`}>
                                {u.status || "active"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-[11px]">
                              {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Just now"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleToggleUserRole(u)}
                                  disabled={isMasterAdmin}
                                  title={isMasterAdmin ? "Master Admin cannot be modified" : "Toggle Admin/User Role"}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    isMasterAdmin 
                                      ? "opacity-40 cursor-not-allowed border-gray-800 text-gray-600" 
                                      : "border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                  }`}
                                >
                                  <Crown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  disabled={isMasterAdmin}
                                  title={isMasterAdmin ? "Master Admin cannot be suspended" : "Toggle Active/Suspended"}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    isMasterAdmin 
                                      ? "opacity-40 cursor-not-allowed border-gray-800 text-gray-600" 
                                      : u.status === "suspended"
                                        ? "border-emerald-700 text-emerald-400 hover:bg-emerald-950"
                                        : "border-red-700 text-red-400 hover:bg-red-950"
                                  }`}
                                >
                                  {u.status === "suspended" ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROTECTION SHIELDS */}
          {activeTab === "firewall" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#161626] border border-gray-800">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  API & Execution Rate Limiting
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Adjust maximum allowable request frequency per client IP per minute before automatic rate-throttling activates.
                </p>

                <div className="space-y-3 max-w-md">
                  <div className="flex items-center justify-between text-xs text-white">
                    <span>Threshold Limit:</span>
                    <span className="font-bold text-amber-400">{protectionConfig?.rateLimitPerMinute || 240} requests / min</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="600"
                    step="30"
                    value={protectionConfig?.rateLimitPerMinute || 240}
                    onChange={(e) => handleRateLimitChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>60 req/min (Strict)</span>
                    <span>240 req/min (Balanced)</span>
                    <span>600 req/min (High Concurrency)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#161626] border border-gray-800">
                  <h3 className="text-sm font-bold text-white mb-1">Sandboxed VM Isolation</h3>
                  <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                    Code execution takes place inside isolated child process instances with hardened timeouts (10,000ms max) and memory ceilings (256MB).
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Enforced at Container Kernel Layer
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#161626] border border-gray-800">
                  <h3 className="text-sm font-bold text-white mb-1">Firestore Role Security Rules</h3>
                  <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                    Database writes and admin privileges are locked by cryptographic token validation via firestore.rules deployed to mystic-yolk-bcbh2.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    firestore.rules v2 Deployed & Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY AUDIT TRAIL */}
          {activeTab === "security_logs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Live Real-Time Audit Log</h3>
                <span className="text-xs text-gray-400">Tracking {securityLogs.length} events</span>
              </div>

              <div className="bg-[#161626] border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800/60">
                {securityLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No security events logged yet. Active sessions are monitoring cleanly.
                  </div>
                ) : (
                  securityLogs.map((log) => (
                    <div key={log.id} className="p-3.5 hover:bg-gray-800/20 transition-colors flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 ${
                          log.threatLevel === "critical"
                            ? "bg-red-500/20 text-red-300 border border-red-500/40"
                            : log.threatLevel === "warning"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        }`}>
                          {log.threatLevel?.toUpperCase() || "INFO"}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-white">{log.details}</div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                            <span>User: {log.userEmail || "System"}</span>
                            <span>•</span>
                            <span>IP: {log.ipAddress}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-500 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
