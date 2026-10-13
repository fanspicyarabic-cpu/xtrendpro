import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  Firestore
} from "firebase/firestore";
import { LandingPageData, AdminSettings } from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDAHFw2pKa9vrz3wuwdw7JiYFq92592uqM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "xtren-hub-2026.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "xtren-hub-2026",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "xtren-hub-2026.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "484480782636",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:484480782636:web:15e117b334a79469e2dc89",
};

let app: any = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const dbId = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID || "default";
  db = getFirestore(app, dbId);
  isFirebaseConfigured = true;
} catch (e) {
  console.warn("Firebase initialization warning:", e);
}

export { app, db, isFirebaseConfigured };

// Fallback localStorage cache for offline assistance only
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

// Unified Landing Page Services (Client SDK)
export async function saveLandingPage(page: LandingPageData): Promise<LandingPageData> {
  const timestamp = new Date().toISOString();
  const pageWithTime: LandingPageData = {
    ...page,
    updatedAt: timestamp,
    createdAt: page.createdAt || timestamp,
    views: typeof page.views === "number" ? page.views : 0,
    clicks: typeof page.clicks === "number" ? page.clicks : 0,
  };

  // 1. Direct Firestore write
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

  // 2. Cache in localStorage
  const localList = getLocalPages();
  const existingIdx = localList.findIndex((p) => p.slug === page.slug);
  if (existingIdx >= 0) {
    localList[existingIdx] = pageWithTime;
  } else {
    localList.unshift(pageWithTime);
  }
  saveLocalPages(localList);

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
      console.warn("Firestore fetch error, falling back to local cache:", err);
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
  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, "pages", slug);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Firestore delete error:", err);
    }
  }

  const localList = getLocalPages().filter((p) => p.slug !== slug);
  saveLocalPages(localList);

  return true;
}

export async function fetchAdminSettings(): Promise<AdminSettings> {
  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, "settings", "general");
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as AdminSettings;
        saveLocalSettings(data);
        return data;
      }
    } catch (err) {
      console.warn("Firestore settings fetch error:", err);
    }
  }
  return getLocalSettings();
}

export async function saveAdminSettings(settings: AdminSettings): Promise<AdminSettings> {
  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, "settings", "general");
      await setDoc(docRef, {
        ...settings,
        serverTimestamp: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error("Firestore settings save error:", err);
    }
  }
  saveLocalSettings(settings);
  return settings;
}
