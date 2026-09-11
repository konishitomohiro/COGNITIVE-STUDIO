import React from 'react';
import { X, Sparkles, Lightbulb, Compass, HelpCircle, Check, BookOpen } from 'lucide-react';
import { KeyTerm, AbstractExplanation } from '../types';

interface AbstractTermModalProps {
  isOpen: boolean;
  term: KeyTerm | null;
  explanation: AbstractExplanation | null;
  isLoading: boolean;
  onClose: () => void;
  onAddAnnotation?: (termName: string, text: string) => void;
}

export const AbstractTermModal: React.FC<AbstractTermModalProps> = ({
  isOpen,
  term,
  explanation,
  isLoading,
  onClose,
  onAddAnnotation,
}) => {
  if (!isOpen || !term) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-yellow-400 text-black">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base uppercase font-mono tracking-tight">
                重要単語の具体例・平易化解説
              </h2>
              <p className="text-[10px] text-neutral-300 font-mono">
                抽象概念 &rarr; 日常レベルの具体例・超低抽象度変換
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Term Header */}
          <div className="p-3.5 bg-neutral-100 border-2 border-black font-mono">
            <div className="text-[11px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-black" />
              <span>対象の重要単語</span>
            </div>
            <div className="text-xl font-black text-black mt-0.5">
              {term.term}
            </div>
            <div className="text-xs text-neutral-700 mt-2 pt-2 border-t border-neutral-300 font-sans leading-relaxed">
              <span className="font-bold text-black font-mono">学術的定義: </span>
              {term.definition}
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center space-y-3 bg-amber-50/50 border-2 border-dashed border-amber-300 rounded p-6">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="font-black text-sm text-black font-mono">
                AIが「{term.term}」の具体例と低抽象度の解説を生成中...
              </div>
              <p className="text-xs text-neutral-500 font-mono">
                認知心理学のフレームワークで日常生活のイメージに変換しています
              </p>
            </div>
          ) : explanation ? (
            <div className="space-y-4">
              {/* Section 1: Low Abstraction Explanation */}
              <div className="p-4 bg-yellow-100/90 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs font-black font-mono text-black uppercase mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>1. 抽象度を下げた超平易な解説</span>
                </div>
                <p className="text-sm font-bold text-black leading-relaxed font-sans">
                  {explanation.lowAbstractionExplanation}
                </p>
              </div>

              {/* Section 2: Concrete Real-world Example */}
              <div className="p-4 bg-emerald-100/90 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs font-black font-mono text-emerald-950 uppercase mb-1.5 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>2. 身近な具体例・シチュエーション</span>
                </div>
                <p className="text-sm font-bold text-black leading-relaxed font-sans">
                  {explanation.concreteExample}
                </p>
              </div>

              {/* Section 3: Analogy */}
              {explanation.analogy && (
                <div className="p-3.5 bg-blue-50 border-2 border-black">
                  <div className="text-xs font-black font-mono text-blue-900 uppercase mb-1 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>3. 直感的な例え（メタファー）</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-neutral-900 font-sans leading-relaxed">
                    {explanation.analogy}
                  </p>
                </div>
              )}

              {/* Section 4: Why Important */}
              {explanation.whyImportant && (
                <div className="p-3.5 bg-neutral-50 border-2 border-black text-xs font-mono">
                  <span className="font-black text-black block mb-1">
                    💡 なぜこの概念を理解することが重要か:
                  </span>
                  <span className="text-neutral-700 font-sans font-medium leading-relaxed block">
                    {explanation.whyImportant}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-sm font-mono text-neutral-600 border-2 border-black bg-neutral-100">
              解説データを取得できませんでした。
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black p-3 bg-neutral-100 flex items-center justify-between gap-2">
          {explanation && onAddAnnotation && (
            <button
              onClick={() => {
                const noteText = `具体例: ${explanation.concreteExample}`;
                onAddAnnotation(term.term, noteText);
                onClose();
              }}
              className="px-3 py-2 bg-yellow-300 hover:bg-yellow-400 border-2 border-black text-xs font-black font-mono uppercase tracking-wider flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>ノートの補足注釈に追加</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 bg-white border-2 border-black text-xs font-bold font-mono hover:bg-neutral-200 cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
