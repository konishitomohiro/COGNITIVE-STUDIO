import React from 'react';
import { Brain, Info, LogIn, LogOut, BookOpen, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onOpenGuide: () => void;
  onOpenSavedNotes: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGuide, onOpenSavedNotes }) => {
  const { currentUser, signInWithGoogle, logout, savedNotes, loading } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      alert(err.message || 'ログインに失敗しました。');
    }
  };

  return (
    <header id="main-header" className="border-b-4 border-black bg-white sticky top-0 z-30 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-black text-black tracking-tighter uppercase">
                COGNITIVE STUDIO
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-neutral-600 font-mono tracking-tight">
              LECTURE PDF &rarr; MINIMAL STUDY NOTES
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            id="btn-open-guide"
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-black hover:bg-neutral-100 px-2.5 sm:px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <Info className="w-4 h-4 shrink-0" />
            <span className="uppercase tracking-wider hidden sm:inline">設計原理</span>
          </button>

          {!loading && (
            currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenSavedNotes}
                  className="inline-flex items-center gap-1.5 text-xs font-bold font-mono bg-yellow-300 text-black hover:bg-yellow-400 px-2.5 sm:px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span className="uppercase tracking-wider font-black">
                    マイノート <span className="ml-0.5 px-1.5 py-0.2 bg-black text-white text-[10px] rounded-full">{savedNotes.length}</span>
                  </span>
                </button>

                <div className="hidden md:flex items-center gap-2 pl-2 border-l-2 border-black">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'ユーザー'}
                      className="w-8 h-8 rounded-full border-2 border-black object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-neutral-200 border-2 border-black rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-black" />
                    </div>
                  )}
                  <span className="text-xs font-bold font-mono text-black max-w-[100px] truncate">
                    {currentUser.displayName || '会員'}
                  </span>
                </div>

                <button
                  onClick={logout}
                  title="ログアウト"
                  className="inline-flex items-center gap-1 text-xs font-bold font-mono text-neutral-700 hover:text-red-600 p-2 border-2 border-black hover:bg-red-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="inline-flex items-center gap-1.5 text-xs font-bold font-mono bg-black text-white hover:bg-neutral-800 px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span className="uppercase tracking-wider font-black">Googleログイン</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
