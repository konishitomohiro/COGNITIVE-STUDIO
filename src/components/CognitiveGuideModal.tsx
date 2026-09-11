import React from 'react';
import { X, CheckCircle2, ShieldCheck, Sparkles, BookOpen, PenTool } from 'lucide-react';

interface CognitiveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CognitiveGuideModal: React.FC<CognitiveGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="cognitive-guide-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <div className="flex items-start justify-between border-b-4 border-black pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-mono text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">
                DESIGN PRINCIPLES
              </span>
              <h2 className="text-xl font-black uppercase text-black tracking-tight mt-1">
                認知心理学に基づくPDF最適化の原則
              </h2>
            </div>
          </div>
          <button
            id="btn-close-guide"
            onClick={onClose}
            className="text-black hover:bg-black hover:text-white border-2 border-black p-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-sm text-black leading-relaxed">
          <section className="space-y-2 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <h3 className="font-black text-black text-base uppercase tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 bg-black text-white font-mono text-xs flex items-center justify-center font-black">01</span>
              認知負荷理論 (Cognitive Load Theory)
            </h3>
            <p className="text-xs font-medium text-neutral-800 leading-relaxed">
              枠線、カラフルなカードデザイン、過度な背景色は「外在性認知負荷（不要なノイズ）」となり、脳のワーキングメモリを圧迫します。本ツールはカード枠や色分けを排除し、知識そのものに集中できる純黒・純白レイアウトを採用しています。
            </p>
          </section>

          <section className="space-y-2 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <h3 className="font-black text-black text-base uppercase tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 bg-black text-white font-mono text-xs flex items-center justify-center font-black">02</span>
              タブレット・Goodnotesマーキング戦略
            </h3>
            <p className="text-xs font-medium text-neutral-800 leading-relaxed">
              あらかじめ色が付いた教材よりも、<strong>「白黒の見出しに自分の手でマーカーを引く」</strong>行為の方が能動的な注意（Active Attention）を引き出します。GoodnotesやNotabilityに取り込んだ際、手動マーキングしやすいシンプル構造にしています。
            </p>
          </section>

          <section className="space-y-2 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <h3 className="font-black text-black text-base uppercase tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 bg-black text-white font-mono text-xs flex items-center justify-center font-black">03</span>
              広いマージン（上下25mm・左右20mm）
            </h3>
            <p className="text-xs font-medium text-neutral-800 leading-relaxed">
              思考の整理には「書き込み余白」が不可欠です。広い余白は、講義中の補足メモ、関連用語との矢印リンク、自分の疑問点を書き込む認知スペースとして機能します。
            </p>
          </section>

          <div className="bg-neutral-100 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs text-black font-mono">
            <div className="font-black uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-black" />
              おすすめの学習手順 (WORKFLOW)
            </div>
            <ol className="list-decimal list-inside space-y-1.5 font-medium text-neutral-900">
              <li>変換されたPDFをダウンロードし、iPad（Goodnotes等）または印刷用紙に用意する</li>
              <li>「1. 核心要約」の見出しに自分のマーカーを引きながら通読する</li>
              <li>「2. 重要単語集」で単語の定義を手書き補足メモと照合する</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t-2 border-black flex justify-end">
          <button
            id="btn-close-modal-bottom"
            onClick={onClose}
            className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase font-mono border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
          >
            理解しました (CONFIRM)
          </button>
        </div>
      </div>
    </div>
  );
};
