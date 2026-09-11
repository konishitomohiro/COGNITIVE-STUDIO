import React, { useState, useRef, useEffect } from 'react';
import { LectureStudyData, DifficultTerm, KeyTerm, AbstractExplanation } from '../types';
import { downloadPdfFile } from '../lib/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { AbstractTermModal } from './AbstractTermModal';
import {
  Download,
  Eye,
  RotateCcw,
  Loader2,
  Sparkles,
  CheckCircle2,
  X,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Cloud,
  Check,
  Lightbulb
} from 'lucide-react';

interface PdfViewerAndEditorProps {
  initialData: LectureStudyData;
  onReset: () => void;
}

export const PdfViewerAndEditor: React.FC<PdfViewerAndEditorProps> = ({
  initialData,
  onReset,
}) => {
  const [data, setData] = useState<LectureStudyData>(initialData);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { currentUser, saveNote, signInWithGoogle, isSaving } = useAuth();
  
  // State for background analysis of difficult terms
  const [isAnalyzingTerms, setIsAnalyzingTerms] = useState(true);
  const [difficultTerms, setDifficultTerms] = useState<DifficultTerm[]>([]);
  const [selectedDifficultTerm, setSelectedDifficultTerm] = useState<DifficultTerm | null>(null);

  // State for abstract term modal
  const [selectedAbstractKeyTerm, setSelectedAbstractKeyTerm] = useState<KeyTerm | null>(null);
  const [currentAbstractExplanation, setCurrentAbstractExplanation] = useState<AbstractExplanation | null>(null);
  const [isAbstractLoading, setIsAbstractLoading] = useState(false);
  const [isAbstractModalOpen, setIsAbstractModalOpen] = useState(false);

  const printableContainerRef = useRef<HTMLDivElement>(null);

  // Background analysis trigger on mount or data change
  useEffect(() => {
    let isMounted = true;
    const analyzeTerms = async () => {
      if (!initialData || !initialData.key_terms || initialData.key_terms.length === 0) {
        setIsAnalyzingTerms(false);
        return;
      }

      setIsAnalyzingTerms(true);
      try {
        const response = await fetch('/api/analyze-difficult-terms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyTerms: initialData.key_terms }),
        });

        if (!response.ok) {
          throw new Error('解析APIエラー');
        }

        const result = await response.json();
        if (isMounted && result.success) {
          setDifficultTerms(result.analyses || []);
        }
      } catch (err) {
        console.warn('バックグラウンド難解用語解析中にエラー:', err);
      } finally {
        if (isMounted) {
          setIsAnalyzingTerms(false);
        }
      }
    };

    analyzeTerms();

    return () => {
      isMounted = false;
    };
  }, [initialData]);

  const handleOpenAbstractExplanation = async (kt: KeyTerm) => {
    setSelectedAbstractKeyTerm(kt);
    setIsAbstractModalOpen(true);

    if (kt.abstractExplanation) {
      setCurrentAbstractExplanation(kt.abstractExplanation);
      setIsAbstractLoading(false);
      return;
    }

    setCurrentAbstractExplanation(null);
    setIsAbstractLoading(true);

    try {
      const res = await fetch('/api/explain-abstract-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: kt.term,
          definition: kt.definition,
          contextTitle: data.title,
        }),
      });

      if (!res.ok) {
        throw new Error('抽象単語解説の生成に失敗しました');
      }

      const result = await res.json();
      if (result.success && result.explanation) {
        setCurrentAbstractExplanation(result.explanation);

        // Update local state to cache the generated explanation
        setData((prev) => ({
          ...prev,
          key_terms: prev.key_terms.map((item) =>
            item.term === kt.term
              ? { ...item, isAbstract: true, abstractExplanation: result.explanation }
              : item
          ),
        }));
      }
    } catch (err) {
      console.error('Failed to fetch abstract term explanation:', err);
    } finally {
      setIsAbstractLoading(false);
    }
  };

  const handleAddAnnotationFromAbstract = (termName: string, text: string) => {
    setData((prevData) => {
      const newKeyTerms = prevData.key_terms.map((kt) => {
        if (kt.term === termName) {
          const currentAnnotations = kt.annotations || [];
          const exists = currentAnnotations.some((ann) => ann.explanation === text);
          if (!exists) {
            return {
              ...kt,
              annotations: [
                ...currentAnnotations,
                {
                  id: `ann-${Date.now()}`,
                  word: '具体例・解説',
                  explanation: text,
                },
              ],
            };
          }
        }
        return kt;
      });

      return {
        ...prevData,
        key_terms: newKeyTerms,
      };
    });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadPdfFile(data, printableContainerRef.current || undefined);
    } catch (e) {
      console.error('Download error:', e);
      alert('PDFの生成中にエラーが発生しました。印刷画面を開きます。');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToCloud = async () => {
    try {
      if (!currentUser) {
        if (window.confirm('クラウド保存にはGoogleログインが必要です。ログイン画面を開きますか？')) {
          await signInWithGoogle();
        } else {
          return;
        }
      }
      await saveNote(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save to cloud error:', err);
      alert(err.message || 'クラウド保存に失敗しました。');
    }
  };

  const handleReplaceWithSimplified = (termToReplace: DifficultTerm) => {
    if (!termToReplace.suggestedReplacement) return;

    setData((prevData) => {
      const newKeyTerms = [...prevData.key_terms];
      const targetIdx = termToReplace.termIndex;
      if (newKeyTerms[targetIdx]) {
        const oldDef = newKeyTerms[targetIdx].definition;
        const newDef = oldDef.replace(
          termToReplace.difficultWord,
          termToReplace.suggestedReplacement
        );
        newKeyTerms[targetIdx] = {
          ...newKeyTerms[targetIdx],
          definition: newDef,
        };
      }
      return {
        ...prevData,
        key_terms: newKeyTerms,
      };
    });

    setDifficultTerms((prev) => prev.filter((dt) => dt.id !== termToReplace.id));
    setSelectedDifficultTerm(null);
  };

  const handleAddFootnote = (termToAnnotate: DifficultTerm) => {
    setData((prevData) => {
      const newKeyTerms = [...prevData.key_terms];
      const targetIdx = termToAnnotate.termIndex;
      if (newKeyTerms[targetIdx]) {
        const currentAnnotations = newKeyTerms[targetIdx].annotations || [];
        const exists = currentAnnotations.some(
          (ann) => ann.word === termToAnnotate.difficultWord
        );
        if (!exists) {
          const newAnnotations = [
            ...currentAnnotations,
            {
              id: termToAnnotate.id,
              word: termToAnnotate.difficultWord,
              explanation: termToAnnotate.simplifiedExplanation,
            },
          ];
          newKeyTerms[targetIdx] = {
            ...newKeyTerms[targetIdx],
            annotations: newAnnotations,
          };
        }
      }
      return {
        ...prevData,
        key_terms: newKeyTerms,
      };
    });

    setDifficultTerms((prev) => prev.filter((dt) => dt.id !== termToAnnotate.id));
    setSelectedDifficultTerm(null);
  };

  const renderDefinitionWithHighlights = (definition: string, termIndex: number) => {
    const matchingTerms = difficultTerms.filter(
      (dt) => dt.termIndex === termIndex && dt.difficultWord && definition.includes(dt.difficultWord)
    );

    if (matchingTerms.length === 0) {
      return <span>{definition}</span>;
    }

    const sortedTerms = [...matchingTerms].sort(
      (a, b) => definition.indexOf(a.difficultWord) - definition.indexOf(b.difficultWord)
    );

    const parts: React.ReactNode[] = [];
    let lastIdx = 0;

    sortedTerms.forEach((dt, idx) => {
      const termIdx = definition.indexOf(dt.difficultWord, lastIdx);
      if (termIdx !== -1) {
        if (termIdx > lastIdx) {
          parts.push(definition.substring(lastIdx, termIdx));
        }

        parts.push(
          <span
            key={`diff-${dt.id}-${idx}`}
            data-difficult-highlight="true"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDifficultTerm(dt);
            }}
            title="クリックして平易な解説を表示"
            style={{
              borderBottom: '2px dashed #000000',
              backgroundColor: '#fef08a',
              cursor: 'pointer',
              padding: '0 3px',
              margin: '0 1px',
              borderRadius: '2px',
              fontWeight: '600',
              color: '#000000',
            }}
            className="hover:bg-yellow-300 transition-colors inline-block difficult-term-highlight"
          >
            {dt.difficultWord}
          </span>
        );

        lastIdx = termIdx + dt.difficultWord.length;
      }
    });

    if (lastIdx < definition.length) {
      parts.push(definition.substring(lastIdx));
    }

    return <span>{parts}</span>;
  };

  return (
    <div id="pdf-editor-container" className="max-w-5xl mx-auto py-6 px-4">
      {/* Top Bar with Status and Actions */}
      <div className="bg-white border-2 border-black p-4 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-black font-mono uppercase tracking-wider bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Eye className="w-4 h-4" />
            <span>A4 プレビュー</span>
          </div>

          {/* AI Background Analysis Status Badge */}
          {isAnalyzingTerms ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border-2 border-amber-500 text-amber-950 text-xs font-bold font-mono rounded shadow-[2px_2px_0px_0px_rgba(245,158,11,1)] animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
              <span>AI難解用語を解析中...</span>
            </div>
          ) : difficultTerms.length > 0 ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black text-white border-2 border-black text-xs font-bold font-mono rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>難解用語 {difficultTerms.length}件検出（下線クリックで解説）</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-950 border-2 border-emerald-500 text-xs font-bold font-mono rounded shadow-[2px_2px_0px_0px_rgba(16,185,129,1)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>用語難易度チェック済み（平易表現）</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            id="btn-reupload"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold font-mono text-black hover:bg-neutral-100 border-2 border-black transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再アップロード</span>
          </button>

          <button
            id="btn-save-cloud"
            onClick={handleSaveToCloud}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer shrink-0 ${
              saveSuccess
                ? 'bg-emerald-400 text-black border-black'
                : 'bg-yellow-300 hover:bg-yellow-400 text-black'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 text-black" />
            ) : (
              <Cloud className="w-4 h-4" />
            )}
            <span>{isSaving ? '保存中...' : saveSuccess ? '保存完了！' : 'クラウドに保存'}</span>
          </button>

          <button
            id="btn-download-pdf-main"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'PDF生成中...' : 'PDFをダウンロード'}</span>
          </button>
        </div>
      </div>

      {/* PDF PRINT PREVIEW */}
      <div className="bg-neutral-200/70 p-4 sm:p-8 rounded-lg overflow-x-auto flex justify-center">
        {/* The Actual Pure Printable Document */}
        <div
          id="printable-a4-document"
          ref={printableContainerRef}
          className="bg-white text-black shadow-xl"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm 15mm',
            fontFamily: 'sans-serif',
            fontSize: '11pt',
            lineHeight: '1.8',
            color: '#000000',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box',
          }}
        >
          {/* Document Header */}
          <div style={{ marginBottom: '35px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <h1
              style={{
                fontSize: '20pt',
                fontWeight: '700',
                lineHeight: '1.3',
                color: '#000000',
                marginBottom: '8px',
                border: 'none',
                background: 'none',
              }}
            >
              {data.title}
            </h1>
            <div
              style={{
                fontSize: '9pt',
                color: '#000000',
                marginTop: '4px',
                letterSpacing: '0.05em',
              }}
            >
              講義用ミニマル学習ノート（認知心理学最適化フォーマット）
            </div>
          </div>

          {/* Section 1: Core Points */}
          <div style={{ marginBottom: '32px' }}>
            <h2
              style={{
                fontSize: '14pt',
                fontWeight: '700',
                color: '#000000',
                marginTop: '28px',
                marginBottom: '16px',
                border: 'none',
                background: 'none',
                pageBreakAfter: 'avoid',
                breakAfter: 'avoid',
              }}
            >
              1. 核心要約 (Core Points)
            </h2>
            <ul style={{ paddingLeft: '20px', margin: '0' }}>
              {data.core_points.map((pt, i) => (
                <li key={i} style={{ marginBottom: '12px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  {pt}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Key Terms */}
          <div style={{ marginBottom: '32px' }}>
            <div className="flex items-baseline justify-between" style={{ pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
              <h2
                style={{
                  fontSize: '14pt',
                  fontWeight: '700',
                  color: '#000000',
                  marginTop: '28px',
                  marginBottom: '16px',
                  border: 'none',
                  background: 'none',
                }}
              >
                2. 重要単語集 (Key Terms)
              </h2>
              <span className="text-[10px] font-mono text-neutral-600 hidden sm:inline">
                💡 単語名または「具体例」をクリックして超平易な説明を表示
              </span>
            </div>
            <div>
              {data.key_terms.map((kt, i) => (
                <div key={i} style={{ marginBottom: '14px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleOpenAbstractExplanation(kt)}
                      className="text-left font-bold text-black hover:text-amber-800 hover:underline cursor-pointer group inline-flex items-center gap-1.5 align-baseline"
                      style={{ fontWeight: '700' }}
                      title="クリックして具体例と低抽象度の解説を表示"
                    >
                      <span>{kt.term}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-amber-100 hover:bg-yellow-300 border border-black text-black rounded no-underline transition-colors">
                        <Lightbulb className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>具体例</span>
                      </span>
                    </button>
                    <span style={{ margin: '0 6px' }}>:</span>
                    <span>{renderDefinitionWithHighlights(kt.definition, i)}</span>
                  </div>
                  {kt.annotations && kt.annotations.length > 0 && (
                    <div style={{ marginTop: '4px', paddingLeft: '12px' }}>
                      {kt.annotations.map((ann) => (
                        <div key={ann.id} style={{ marginTop: '3px', fontSize: '10pt', color: '#000000' }}>
                          <span style={{ fontWeight: '700' }}>※{ann.word}</span>
                          <span style={{ margin: '0 6px' }}>:</span>
                          <span>{ann.explanation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Abstract Term Modal for Concrete Examples & Low-Abstraction Explanation */}
      <AbstractTermModal
        isOpen={isAbstractModalOpen}
        term={selectedAbstractKeyTerm}
        explanation={currentAbstractExplanation}
        isLoading={isAbstractLoading}
        onClose={() => setIsAbstractModalOpen(false)}
        onAddAnnotation={handleAddAnnotationFromAbstract}
      />

      {/* Simplified Term Explanation Modal */}
      {selectedDifficultTerm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-black text-white">
                  <BookOpen className="w-5 h-5" />
                </span>
                <h3 className="font-black text-lg text-black uppercase font-mono tracking-tight">
                  難解用語のかみくだいた解説
                </h3>
              </div>
              <button
                onClick={() => setSelectedDifficultTerm(null)}
                className="p-1 hover:bg-neutral-100 border border-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-neutral-100 border-2 border-black font-mono">
                <div className="text-xs font-bold text-neutral-500 uppercase">対象の用語</div>
                <div className="text-lg font-black text-black">
                  「{selectedDifficultTerm.difficultWord}」
                </div>
              </div>

              <div className="p-4 bg-amber-50 border-2 border-black font-sans">
                <div className="text-xs font-bold text-amber-900 font-mono mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>AIによる平易・直感的な解説</span>
                </div>
                <div className="text-sm font-bold text-black leading-relaxed">
                  {selectedDifficultTerm.simplifiedExplanation}
                </div>
              </div>

              {selectedDifficultTerm.suggestedReplacement && (
                <div className="p-3 bg-neutral-50 border-2 border-black text-xs">
                  <span className="font-bold font-mono text-neutral-600 block mb-1">
                    推奨される置き換え言葉:
                  </span>
                  <span className="font-bold text-black bg-yellow-200 px-1.5 py-0.5 border border-black">
                    {selectedDifficultTerm.suggestedReplacement}
                  </span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <button
                  onClick={() => setSelectedDifficultTerm(null)}
                  className="w-full sm:w-auto px-4 py-2 border-2 border-black text-xs font-bold font-mono hover:bg-neutral-100 cursor-pointer"
                >
                  閉じる
                </button>

                {selectedDifficultTerm.suggestedReplacement && (
                  <button
                    onClick={() => handleReplaceWithSimplified(selectedDifficultTerm)}
                    className="w-full sm:w-auto px-4 py-2 bg-white text-black hover:bg-yellow-100 border-2 border-black text-xs font-black font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                  >
                    <span>言葉を置き換える</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleAddFootnote(selectedDifficultTerm)}
                  className="w-full sm:w-auto px-4 py-2 bg-black text-white hover:bg-neutral-800 border-2 border-black text-xs font-black font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                >
                  <span>単語説明の下に注釈を追加</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

