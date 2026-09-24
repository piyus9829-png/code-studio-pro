import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  FacebookAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot, 
  serverTimestamp,
  addDoc,
  deleteDoc
} from "firebase/firestore";
// Firebase configuration is read securely from environment variables (VITE_FIREBASE_*)
// to avoid exposing credentials or committing public API keys in JSON metadata files.
const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env || {} : {};
const procEnv = typeof process !== "undefined" ? process.env || {} : {};

export const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || procEnv.VITE_FIREBASE_API_KEY || "",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || procEnv.VITE_FIREBASE_AUTH_DOMAIN || "mystic-yolk-bcbh2.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || procEnv.VITE_FIREBASE_PROJECT_ID || "mystic-yolk-bcbh2",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || procEnv.VITE_FIREBASE_STORAGE_BUCKET || "mystic-yolk-bcbh2.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || procEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "251866514942",
  appId: metaEnv.VITE_FIREBASE_APP_ID || procEnv.VITE_FIREBASE_APP_ID || "1:251866514942:web:6bb9b7d2d3ed71f702acaf",
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || procEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-clouddevelopment-2c301c9e-7e7d-4d4c-b6df-3f21cfb35a0c",
  oAuthClientId: metaEnv.VITE_FIREBASE_OAUTH_CLIENT_ID || procEnv.VITE_FIREBASE_OAUTH_CLIENT_ID || "251866514942-lltgaann6vq1623t9nucc05b39al9v98.apps.googleusercontent.com"
};

// Safe initialization of Firebase App instance
const effectiveConfig = {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey || "mock-public-config-unconfigured"
};

const app = !getApps().length ? initializeApp(effectiveConfig) : getApp();

export const auth = getAuth(app);

// Firestore initialization with support for named or default database
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const ADMIN_EMAIL = "tarun98293@gmail.com";

export type SubscriptionPlan = "free" | "pro_monthly" | "pro_annual" | "lifetime_developer" | "enterprise";

export interface AppUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "admin" | "user";
  provider: "google" | "github" | "facebook" | "phone" | "whatsapp" | "email" | "anonymous" | "demo";
  phoneNumber?: string;
  status: "active" | "suspended" | "pending";
  createdAt: string;
  lastLogin: string;
  ipAddress?: string;
  projectsCount?: number;
  storageQuotaMb?: number;
  isPremium?: boolean;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionExpiresAt?: string;
  paymentMethod?: string;
  transactionId?: string;
}

export interface SecurityEventLog {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  eventType: "login_success" | "login_failed" | "role_change" | "security_alert" | "lockdown_triggered" | "suspicious_request" | "rate_limit_hit";
  ipAddress: string;
  threatLevel: "info" | "warning" | "critical";
  details: string;
  provider?: string;
  userAgent?: string;
}

export interface SystemProtectionConfig {
  maintenanceMode: boolean;
  emergencyLockdown: boolean;
  rateLimitPerMinute: number;
  allowedProviders: string[];
  autoBlockSuspiciousIps: boolean;
  maxExecutionThreads: number;
  updatedAt: string;
  updatedBy: string;
}

// Sanitize any data object to strictly exclude undefined values before Firestore operations
export function sanitizeFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (obj === null || obj === undefined) return {};
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      clean[key] = sanitizeFirestoreData(value);
    } else if (Array.isArray(value)) {
      clean[key] = value
        .filter((item) => item !== undefined)
        .map((item) =>
          item !== null && typeof item === "object" && !(item instanceof Date)
            ? sanitizeFirestoreData(item)
            : item
        );
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

// Providers with explicit OAuth scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/userinfo.email");
googleProvider.addScope("https://www.googleapis.com/auth/userinfo.profile");
googleProvider.setCustomParameters({ prompt: "select_account" });

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope("read:user");
githubProvider.addScope("user:email");

export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope("email");
facebookProvider.addScope("public_profile");

export async function syncUserProfile(
  user: FirebaseUser | { 
    uid: string; 
    email?: string | null; 
    displayName?: string | null; 
    photoURL?: string | null; 
    phoneNumber?: string | null; 
    isAnonymous?: boolean 
  }, 
  providerName?: string
): Promise<AppUserProfile> {
  const userRef = doc(db, "users", user.uid);
  const now = new Date().toISOString();
  const isAdmin = Boolean(user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  let profile: AppUserProfile;

  try {
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const existing = snap.data() as AppUserProfile;
      profile = {
        uid: user.uid,
        email: user.email || existing.email || "guest@cloudide.io",
        displayName: user.displayName || existing.displayName || (user.isAnonymous ? "Guest Developer" : "Cloud Developer"),
        photoURL: user.photoURL || existing.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        role: isAdmin ? "admin" : (existing.role || "user"),
        provider: (providerName || existing.provider || (user.isAnonymous ? "anonymous" : "google")) as any,
        status: existing.status || "active",
        createdAt: existing.createdAt || now,
        lastLogin: now,
        projectsCount: existing.projectsCount ?? 0,
        storageQuotaMb: isAdmin ? 10240 : (existing.storageQuotaMb ?? 512),
        isPremium: isAdmin ? true : Boolean(existing.isPremium),
        subscriptionPlan: isAdmin ? "lifetime_developer" : (existing.subscriptionPlan || "free"),
      };

      if (user.phoneNumber || existing.phoneNumber) {
        profile.phoneNumber = user.phoneNumber || existing.phoneNumber;
      }
      if (existing.subscriptionExpiresAt) {
        profile.subscriptionExpiresAt = existing.subscriptionExpiresAt;
      }
      if (existing.paymentMethod) {
        profile.paymentMethod = existing.paymentMethod;
      }
      if (existing.transactionId) {
        profile.transactionId = existing.transactionId;
      }

      const updatePayload: Record<string, any> = {
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        lastLogin: now,
        role: profile.role,
        provider: profile.provider,
        status: profile.status,
      };

      if (isAdmin) {
        updatePayload.isPremium = true;
        updatePayload.subscriptionPlan = "lifetime_developer";
      }

      if (profile.phoneNumber) {
        updatePayload.phoneNumber = profile.phoneNumber;
      }

      await updateDoc(userRef, sanitizeFirestoreData(updatePayload));
    } else {
      profile = {
        uid: user.uid,
        email: user.email || (user.isAnonymous ? `guest_${user.uid.slice(0, 6)}@cloudide.io` : "user@cloudide.io"),
        displayName: user.displayName || (user.isAnonymous ? "Guest Developer" : "Cloud Developer"),
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        role: isAdmin ? "admin" : "user",
        provider: (providerName || (user.isAnonymous ? "anonymous" : "google")) as any,
        status: "active",
        createdAt: now,
        lastLogin: now,
        projectsCount: 0,
        storageQuotaMb: isAdmin ? 10240 : 512,
        isPremium: isAdmin,
        subscriptionPlan: isAdmin ? "lifetime_developer" : "free",
      };

      if (user.phoneNumber) {
        profile.phoneNumber = user.phoneNumber;
      }

      await setDoc(userRef, sanitizeFirestoreData(profile));
    }
  } catch (err: any) {
    console.warn("Firestore sync warning (using fallback profile):", err);
    profile = {
      uid: user.uid,
      email: user.email || (user.isAnonymous ? `guest_${user.uid.slice(0, 6)}@cloudide.io` : "user@cloudide.io"),
      displayName: user.displayName || (user.isAnonymous ? "Guest Developer" : "Cloud Developer"),
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      role: isAdmin ? "admin" : "user",
      provider: (providerName || (user.isAnonymous ? "anonymous" : "google")) as any,
      status: "active",
      createdAt: now,
      lastLogin: now,
      projectsCount: 0,
      storageQuotaMb: isAdmin ? 10240 : 512,
      isPremium: isAdmin,
      subscriptionPlan: isAdmin ? "lifetime_developer" : "free",
    };
    if (user.phoneNumber) {
      profile.phoneNumber = user.phoneNumber;
    }
  }

  // Non-blocking security audit log
  try {
    await logSecurityAudit({
      eventType: "login_success",
      userId: profile.uid,
      userEmail: profile.email,
      threatLevel: "info",
      details: `User signed in via ${profile.provider.toUpperCase()} (Role: ${profile.role})`,
      provider: profile.provider,
    });
  } catch (e) {
    // Non-blocking log catch
  }

  return profile;
}

export async function logSecurityAudit(log: Omit<SecurityEventLog, "id" | "timestamp" | "ipAddress"> & { ipAddress?: string }) {
  try {
    const logsCol = collection(db, "security_logs");
    const payload: Record<string, any> = {
      eventType: log.eventType,
      threatLevel: log.threatLevel,
      details: log.details,
      timestamp: new Date().toISOString(),
      ipAddress: log.ipAddress || "127.0.0.1 (Internal Proxy)",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Server",
    };

    if (log.userId) payload.userId = log.userId;
    if (log.userEmail) payload.userEmail = log.userEmail;
    if (log.provider) payload.provider = log.provider;

    await addDoc(logsCol, sanitizeFirestoreData(payload));
  } catch (err) {
    console.warn("Security log audit skipped:", err);
  }
}

export async function upgradeUserSubscription(
  uid: string, 
  plan: SubscriptionPlan, 
  paymentMethod: string = "credit_card",
  transactionId?: string
): Promise<Partial<AppUserProfile>> {
  const userRef = doc(db, "users", uid);
  const now = new Date();
  
  let expiresAt: string | undefined = undefined;
  if (plan === "pro_monthly") {
    const d = new Date(now);
    d.setMonth(d.getMonth() + 1);
    expiresAt = d.toISOString();
  } else if (plan === "pro_annual") {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() + 1);
    expiresAt = d.toISOString();
  }

  const tx = transactionId || `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const updates: Record<string, any> = {
    isPremium: plan !== "free",
    subscriptionPlan: plan,
    paymentMethod,
    transactionId: tx,
    storageQuotaMb: plan === "lifetime_developer" ? 10240 : plan === "pro_annual" ? 4096 : plan === "pro_monthly" ? 2048 : 512,
  };

  if (expiresAt) {
    updates.subscriptionExpiresAt = expiresAt;
  }

  try {
    await updateDoc(userRef, sanitizeFirestoreData(updates));
  } catch (err) {
    console.warn("Firestore subscription write warning:", err);
  }

  await logSecurityAudit({
    eventType: "security_alert",
    userId: uid,
    threatLevel: "info",
    details: `Subscription activated: ${plan.toUpperCase()} via ${paymentMethod.toUpperCase()} (Tx: ${tx})`,
  });

  return updates;
}
