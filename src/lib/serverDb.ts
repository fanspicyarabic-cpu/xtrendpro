/**
 * Server Database Bridge - Delegating completely to Firebase Firestore
 */
import {
  getAllPagesFromFirebase,
  getFirebasePageBySlug,
  savePageToFirebase,
  deletePageFromFirebase,
  getFirebaseSettings,
  saveFirebaseSettings,
} from "./firebaseAdmin";
import { LandingPageData, AdminSettings } from "./types";

export async function getStoredPages(): Promise<LandingPageData[]> {
  return getAllPagesFromFirebase();
}

export async function getStoredPageBySlug(slug: string): Promise<LandingPageData | null> {
  return getFirebasePageBySlug(slug);
}

export async function saveStoredPage(page: LandingPageData): Promise<LandingPageData> {
  return savePageToFirebase(page);
}

export async function deleteStoredPage(slug: string): Promise<boolean> {
  return deletePageFromFirebase(slug);
}

export async function getStoredSettings(): Promise<AdminSettings> {
  return getFirebaseSettings();
}

export async function saveStoredSettings(settings: AdminSettings): Promise<AdminSettings> {
  return saveFirebaseSettings(settings);
}
