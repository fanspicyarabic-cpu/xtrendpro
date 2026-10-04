import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  query, 
  orderBy, 
  serverTimestamp,
  Firestore
} from "firebase/firestore";
import { LandingPageData, AdminSettings } from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAz1AHssprR5V0fKJEnhew0riAqGMAf0WU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "fanspicyrabic.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fanspicyrabic",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "fanspicyrabic.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "200641266506",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:200641266506:web:808950902686dee4b737b3",
};

let app: any = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;

try {
  if (
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "AIzaSyDummyKeyForDevelopmentModeXTREN999"
  ) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseConfigured = true;
  } else {
    // Initialize dummy app for safety
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseConfigured = false;
  }
} catch (e) {
  console.warn("Firebase initialization warning (using local fallback if needed):", e);
}

export { app, db, isFirebaseConfigured };

// Fallback localStorage cache for offline/initial setup convenience
const LOCAL_STORAGE_KEY_PAGES = "xtren_cms_pages_local";
const LOCAL_STORAGE_KEY_SETTINGS = "xtren_cms_settings_local";

export const getLocalPages = (): LandingPageData[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PAGES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveLocalPages = (pages: LandingPageData[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY_PAGES, JSON.stringify(pages));
};

export const getLocalSettings = (): AdminSettings => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const saveLocalSettings = (settings: AdminSettings) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
};

// Unified Landing Page Services
export async function saveLandingPage(page: LandingPageData): Promise<LandingPageData> {
  const timestamp = new Date().toISOString();
  const pageWithTime: LandingPageData = {
    ...page,
    updatedAt: timestamp,
    createdAt: page.createdAt || timestamp,
    views: page.views || 0,
    clicks: page.clicks || 0,
  };

  // 1. Always update local storage for instant sync & UI responsiveness
  const localList = getLocalPages();
  const existingIdx = localList.findIndex((p) => p.slug === page.slug);
  if (existingIdx >= 0) {
    localList[existingIdx] = pageWithTime;
  } else {
    localList.unshift(pageWithTime);
  }
  saveLocalPages(localList);

  // 2. Try Firestore if configured
  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, "pages", page.slug);
      await setDoc(docRef, {
        ...pageWithTime,
        serverTimestamp: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error("Firestore save error:", err);
    }
  }

  return pageWithTime;
}

export async function fetchAllLandingPages(): Promise<LandingPageData[]> {
  if (db && isFirebaseConfigured) {
    try {
      const colRef = collection(db, "pages");
      const q = query(colRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list: LandingPageData[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as LandingPageData);
      });
      if (list.length > 0) {
        saveLocalPages(list);
        return list;
      }
    } catch (err) {
      console.warn("Firestore fetch error, falling back to local storage:", err);
    }
  }
  return getLocalPages();
}

export async function fetchLandingPageBySlug(slug: string): Promise<LandingPageData | null> {
  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, "pages", slug);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as LandingPageData;
      }
    } catch (err) {
      console.warn("Firestore fetch error for slug", slug, err);
    }
  }
  
  const localList = getLocalPages();
  const found = localList.find((p) => p.slug === slug);
  return found || null;
}

export async function deleteLandingPage(slug: string): Promise<boolean> {
  const localList = getLocalPages().filter((p) => p.slug !== slug);
  saveLocalPages(localList);

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, "pages", slug);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Firestore delete error:", err);
    }
  }
  return true;
}
