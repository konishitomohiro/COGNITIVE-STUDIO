import React from 'react';
import { X, BookOpen, Trash2, ArrowRight, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SavedNoteRecord } from '../lib/firebase';
import { LectureStudyData } from '../types';

interface SavedNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (noteData: LectureStudyData) => void;
}

export const SavedNotesModal: React.FC<SavedNotesModalProps> = ({
  isOpen,
  onClose,
  onSelectNote,
}) => {
  const { savedNotes, deleteNote, currentUser } = useAuth();

  if (!isOpen) return null;

  const handleDelete = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (window.confirm('この保存済みノートを削除してもよろしいですか？')) {
      try {
        await deleteNote(noteId);
      } catch (err) {
        alert('削除に失敗しました。');
      }
    }
  };

  const handleSelect = (note: SavedNoteRecord) => {
    onSelectNote(note.data);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-yellow-400" />
            <h2 className="font-black text-base uppercase tracking-wider">
              会員専用：マイノート履歴 ({savedNotes.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {!currentUser ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm font-bold text-neutral-600 font-mono">
                ノート履歴を表示するにはGoogleログインが必要です。
              </p>
            </div>
          ) : savedNotes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-neutral-300 rounded p-6 bg-neutral-50">
              <FileText className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-800 font-mono">
                まだ保存された講義ノートはありません。
              </p>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                PDFを変換した画面の「クラウドに保存」ボタンを押すと、ここに履歴が保存されます。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {savedNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleSelect(note)}
                  className="group bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-black text-sm text-black truncate group-hover:text-blue-700 transition-colors">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {new Date(note.createdAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="truncate max-w-[180px] bg-neutral-100 px-1.5 py-0.5 border border-neutral-300 text-[10px]">
                        {note.fileName || 'PDF'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDelete(e, note.id)}
                      title="ノートを削除"
                      className="p-2 border border-black hover:bg-red-100 text-neutral-700 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="px-3 py-1.5 bg-black text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1 group-hover:bg-blue-600 transition-colors">
                      <span>開く</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black p-3 bg-neutral-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border-2 border-black text-xs font-bold font-mono hover:bg-neutral-200 cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
