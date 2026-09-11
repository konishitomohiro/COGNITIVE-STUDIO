import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { CognitiveGuideModal } from './components/CognitiveGuideModal';
import { SavedNotesModal } from './components/SavedNotesModal';
import { FileUpload } from './components/FileUpload';
import { ProcessingState } from './components/ProcessingState';
import { PdfViewerAndEditor } from './components/PdfViewerAndEditor';
import { LectureStudyData, ProcessResponse } from './types';
import { SAMPLE_LECTURE_DATA } from './data/sampleLecture';

function MainApp() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSavedNotesOpen, setIsSavedNotesOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [studyData, setStudyData] = useState<LectureStudyData | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setProcessingFile(file.name);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdfFile', file);

      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON server response:', textResponse);
        throw new Error('サーバー応答エラーが発生しました。時間を置いて再試行するか、新しいタブでアプリを開いてお試しください。');
      }

      const result: ProcessResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'PDFの解析に失敗しました。');
      }

      setStudyData(result.data);
    } catch (err: any) {
      console.error('File processing error:', err);
      setError(
        err.message ||
          'PDFファイルの読み込みに失敗しました。テキストが含まれる正しい講義PDFを選択してください。'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSampleSelect = () => {
    setIsProcessing(true);
    setProcessingFile('心理学概論：ワーキングメモリと長期記憶.pdf (サンプル資料)');
    setError(null);

    setTimeout(() => {
      setStudyData(SAMPLE_LECTURE_DATA);
      setIsProcessing(false);
    }, 1800);
  };

  const handleReset = () => {
    setStudyData(null);
    setError(null);
    setProcessingFile(undefined);
  };

  const handleSelectNoteFromHistory = (noteData: LectureStudyData) => {
    setStudyData(noteData);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans antialiased">
      <Header
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSavedNotes={() => setIsSavedNotesOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {isProcessing ? (
          <ProcessingState filename={processingFile} />
        ) : studyData ? (
          <PdfViewerAndEditor initialData={studyData} onReset={handleReset} />
        ) : (
          <FileUpload
            onFileSelect={handleFileSelect}
            onSampleSelect={handleSampleSelect}
            isProcessing={isProcessing}
            error={error}
          />
        )}
      </main>

      <footer className="border-t-4 border-black bg-white py-6 text-center text-xs text-black font-mono font-bold">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            MINIMALIST LECTURE PDF CONVERTER &mdash; 認知心理学最適化
          </div>
          <div className="bg-black text-white px-2 py-1 text-[10px] uppercase font-black">
            POWERED BY GEMINI 3.6 FLASH &amp; GOOGLE AI STUDIO
          </div>
        </div>
      </footer>

      <CognitiveGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <SavedNotesModal
        isOpen={isSavedNotesOpen}
        onClose={() => setIsSavedNotesOpen(false)}
        onSelectNote={handleSelectNoteFromHistory}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
