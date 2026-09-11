import React, { useState, useRef } from 'react';
import { Upload, FileText, ArrowRight, Sparkles, Check, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onSampleSelect: () => void;
  isProcessing: boolean;
  error?: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onSampleSelect,
  isProcessing,
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        onFileSelect(file);
      } else {
        alert('PDF形式のファイルを選択してください。');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div id="file-upload-container" className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight uppercase leading-none mb-3">
          講義PDFを最適化ノートへ変換
        </h2>
        <p className="text-sm font-medium text-neutral-700 max-w-lg mx-auto leading-relaxed">
          認知負荷を最小限に抑えた白黒ミニマル構成。
          Goodnotes等のタブレットマーキングやプリント学習に最適化された要約・単語集を生成。
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-black text-black text-xs font-mono font-bold flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-black uppercase tracking-wider text-sm mb-0.5">処理エラー (ERROR)</p>
            <p className="font-medium text-neutral-900">{error}</p>
          </div>
        </div>
      )}

      {/* Main Drag and Drop Box */}
      <div
        id="pdf-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-4 border-black p-8 sm:p-12 text-center cursor-pointer transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${
          isDragOver ? 'bg-neutral-200' : 'bg-white hover:bg-neutral-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,application/pdf"
          className="hidden"
          id="input-file-pdf"
        />

        <div className="w-16 h-16 bg-black text-white border-2 border-black flex items-center justify-center mx-auto mb-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Upload className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-base font-black uppercase tracking-tight text-black mb-1">
          講義PDFをここにドラッグ＆ドロップ
        </h3>
        <p className="text-xs font-mono font-bold text-neutral-600 mb-6 uppercase">
          またはクリックしてファイルを選択 (.PDF MAX 20MB)
        </p>

        <button
          type="button"
          disabled={isProcessing}
          className="inline-flex items-center justify-center px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-wider border-2 border-black hover:bg-neutral-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
        >
          PDFファイルを選択
        </button>
      </div>

      {/* Sample Lecture Button */}
      <div className="mt-8 pt-6 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-bold text-neutral-800 text-center sm:text-left font-mono">
          <span className="bg-black text-white px-1.5 py-0.5 mr-1 font-mono uppercase text-[10px]">TRIAL</span>
          手元にファイルがない場合はサンプルで試せます
        </div>

        <button
          id="btn-try-sample"
          type="button"
          onClick={onSampleSelect}
          disabled={isProcessing}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black bg-white border-2 border-black hover:bg-black hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>サンプル講義（認知心理学）で試す</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
