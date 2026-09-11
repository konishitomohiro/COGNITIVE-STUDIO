import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { LectureStudyData } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears to be offline.');
    }
    return false;
  }
}

// User Profile Sync
export async function syncUserProfile(user: User) {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '無名ユーザー',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export interface SavedNoteRecord {
  id: string;
  userId: string;
  title: string;
  fileName?: string;
  data: LectureStudyData;
  createdAt: string;
}

// Save Study Note to Firestore
export async function saveStudyNoteToCloud(
  user: User,
  data: LectureStudyData,
  fileName?: string
): Promise<string> {
  if (!user) throw new Error('ログインが必要です。');

  const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${user.uid}/saved_notes/${noteId}`;
  const noteRef = doc(db, 'users', user.uid, 'saved_notes', noteId);

  const payload = {
    id: noteId,
    userId: user.uid,
    title: data.title || '無題の講義ノート',
    fileName: fileName || '講義資料.pdf',
    core_points: data.core_points || [],
    key_terms: data.key_terms || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(noteRef, payload);
    return noteId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Fetch User's Saved Notes
export async function getUserSavedNotes(user: User): Promise<SavedNoteRecord[]> {
  if (!user) return [];

  const subColRef = collection(db, 'users', user.uid, 'saved_notes');
  const path = `users/${user.uid}/saved_notes`;

  try {
    const q = query(subColRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const notes: SavedNoteRecord[] = [];

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      notes.push({
        id: d.id || docSnap.id,
        userId: d.userId,
        title: d.title,
        fileName: d.fileName,
        data: {
          title: d.title,
          core_points: d.core_points || [],
          key_terms: d.key_terms || [],
        },
        createdAt: d.createdAt,
      });
    });

    return notes;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// Delete a Saved Note
export async function deleteSavedNoteFromCloud(user: User, noteId: string): Promise<void> {
  if (!user) throw new Error('ログインが必要です。');

  const noteRef = doc(db, 'users', user.uid, 'saved_notes', noteId);
  const path = `users/${user.uid}/saved_notes/${noteId}`;

  try {
    await deleteDoc(noteRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export { signInWithPopup, signOut };
