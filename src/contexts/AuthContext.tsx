import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  syncUserProfile,
  getUserSavedNotes,
  saveStudyNoteToCloud,
  deleteSavedNoteFromCloud,
  SavedNoteRecord,
  testFirestoreConnection,
} from '../lib/firebase';
import { LectureStudyData } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  savedNotes: SavedNoteRecord[];
  refreshSavedNotes: () => Promise<void>;
  saveNote: (data: LectureStudyData, fileName?: string) => Promise<string>;
  deleteNote: (noteId: string) => Promise<void>;
  isSaving: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedNotes, setSavedNotes] = useState<SavedNoteRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user);
        try {
          const notes = await getUserSavedNotes(user);
          setSavedNotes(notes);
        } catch (err) {
          console.error('Failed to load user saved notes:', err);
        }
      } else {
        setSavedNotes([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
        const notes = await getUserSavedNotes(result.user);
        setSavedNotes(notes);
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      throw new Error('Googleログインに失敗しました。ポップアップがブロックされていないかご確認ください。');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setSavedNotes([]);
    } catch (err) {
      console.error('Logout Error:', err);
    }
  };

  const refreshSavedNotes = async () => {
    if (!currentUser) return;
    try {
      const notes = await getUserSavedNotes(currentUser);
      setSavedNotes(notes);
    } catch (err) {
      console.error('Failed to refresh saved notes:', err);
    }
  };

  const saveNote = async (data: LectureStudyData, fileName?: string): Promise<string> => {
    if (!currentUser) throw new Error('ノートをクラウドに保存するにはログインが必要です。');
    setIsSaving(true);
    try {
      const noteId = await saveStudyNoteToCloud(currentUser, data, fileName);
      await refreshSavedNotes();
      return noteId;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!currentUser) return;
    try {
      await deleteSavedNoteFromCloud(currentUser, noteId);
      await refreshSavedNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signInWithGoogle,
        logout,
        savedNotes,
        refreshSavedNotes,
        saveNote,
        deleteNote,
        isSaving,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
