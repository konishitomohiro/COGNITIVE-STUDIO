import React, { useEffect, useState } from 'react';
import { Loader2, Brain, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProcessingStateProps {
  filename?: string;
}

const TIPS = [
  '認知負荷理論：カード枠や多色は脳のワーキングメモリを圧迫します。',
  '二重符号化：テキスト読解後、手書きで矢印や概念図を描くと記憶保持率が高まります。',
  'アクティブリコール：答えを一度思い出す（想起する）ことで脳の神経結合が強化されます。',
  'マーカー効果：あらかじめ印刷されたカラーより、自分の手で引いたマーカーの方が注目度が高まります。',
];

export const ProcessingState: React.FC<ProcessingStateProps> = ({ filename }) => {
  const [step, setStep] = useState(1);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 1200);
    const timer2 = setTimeout(() => setStep(3), 3200);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearInterval(tipInterval);
    };
  }, []);

  return (
    <div id="processing-state-container" className="max-w-md mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 bg-black text-white border-2 border-black flex items-center justify-center mx-auto mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
        <Brain className="w-8 h-8 text-white animate-pulse" />
      </div>

      <span className="inline-block px-3 py-1 bg-black text-white font-mono text-[10px] font-black uppercase tracking-widest border border-black mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        [PROCESSING]
      </span>
      <h3 className="text-xl font-black uppercase tracking-tight text-black mb-1">
        講義資料を分析・最適化中
      </h3>
      {filename && (
        <p className="text-xs font-mono font-bold text-neutral-600 mb-6 truncate max-w-xs mx-auto border-b border-black pb-1">
          FILE: {filename}
        </p>
      )}

      {/* Progress Steps */}
      <div className="bg-white border-2 border-black p-5 mb-6 text-left space-y-3 text-xs shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className={`flex items-center gap-2.5 font-bold ${step >= 1 ? 'text-black' : 'text-neutral-400'}`}>
          {step > 1 ? (
            <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 text-black animate-spin shrink-0" />
          )}
          <span className="font-mono">01. PDFテキスト解析・構文抽出</span>
        </div>

        <div className={`flex items-center gap-2.5 font-bold ${step >= 2 ? 'text-black' : 'text-neutral-400'}`}>
          {step > 2 ? (
            <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          ) : step === 2 ? (
            <Loader2 className="w-4 h-4 text-black animate-spin shrink-0" />
          ) : (
            <div className="w-4 h-4 border-2 border-neutral-300 shrink-0" />
          )}
          <span className="font-mono">02. GEMINI AI 認知構造化（要約・単語集）</span>
        </div>

        <div className={`flex items-center gap-2.5 font-bold ${step >= 3 ? 'text-black' : 'text-neutral-400'}`}>
          {step === 3 ? (
            <Loader2 className="w-4 h-4 text-black animate-spin shrink-0" />
          ) : (
            <div className="w-4 h-4 border-2 border-neutral-300 shrink-0" />
          )}
          <span className="font-mono">03. 広余白・完全モノクロレイアウト生成（数分かかることがあります）</span>
        </div>
      </div>

      {/* Cognitive Tip Box */}
      <div className="bg-white border-2 border-black p-4 text-xs text-black text-left flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Sparkles className="w-5 h-5 text-black shrink-0 mt-0.5" />
        <div>
          <span className="font-mono font-black uppercase tracking-wider block mb-1 bg-black text-white px-2 py-0.5 text-[10px] w-fit">
            COGNITIVE TIP
          </span>
          <p className="font-medium text-neutral-800 leading-relaxed">{TIPS[tipIndex]}</p>
        </div>
      </div>
    </div>
  );
};
